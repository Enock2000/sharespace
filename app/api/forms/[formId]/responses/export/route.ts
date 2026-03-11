import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { Form, FormResponse, FormField } from "@/types/database";

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: { formId: string };
}

// GET /api/forms/[formId]/responses/export — Export responses as CSV
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
        responses.sort((a, b) => a.submitted_at - b.submitted_at);

        // Build CSV
        const fields = form.fields || [];
        const headers = [
            "Response ID",
            "Submitted At",
            "Status",
            "Email",
            ...fields.map(f => f.label),
        ];

        const rows = responses.map(r => {
            const row = [
                r.id,
                new Date(r.submitted_at).toISOString(),
                r.status,
                r.respondent_email || "",
                ...fields.map(f => {
                    const val = r.answers?.[f.id];
                    if (val === undefined || val === null) return "";
                    if (Array.isArray(val)) return val.join("; ");
                    return String(val);
                }),
            ];
            return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",");
        });

        const csv = [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");

        return new Response(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses.csv"`,
            },
        });
    } catch (error: any) {
        console.error("Export responses error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
