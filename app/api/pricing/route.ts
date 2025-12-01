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
                standard: {
                    price: 600,
                    storage_gb: 100,
                    user_limit: 25,
                    features: [
                        "100GB Secure Storage",
                        "25 Team Members",
                        "Advanced File Sharing",
                        "Priority Email Support",
                        "Audit Logs",
                        "2FA Security"
                    ],
                },
            };
        }

        return NextResponse.json({ pricing });
    } catch (error) {
        console.error("Error fetching pricing:", error);

        // Return default pricing on error
        return NextResponse.json({
            pricing: {
                standard: {
                    price: 600,
                    storage_gb: 100,
                    user_limit: 25,
                    features: [
                        "100GB Secure Storage",
                        "25 Team Members",
                        "Advanced File Sharing",
                        "Priority Email Support",
                        "Audit Logs",
                        "2FA Security"
                    ],
                },
            },
        });
    }
}
