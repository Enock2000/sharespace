import { NextResponse } from "next/server";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { Form, FormResponse, FormField } from "@/types/database";

interface RouteParams {
    params: { token: string };
}

// Helper to find form by share token
async function findFormByToken(token: string): Promise<Form | null> {
    const db = getAdminDatabase();
    const snapshot = await db.ref("forms").orderByChild("settings/share_token").equalTo(token).once("value");
    const formsMap = snapshot.val();
    if (!formsMap) return null;
    const forms = Object.values(formsMap) as Form[];
    return forms[0] || null;
}

// GET /api/public/forms/[token] — Get published form (no auth)
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const form = await findFormByToken(params.token);
        if (!form) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        if (form.status !== "published") {
            return NextResponse.json({ error: "This form is not accepting responses" }, { status: 403 });
        }

        // Check expiry
        if (form.settings.expires_at && Date.now() > form.settings.expires_at) {
            return NextResponse.json({ error: "This form has expired" }, { status: 410 });
        }

        // Check max responses
        if (form.settings.max_responses && form.response_count >= form.settings.max_responses) {
            return NextResponse.json({ error: "This form has reached its maximum responses" }, { status: 410 });
        }

        // Return form without sensitive settings
        const publicForm = {
            id: form.id,
            title: form.title,
            description: form.description,
            fields: form.fields,
            settings: {
                thank_you_message: form.settings.thank_you_message,
                redirect_url: form.settings.redirect_url,
                has_password: !!form.settings.password,
            },
        };

        return NextResponse.json({ form: publicForm });
    } catch (error: any) {
        console.error("Get public form error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/public/forms/[token] — Submit a response (no auth)
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const form = await findFormByToken(params.token);
        if (!form) {
            return NextResponse.json({ error: "Form not found" }, { status: 404 });
        }

        if (form.status !== "published") {
            return NextResponse.json({ error: "This form is not accepting responses" }, { status: 403 });
        }

        // Check expiry
        if (form.settings.expires_at && Date.now() > form.settings.expires_at) {
            return NextResponse.json({ error: "This form has expired" }, { status: 410 });
        }

        // Check max responses
        if (form.settings.max_responses && form.response_count >= form.settings.max_responses) {
            return NextResponse.json({ error: "This form has reached its maximum responses" }, { status: 410 });
        }

        const body = await request.json();
        const { answers, password, respondent_email, file_attachments } = body;

        // Check password if required
        if (form.settings.password && form.settings.password !== password) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        // Validate required fields
        const fields = form.fields || [];
        for (const field of fields) {
            if (field.required) {
                const value = answers?.[field.id];
                if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                    return NextResponse.json(
                        { error: `Field "${field.label}" is required`, field_id: field.id },
                        { status: 400 }
                    );
                }
            }
        }

        // Validate field values
        for (const field of fields) {
            const value = answers?.[field.id];
            if (value === undefined || value === null || value === "") continue;

            const v = field.validation;
            if (!v) continue;

            if (field.type === "short_text" || field.type === "long_text") {
                if (v.min_length && String(value).length < v.min_length) {
                    return NextResponse.json({ error: `"${field.label}" must be at least ${v.min_length} characters`, field_id: field.id }, { status: 400 });
                }
                if (v.max_length && String(value).length > v.max_length) {
                    return NextResponse.json({ error: `"${field.label}" must be at most ${v.max_length} characters`, field_id: field.id }, { status: 400 });
                }
                if (v.regex) {
                    try {
                        const re = new RegExp(v.regex);
                        if (!re.test(String(value))) {
                            return NextResponse.json({ error: `"${field.label}" format is invalid`, field_id: field.id }, { status: 400 });
                        }
                    } catch { /* ignore invalid regex */ }
                }
            }

            if (field.type === "number" || field.type === "rating") {
                const num = Number(value);
                if (isNaN(num)) {
                    return NextResponse.json({ error: `"${field.label}" must be a number`, field_id: field.id }, { status: 400 });
                }
                if (v.min !== undefined && num < v.min) {
                    return NextResponse.json({ error: `"${field.label}" must be at least ${v.min}`, field_id: field.id }, { status: 400 });
                }
                if (v.max !== undefined && num > v.max) {
                    return NextResponse.json({ error: `"${field.label}" must be at most ${v.max}`, field_id: field.id }, { status: 400 });
                }
            }

            if (field.type === "email") {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(String(value))) {
                    return NextResponse.json({ error: `"${field.label}" must be a valid email address`, field_id: field.id }, { status: 400 });
                }
            }
        }

        // Save response
        const db = getAdminDatabase();
        const responseRef = db.ref(`form_responses/${form.id}`).push();

        const formResponse: FormResponse = {
            id: responseRef.key!,
            form_id: form.id,
            tenant_id: form.tenant_id,
            respondent_email: respondent_email || undefined,
            answers: answers || {},
            file_attachments: file_attachments || undefined,
            status: "new",
            submitted_at: Date.now(),
        };

        await responseRef.set(formResponse);

        // Increment response count
        await db.ref(`forms/${form.id}/response_count`).set((form.response_count || 0) + 1);

        return NextResponse.json({
            success: true,
            thank_you_message: form.settings.thank_you_message,
            redirect_url: form.settings.redirect_url,
        }, { status: 201 });
    } catch (error: any) {
        console.error("Submit form response error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
