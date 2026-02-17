import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { SignatureRequest, SignatureAuditEntry } from "@/types/database";

type RouteParams = { params: Promise<{ requestId: string }> };

// GET — Download signed document info (returns document URL + all field values)
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

        // Log download audit
        const auditRef = db.ref("signature_audit").push();
        await auditRef.set({
            id: auditRef.key!,
            request_id: requestId,
            action: "downloaded",
            actor_name: `${user.first_name} ${user.last_name}`,
            actor_email: user.email,
            timestamp: Date.now(),
        } as SignatureAuditEntry);

        return NextResponse.json({
            document_url: sigReq.document_url,
            document_name: sigReq.document_name,
            fields: sigReq.fields,
            signers: sigReq.signers,
            status: sigReq.status,
            completed_at: sigReq.completed_at,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to prepare download" }, { status: 500 });
    }
}
