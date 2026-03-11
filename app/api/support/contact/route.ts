import { NextResponse } from "next/server";
import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, push, serverTimestamp } from "firebase/database";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { sendEmail } from "@/lib/email/email-service";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authResult = await authenticateRequest(request);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        const body = await request.json();
        const { subject, message } = body;

        if (!subject || !message) {
            return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
        }

        const db = getFirebaseDatabase();
        const ticketsRef = ref(db, "support_tickets");

        // Push full ticket to DB
        const newTicketRef = await push(ticketsRef, {
            user_id: user.id,
            user_email: user.email,
            subject,
            message,
            status: "open",
            created_at: serverTimestamp()
        });

        // Try to trigger an email to admins (fire and forget)
        sendEmail({
            to: process.env.ADMIN_EMAIL || "support@sharedspacesoi.com",
            subject: `New Support Ticket: ${subject}`,
            html: `
                <h3>New Support Request</h3>
                <p><strong>From:</strong> ${user.email} (ID: ${user.id})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem;">${message.replace(/\n/g, '<br/>')}</blockquote>
                <p>Ticket ID: ${newTicketRef.key}</p>
            `,
            text: `New Support Request from ${user.email}\nSubject: ${subject}\nMessage:\n${message}`
        }).catch(err => console.error("Failed to send support alert email:", err));

        // Let user know ticket created successfully
        return NextResponse.json({ success: true, ticket_id: newTicketRef.key }, { status: 201 });
    } catch (error: any) {
        console.error("Support contact error:", error);
        return NextResponse.json({ error: "Failed to submit support request" }, { status: 500 });
    }
}
