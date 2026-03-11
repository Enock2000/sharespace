import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { SignatureRequest, SignatureAuditEntry } from "@/types/database";

export const dynamic = 'force-dynamic';

// GET — List all signature requests for tenant
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref("signature_requests").orderByChild("tenant_id").equalTo(user.tenant_id).once("value");
        const data = snapshot.val() || {};

        const requests: SignatureRequest[] = Object.values(data);
        requests.sort((a, b) => b.created_at - a.created_at);

        return NextResponse.json({ requests });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch signature requests" }, { status: 500 });
    }
}

// POST — Create a new signature request
export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const body = await request.json();
        const { title, document_url, document_name, document_pages, message, signing_order, expires_at } = body;

        if (!title || !document_url || !document_name) {
            return NextResponse.json({ error: "Title, document URL, and document name are required" }, { status: 400 });
        }

        const db = getAdminDatabase();
        const ref = db.ref("signature_requests").push();

        const signatureRequest: SignatureRequest = {
            id: ref.key!,
            tenant_id: user.tenant_id,
            created_by: user.id,
            title,
            message: message || "",
            document_url,
            document_name,
            document_pages: document_pages || 1,
            fields: [],
            signers: [],
            status: "draft",
            signing_order: signing_order || "sequential",
            expires_at: expires_at || undefined,
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        await ref.set(signatureRequest);

        // Create audit entry
        const auditRef = db.ref("signature_audit").push();
        const auditEntry: SignatureAuditEntry = {
            id: auditRef.key!,
            request_id: ref.key!,
            action: "created",
            actor_name: `${user.first_name} ${user.last_name}`,
            actor_email: user.email,
            timestamp: Date.now(),
        };
        await auditRef.set(auditEntry);

        return NextResponse.json({ request: signatureRequest }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create signature request" }, { status: 500 });
    }
}
