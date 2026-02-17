import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { Form, FormResponse } from "@/types/database";

interface RouteParams {
    params: { formId: string };
}

// GET /api/forms/[formId]/responses — List responses for a form
export async function GET(request: Request, { params }: RouteParams) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();

        // Verify form belongs to tenant
        const formSnap = await db.ref(`forms/${params.formId}`).once("value");
        const form = formSnap.val() as Form | null;
        if (!form || form.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        // Get responses
        const snapshot = await db.ref(`form_responses/${params.formId}`).once("value");
        const responsesMap = snapshot.val() || {};
        const responses = Object.values(responsesMap) as FormResponse[];
        responses.sort((a, b) => b.submitted_at - a.submitted_at);

        return NextResponse.json({ responses, form });
    } catch (error: any) {
        console.error("List responses error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
