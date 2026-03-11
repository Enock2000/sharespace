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
        const { reason } = body;

        const db = getFirebaseDatabase();
        const requestsRef = ref(db, "account_deletion_requests");

        // Push full deletion request to DB
        const newRequestRef = await push(requestsRef, {
            user_id: user.id,
            user_email: user.email,
            reason: reason || "No reason provided",
            status: "pending",
            requested_at: serverTimestamp()
        });

        // Email to admin
        const adminEmailAsync = sendEmail({
            to: process.env.ADMIN_EMAIL || "support@sharedspacesoi.com",
            subject: `🚨 Account Deletion Request: ${user.email}`,
            html: `
                <h3>Account Deletion Requested</h3>
                <p>User <strong>${user.email}</strong> (ID: ${user.id}) has requested account deletion.</p>
                <p><strong>Reason provided:</strong> ${reason || "None"}</p>
                <p>Please review and process according to the data retention policy.</p>
                <p>Request ID: ${newRequestRef.key}</p>
            `
        });

        // Email to user confirming request received
        const userEmailAsync = sendEmail({
            to: user.email,
            subject: "We received your account deletion request",
            html: `
                <p>Hi ${user.first_name || 'there'},</p>
                <p>We have successfully received your request to delete your Shared Spaces account and all associated data.</p>
                <p>Our team will process this request within the legally required timeframe.</p>
                <p>If you made this request by mistake, please reply to this email immediately.</p>
                <p>Thank you,<br>The Shared Spaces Team</p>
            `
        });

        await Promise.allSettled([adminEmailAsync, userEmailAsync]);

        return NextResponse.json({ success: true, request_id: newRequestRef.key }, { status: 201 });
    } catch (error: any) {
        console.error("Account deletion request error:", error);
        return NextResponse.json({ error: "Failed to submit account deletion request" }, { status: 500 });
    }
}
