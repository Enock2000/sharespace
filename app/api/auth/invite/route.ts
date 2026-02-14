import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const { email, role, inviterId } = await request.json();

        if (!email || !inviterId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const inviter = await db.get<User>(`users/${inviterId}`);
        if (!inviter) {
            return NextResponse.json({ error: "Inviter not found" }, { status: 404 });
        }

        // Generate invitation token
        const inviteToken = uuidv4();
        const inviteData = {
            email,
            role: role || "member",
            tenant_id: inviter.tenant_id,
            invited_by: inviterId,
            created_at: Date.now(),
            expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        };

        // Store invitation in database
        await db.set(`invitations/${inviteToken}`, inviteData);

        // TODO: Integrate email service (SendGrid, AWS SES, etc.)
        // For production, replace this with actual email sending
        const inviteLink = `${process.env.NEXTAUTH_URL || 'https://yourapp.vercel.app'}/register?invite=${inviteToken}`;

        console.log(`Invitation created for ${email}`);
        console.log(`Invite link: ${inviteLink}`);
        console.log(`NOTE: In production, send this link via email service`);

        // Log audit event
        await logEvent(
            inviter.tenant_id,
            inviterId,
            "invite_user",
            "user",
            email,
            { role }
        );

        return NextResponse.json({
            success: true,
            message: "Invitation created successfully",
            // Include link in development only
            ...(process.env.NODE_ENV === 'development' && { inviteLink })
        });
    } catch (error: any) {
        console.error("Invite error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
