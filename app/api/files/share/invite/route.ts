import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { db } from "@/lib/database/schema";
import { User, File } from "@/types/database";
import { sendEmail } from "@/lib/email/email-service";
import { getFileSharedEmailTemplate } from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications/notification-service";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { fileId, emails, message } = await request.json();

        if (!fileId || !emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json({ error: "Missing fileId or emails" }, { status: 400 });
        }

        const file = await db.get<File>(`files/${fileId}`);
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        if (file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const results = [];

        for (const email of emails) {
            // 1. Generate a secure share link (or use a generic one if auth required)
            // For now, let's generate a unique token for this share
            const token = uuidv4();
            const shareLink = {
                id: uuidv4(),
                file_id: fileId,
                tenant_id: file.tenant_id, // Add tenant_id
                token,
                created_by: user.id,
                created_at: Date.now(),
                expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                access_count: 0,
                is_active: true,
                email_recipient: email // Store who this was sent to
            };

            await db.set(`share_links/${shareLink.id}`, shareLink);
            // Also map token to link ID for lookup
            await db.set(`share_tokens/${token}`, shareLink.id);

            const fileLink = `${request.headers.get("origin")}/share/${token}`;
            const html = getFileSharedEmailTemplate(
                `${user.first_name} ${user.last_name}`,
                file.name,
                fileLink
            );

            // 2. Send Email
            const emailResult = await sendEmail({
                to: email,
                subject: `${user.first_name} shared "${file.name}" with you`,
                html,
                text: `${user.first_name} shared "${file.name}" with you. View it here: ${fileLink}`
            });

            // 3. Create Notification (if recipient is a user in the system)
            // We'd need to lookup user by email.
            // This is efficient only if we have an email index.
            // For now, we skip internal notification if we can't easily find the user ID.
            // TO DO: Implement user lookup by email.

            // 4. Log audit?

            results.push({ email, success: emailResult.success });
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Share invite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
