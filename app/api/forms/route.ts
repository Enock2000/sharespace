import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { Form, FormField } from "@/types/database";

export const dynamic = 'force-dynamic';

// GET /api/forms — List all forms for the user's tenant
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const db = getAdminDatabase();
        const snapshot = await db.ref("forms").orderByChild("tenant_id").equalTo(user.tenant_id).once("value");
        const formsMap = snapshot.val() || {};
        const forms = Object.values(formsMap) as Form[];
        // Sort by created_at descending
        forms.sort((a, b) => b.created_at - a.created_at);
        return NextResponse.json({ forms });
    } catch (error: any) {
        console.error("List forms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/forms — Create a new form
export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const body = await request.json();
        const { title, description, fields } = body;

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const db = getAdminDatabase();
        const newRef = db.ref("forms").push();
        const shareToken = generateShareToken();

        const form: Form = {
            id: newRef.key!,
            tenant_id: user.tenant_id,
            created_by: user.id,
            title: title.trim(),
            description: description?.trim() || "",
            fields: fields || [],
            settings: {
                is_published: false,
                share_token: shareToken,
                one_per_user: false,
                thank_you_message: "Thank you for your response!",
            },
            status: "draft",
            response_count: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        await newRef.set(form);
        return NextResponse.json({ form }, { status: 201 });
    } catch (error: any) {
        console.error("Create form error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function generateShareToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 12; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
