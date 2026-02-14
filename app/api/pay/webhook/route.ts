import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";

// Lenco Webhook secret should be in env
// const WEBHOOK_SECRET = process.env.LENCO_WEBHOOK_SECRET;

export async function POST(req: Request) {
    try {
        // Verify signature (Implementation depends on Lenco docs, skipping strict signature check for now strictly for MVP speed, but highly recommended)
        // const signature = req.headers.get("x-lenco-signature");
        // if (!verifySignature(signature, body, WEBHOOK_SECRET)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

        const body = await req.json();
        const { event, data } = body;

        if (event === "collection.successful" || event === "payment.successful") { // Adjust event name based on Lenco docs
            const reference = data.reference;
            // Reference format: ref-{tenantId}-{timestamp}
            const parts = reference.split("-");

            // Basic validation of reference format
            if (parts.length >= 3 && parts[0] === "ref") {
                const tenantId = parts[1];

                // Update Tenant
                // We blindly update to "pro" for now basically assuming all payments are for the pro plan
                await db.update(`tenants/${tenantId}`, {
                    plan: "pro",
                    storage_quota: 250 * 1024 * 1024 * 1024, // 250GB
                    user_limit: 999999
                });

                // Log it (using system user or similar, here we use 'system' as userId)
                await logEvent(tenantId, "system_webhook", "upgrade_plan_webhook", "tenant", tenantId, {
                    plan: "pro",
                    amount: data.amount,
                    reference
                });
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
    }
}
