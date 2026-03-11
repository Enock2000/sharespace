import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { db } from "@/lib/database/schema";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const isValid = await verifyTwoFactorToken(user.id, token);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid token" }, { status: 400 });
        }

        // Enable 2FA for user
        await db.update(`users/${user.id}`, { is_2fa_enabled: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
