import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { Form } from "@/types/database";

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: { formId: string };
}

// GET /api/forms/[formId] — Get a single form
export async function GET(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref(`forms/${params.formId}`).once("value");
        const form = snapshot.val() as Form | null;

        if (!form || form.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        return NextResponse.json({ form });
    } catch (error: any) {
        console.error("Get form error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/forms/[formId] — Update a form
export async function PUT(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref(`forms/${params.formId}`).once("value");
        const existingForm = snapshot.val() as Form | null;

        if (!existingForm || existingForm.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        const body = await request.json();
        const updates: Partial<Form> & { updated_at: number } = {
            updated_at: Date.now(),
        };

        if (body.title !== undefined) updates.title = body.title.trim();
        if (body.description !== undefined) updates.description = body.description;
        if (body.fields !== undefined) updates.fields = body.fields;
        if (body.settings !== undefined) updates.settings = { ...existingForm.settings, ...body.settings };
        if (body.status !== undefined) updates.status = body.status;

        await db.ref(`forms/${params.formId}`).update(updates);
        const updatedSnapshot = await db.ref(`forms/${params.formId}`).once("value");
        return NextResponse.json({ form: updatedSnapshot.val() });
    } catch (error: any) {
        console.error("Update form error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/forms/[formId] — Delete a form and its responses
export async function DELETE(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref(`forms/${params.formId}`).once("value");
        const form = snapshot.val() as Form | null;

        if (!form || form.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        // Delete form and all its responses
        await db.ref(`forms/${params.formId}`).remove();
        await db.ref(`form_responses/${params.formId}`).remove();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete form error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
