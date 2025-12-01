import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Fetch platform settings from database
        const { getFirebaseDatabase } = await import("@/lib/firebase-config");
        const { ref, get } = await import("firebase/database");

        const db = getFirebaseDatabase();
        const settingsRef = ref(db, "platform_settings");
        const snapshot = await get(settingsRef);

        let pricing;

        if (snapshot.exists()) {
            pricing = snapshot.val().pricing;
        } else {
            // Default pricing if not configured
            pricing = {
                free: {
                    price: 0,
                    storage_gb: 10,
                    user_limit: 5,
                    features: ["Basic file storage", "5 users", "10GB storage"],
                },
                basic: {
                    price: 600,
                    storage_gb: 100,
                    user_limit: 25,
                    features: ["Everything in Free", "25 users", "100GB storage", "Email support"],
                },
                pro: {
                    price: 1500,
                    storage_gb: 500,
                    user_limit: 100,
                    features: ["Everything in Basic", "100 users", "500GB storage", "Priority support", "Advanced analytics"],
                },
                enterprise: {
                    price: 5000,
                    storage_gb: 2000,
                    user_limit: 99999,
                    features: ["Everything in Pro", "Unlimited users", "2TB storage", "24/7 support", "Custom integrations", "SLA guarantee"],
                },
            };
        }

        return NextResponse.json({ pricing });
    } catch (error) {
        console.error("Error fetching pricing:", error);

        // Return default pricing on error
        return NextResponse.json({
            pricing: {
                free: {
                    price: 0,
                    storage_gb: 10,
                    user_limit: 5,
                    features: ["Basic file storage", "5 users", "10GB storage"],
                },
                basic: {
                    price: 600,
                    storage_gb: 100,
                    user_limit: 25,
                    features: ["Everything in Free", "25 users", "100GB storage", "Email support"],
                },
                pro: {
                    price: 1500,
                    storage_gb: 500,
                    user_limit: 100,
                    features: ["Everything in Basic", "100 users", "500GB storage", "Priority support", "Advanced analytics"],
                },
                enterprise: {
                    price: 5000,
                    storage_gb: 2000,
                    user_limit: 99999,
                    features: ["Everything in Pro", "Unlimited users", "2TB storage", "24/7 support", "Custom integrations", "SLA guarantee"],
                },
            },
        });
    }
}
