import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { SignatureRequest, Signer } from "@/types/database";
import { randomBytes } from "crypto";

type RouteParams = { params: Promise<{ requestId: string }> };

// POST — Add a signer
export async function POST(request: Request, { params }: RouteParams) {
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
        if (sigReq.status !== "draft") return NextResponse.json({ error: "Cannot modify signers after sending" }, { status: 400 });

        const body = await request.json();
        const { name, email, role } = body;

        if (!name || !email) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

        const signerId = randomBytes(8).toString("hex");
        const signToken = randomBytes(24).toString("hex");

        const signer: Signer = {
            id: signerId,
            name,
            email,
            role: role || "Signer",
            order: (sigReq.signers?.length || 0) + 1,
            status: "pending",
            sign_token: signToken,
        };

        const updatedSigners = [...(sigReq.signers || []), signer];
        await ref.update({ signers: updatedSigners, updated_at: Date.now() });

        return NextResponse.json({ signer }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to add signer" }, { status: 500 });
    }
}

// DELETE — Remove a signer
export async function DELETE(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    const { requestId } = await params;

    try {
        const { searchParams } = new URL(request.url);
        const signerId = searchParams.get("signerId");
        if (!signerId) return NextResponse.json({ error: "signerId is required" }, { status: 400 });

        const db = getAdminDatabase();
        const ref = db.ref(`signature_requests/${requestId}`);
        const snapshot = await ref.once("value");
        const sigReq: SignatureRequest | null = snapshot.val();

        if (!sigReq) return NextResponse.json({ error: "Request not found" }, { status: 404 });
        if (sigReq.tenant_id !== user.tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        if (sigReq.status !== "draft") return NextResponse.json({ error: "Cannot modify signers after sending" }, { status: 400 });

        const updatedSigners = (sigReq.signers || [])
            .filter(s => s.id !== signerId)
            .map((s, i) => ({ ...s, order: i + 1 }));

        // Also remove fields assigned to this signer
        const updatedFields = (sigReq.fields || []).filter(f => f.signer_id !== signerId);

        await ref.update({ signers: updatedSigners, fields: updatedFields, updated_at: Date.now() });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to remove signer" }, { status: 500 });
    }
}
