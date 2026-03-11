import { NextResponse } from "next/server";
import { verifyTwoFactorToken } from "@/lib/auth/two-factor";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";

import { rateLimiter } from "@/lib/utils/rate-limiter";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Limit to 5 attempts per 15 minutes per IP
    if (!rateLimiter.check(ip, 5, 15 * 60 * 1000)) {
        return NextResponse.json(
            { error: "Too many attempts. Please try again later." },
            { status: 429 }
        );
    }

    // This route is public (used during login), so we verify userId + token
    try {
        const { userId, token } = await req.json();

        if (!userId || !token) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await verifyTwoFactorToken(userId, token);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid code" }, { status: 401 });
        }

        // Return success
        // In a real app with custom claims, we would return a new token here
        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
