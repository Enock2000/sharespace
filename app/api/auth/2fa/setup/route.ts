import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { generateTwoFactorSecret } from "@/lib/auth/two-factor";

export async function POST(req: Request) {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { secret, otpauthUrl, qrCodeUrl } = await generateTwoFactorSecret(user.id, user.email);

        return NextResponse.json({
            secret,
            otpauthUrl,
            qrCodeUrl
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
