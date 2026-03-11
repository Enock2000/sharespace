import { NextResponse } from "next/server";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { SignatureRequest, SignatureAuditEntry } from "@/types/database";

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ token: string }> };

// GET — Fetch document and fields for this signer (public, no auth)
export async function GET(request: Request, { params }: RouteParams) {
    const { token } = await params;

    try {
        const db = getAdminDatabase();

        // Find the request+signer by token
        const allSnap = await db.ref("signature_requests").once("value");
        const allData = allSnap.val() || {};

        let foundRequest: SignatureRequest | null = null;
        let foundSignerIndex = -1;

        for (const req of Object.values(allData) as SignatureRequest[]) {
            const idx = (req.signers || []).findIndex(s => s.sign_token === token);
            if (idx !== -1) {
                foundRequest = req;
                foundSignerIndex = idx;
                break;
            }
        }

        if (!foundRequest || foundSignerIndex === -1) {
            return NextResponse.json({ error: "Invalid or expired signing link" }, { status: 404 });
        }

        const signer = foundRequest.signers[foundSignerIndex];

        // Check request status
        if (foundRequest.status === "cancelled") {
            return NextResponse.json({ error: "This signing request has been cancelled" }, { status: 410 });
        }
        if (foundRequest.status === "completed") {
            return NextResponse.json({ error: "This document has already been fully signed" }, { status: 410 });
        }
        if (signer.status === "signed") {
            return NextResponse.json({ error: "You have already signed this document" }, { status: 410 });
        }
        if (signer.status === "declined") {
            return NextResponse.json({ error: "You have declined this signing request" }, { status: 410 });
        }

        // Check expiry
        if (foundRequest.expires_at && Date.now() > foundRequest.expires_at) {
            return NextResponse.json({ error: "This signing request has expired" }, { status: 410 });
        }

        // Check sequential order
        if (foundRequest.signing_order === "sequential") {
            const earlierUnsigned = foundRequest.signers.some(
                s => s.order < signer.order && s.status !== "signed"
            );
            if (earlierUnsigned) {
                return NextResponse.json({ error: "Waiting for previous signers to complete" }, { status: 425 });
            }
        }

        // Log "viewed" event
        if (signer.status === "pending") {
            foundRequest.signers[foundSignerIndex].status = "viewed";
            await db.ref(`signature_requests/${foundRequest.id}/signers/${foundSignerIndex}/status`).set("viewed");

            // Update request status to in_progress if it was pending
            if (foundRequest.status === "pending") {
                await db.ref(`signature_requests/${foundRequest.id}/status`).set("in_progress");
            }

            const auditRef = db.ref("signature_audit").push();
            await auditRef.set({
                id: auditRef.key!,
                request_id: foundRequest.id,
                signer_id: signer.id,
                action: "viewed",
                actor_name: signer.name,
                actor_email: signer.email,
                ip_address: request.headers.get("x-forwarded-for") || "unknown",
                user_agent: request.headers.get("user-agent") || "unknown",
                timestamp: Date.now(),
            } as SignatureAuditEntry);
        }

        // Return only this signer's fields + document info
        const signerFields = (foundRequest.fields || []).filter(f => f.signer_id === signer.id);

        return NextResponse.json({
            request: {
                id: foundRequest.id,
                title: foundRequest.title,
                message: foundRequest.message,
                document_url: foundRequest.document_url,
                document_name: foundRequest.document_name,
                document_pages: foundRequest.document_pages,
            },
            signer: {
                id: signer.id,
                name: signer.name,
                email: signer.email,
                role: signer.role,
            },
            fields: signerFields,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to load signing request" }, { status: 500 });
    }
}

// POST — Submit signed fields (public, no auth)
export async function POST(request: Request, { params }: RouteParams) {
    const { token } = await params;

    try {
        const db = getAdminDatabase();
        const body = await request.json();
        const { field_values, declined } = body;

        // Find request + signer
        const allSnap = await db.ref("signature_requests").once("value");
        const allData = allSnap.val() || {};

        let foundRequest: SignatureRequest | null = null;
        let foundSignerIndex = -1;

        for (const req of Object.values(allData) as SignatureRequest[]) {
            const idx = (req.signers || []).findIndex(s => s.sign_token === token);
            if (idx !== -1) {
                foundRequest = req;
                foundSignerIndex = idx;
                break;
            }
        }

        if (!foundRequest || foundSignerIndex === -1) {
            return NextResponse.json({ error: "Invalid signing link" }, { status: 404 });
        }

        const signer = foundRequest.signers[foundSignerIndex];

        if (signer.status === "signed" || signer.status === "declined") {
            return NextResponse.json({ error: "Already processed" }, { status: 400 });
        }

        if (foundRequest.status === "cancelled" || foundRequest.status === "completed") {
            return NextResponse.json({ error: "Request is no longer active" }, { status: 400 });
        }

        const reqRef = db.ref(`signature_requests/${foundRequest.id}`);
        const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        if (declined) {
            // Handle decline
            await reqRef.child(`signers/${foundSignerIndex}`).update({
                status: "declined",
                ip_address: ipAddress,
                user_agent: userAgent,
            });
            await reqRef.update({ status: "declined", updated_at: Date.now() });

            const auditRef = db.ref("signature_audit").push();
            await auditRef.set({
                id: auditRef.key!,
                request_id: foundRequest.id,
                signer_id: signer.id,
                action: "declined",
                actor_name: signer.name,
                actor_email: signer.email,
                ip_address: ipAddress,
                user_agent: userAgent,
                timestamp: Date.now(),
            } as SignatureAuditEntry);

            return NextResponse.json({ success: true, status: "declined" });
        }

        // Validate required fields
        if (!field_values || typeof field_values !== "object") {
            return NextResponse.json({ error: "Field values are required" }, { status: 400 });
        }

        const signerFields = (foundRequest.fields || []).filter(f => f.signer_id === signer.id);
        for (const field of signerFields) {
            if (field.required && !field_values[field.id]) {
                return NextResponse.json({ error: `"${field.label}" is required`, field_id: field.id }, { status: 400 });
            }
        }

        // Update field values
        const updatedFields = (foundRequest.fields || []).map(f => {
            if (f.signer_id === signer.id && field_values[f.id] !== undefined) {
                return { ...f, value: field_values[f.id] };
            }
            return f;
        });

        // Update signer status
        await reqRef.child(`signers/${foundSignerIndex}`).update({
            status: "signed",
            signed_at: Date.now(),
            ip_address: ipAddress,
            user_agent: userAgent,
        });
        await reqRef.update({ fields: updatedFields, updated_at: Date.now() });

        // Check if all signers have signed
        const allSigners = [...foundRequest.signers];
        allSigners[foundSignerIndex] = { ...allSigners[foundSignerIndex], status: "signed" };
        const allSigned = allSigners.every(s => s.status === "signed");

        if (allSigned) {
            await reqRef.update({ status: "completed", completed_at: Date.now() });
            const auditRef2 = db.ref("signature_audit").push();
            await auditRef2.set({
                id: auditRef2.key!,
                request_id: foundRequest.id,
                action: "completed",
                actor_name: "System",
                timestamp: Date.now(),
                details: "All signers have completed signing",
            } as SignatureAuditEntry);
        }

        // Log signed audit
        const auditRef = db.ref("signature_audit").push();
        await auditRef.set({
            id: auditRef.key!,
            request_id: foundRequest.id,
            signer_id: signer.id,
            action: "signed",
            actor_name: signer.name,
            actor_email: signer.email,
            ip_address: ipAddress,
            user_agent: userAgent,
            timestamp: Date.now(),
        } as SignatureAuditEntry);

        return NextResponse.json({ success: true, status: allSigned ? "completed" : "signed" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to process signature" }, { status: 500 });
    }
}
