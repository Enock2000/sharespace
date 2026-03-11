import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { SignatureRequest, SignatureAuditEntry, Signer } from "@/types/database";

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ requestId: string }> };

// GET — Get signature request detail
export async function GET(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    const { requestId } = await params;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref(`signature_requests/${requestId}`).once("value");
        const sigReq: SignatureRequest | null = snapshot.val();

        if (!sigReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (sigReq.tenant_id !== user.tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        // Fetch audit trail
        const auditSnap = await db.ref("signature_audit").orderByChild("request_id").equalTo(requestId).once("value");
        const auditData = auditSnap.val() || {};
        const audit: SignatureAuditEntry[] = Object.values(auditData);
        audit.sort((a, b) => a.timestamp - b.timestamp);

        return NextResponse.json({ request: sigReq, audit });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch signature request" }, { status: 500 });
    }
}

// PUT — Update signature request (fields, signers, status, send)
export async function PUT(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    const { requestId } = await params;

    try {
        const db = getAdminDatabase();
        const ref = db.ref(`signature_requests/${requestId}`);
        const snapshot = await ref.once("value");
        const sigReq: SignatureRequest | null = snapshot.val();

        if (!sigReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (sigReq.tenant_id !== user.tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const body = await request.json();
        const { title, message, fields, signers, status, signing_order, expires_at } = body;

        const updates: Partial<SignatureRequest> = { updated_at: Date.now() };
        if (title !== undefined) updates.title = title;
        if (message !== undefined) updates.message = message;
        if (fields !== undefined) updates.fields = fields;
        if (signers !== undefined) updates.signers = signers;
        if (signing_order !== undefined) updates.signing_order = signing_order;
        if (expires_at !== undefined) updates.expires_at = expires_at;

        // Handle status transitions
        if (status !== undefined && status !== sigReq.status) {
            updates.status = status;

            if (status === "pending" && sigReq.status === "draft") {
                // Send for signing — log audit
                const auditRef = db.ref("signature_audit").push();
                await auditRef.set({
                    id: auditRef.key!,
                    request_id: requestId,
                    action: "sent",
                    actor_name: `${user.first_name} ${user.last_name}`,
                    actor_email: user.email,
                    timestamp: Date.now(),
                } as SignatureAuditEntry);
            }

            if (status === "cancelled") {
                updates.cancelled_at = Date.now();
                const auditRef = db.ref("signature_audit").push();
                await auditRef.set({
                    id: auditRef.key!,
                    request_id: requestId,
                    action: "cancelled",
                    actor_name: `${user.first_name} ${user.last_name}`,
                    actor_email: user.email,
                    timestamp: Date.now(),
                } as SignatureAuditEntry);
            }
        }

        await ref.update(updates);
        const updated = (await ref.once("value")).val();

        return NextResponse.json({ request: updated });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update signature request" }, { status: 500 });
    }
}

// DELETE — Delete signature request
export async function DELETE(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    const { requestId } = await params;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref(`signature_requests/${requestId}`).once("value");
        const sigReq: SignatureRequest | null = snapshot.val();

        if (!sigReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (sigReq.tenant_id !== user.tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        await db.ref(`signature_requests/${requestId}`).remove();

        // Clean audit entries
        const auditSnap = await db.ref("signature_audit").orderByChild("request_id").equalTo(requestId).once("value");
        const auditKeys = Object.keys(auditSnap.val() || {});
        const auditDeletes: Record<string, null> = {};
        auditKeys.forEach(k => auditDeletes[`signature_audit/${k}`] = null);
        if (auditKeys.length > 0) await db.ref().update(auditDeletes);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete signature request" }, { status: 500 });
    }
}
