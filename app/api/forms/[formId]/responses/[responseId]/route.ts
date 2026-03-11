import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { Form, FormResponse } from "@/types/database";

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: { formId: string; responseId: string };
}

// GET /api/forms/[formId]/responses/[responseId] — Get single response
export async function GET(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();

        const formSnap = await db.ref(`forms/${params.formId}`).once("value");
        const form = formSnap.val() as Form | null;
        if (!form || form.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        const snapshot = await db.ref(`form_responses/${params.formId}/${params.responseId}`).once("value");
        const response = snapshot.val() as FormResponse | null;
        if (!response) {
            return NextResponse.json({ error: "Response not found" }, { status: 404 });
        }

        return NextResponse.json({ response, form });
    } catch (error: any) {
        console.error("Get response error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/forms/[formId]/responses/[responseId] — Update response status
export async function PATCH(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();

        const formSnap = await db.ref(`forms/${params.formId}`).once("value");
        const form = formSnap.val() as Form | null;
        if (!form || form.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        const body = await request.json();
        const { status } = body;

        if (!["new", "in_review", "approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await db.ref(`form_responses/${params.formId}/${params.responseId}`).update({ status });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update response error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/forms/[formId]/responses/[responseId] — Delete a response
export async function DELETE(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();

        const formSnap = await db.ref(`forms/${params.formId}`).once("value");
        const form = formSnap.val() as Form | null;
        if (!form || form.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        await db.ref(`form_responses/${params.formId}/${params.responseId}`).remove();

        // Decrement response count
        const newCount = Math.max(0, (form.response_count || 0) - 1);
        await db.ref(`forms/${params.formId}/response_count`).set(newCount);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete response error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
