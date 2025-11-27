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

        console.log(`[MOCK EMAIL] Invitation sent to ${email} from ${inviter.email} for role ${role}`);
        console.log(`[MOCK EMAIL] Link: http://localhost:3000/register?invite=${uuidv4()}`);

        // Log audit event
        await logEvent(
            inviter.tenant_id,
            inviterId,
            "invite_user",
            "user",
            email,
            { role }
        );

        return NextResponse.json({ success: true, message: "Invitation sent" });
    } catch (error: any) {
        console.error("Invite error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
