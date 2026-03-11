
import { NextResponse } from "next/server";
import { sendNotificationEmail } from "@/lib/utils/email";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { name, email, message } = await request.json();

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Send email to admin/support
        // In a real app, this would go to a configured support email
        // utilizing the existing email service
        await sendNotificationEmail(
            "support@sharedspaces.com", // This would be the admin email
            `New Contact Form Submission from ${name}`,
            `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
