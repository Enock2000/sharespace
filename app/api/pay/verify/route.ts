import { verifyPayment } from "@/lib/payments/lenco";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const reference = searchParams.get("reference");

        if (!reference) {
            return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
        }

        const result: any = await verifyPayment(reference);

        if (!result.success) {
            return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
        }

        // Lenco API response structure check - assuming 'data.status' is available
        // If status is 'successful' or 'paid'
        const status = result.data?.status;
        if (status !== 'successful' && status !== 'paid') {
            return NextResponse.json({ success: false, error: `Payment status: ${status}` });
        }

        // Update Tenant Plan
        await db.update(`tenants/${user.tenant_id}`, {
            plan: "pro",
            storage_quota: 250 * 1024 * 1024 * 1024, // 250GB
            user_limit: 999999 // Unlimited
        });

        await logEvent(user.tenant_id, user.id, "upgrade_plan", "tenant", user.tenant_id, {
            plan: "pro",
            amount: result.data.amount,
            reference
        });

        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
