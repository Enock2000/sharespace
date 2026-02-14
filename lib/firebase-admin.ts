import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getDatabase, Database } from "firebase-admin/database";

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Database | undefined;

function initializeAdminSDK() {
    if (adminApp) return;

    const existingApps = getApps();
    if (existingApps.length > 0) {
        adminApp = existingApps[0];
    } else {
        // Use service account from environment variable
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccount) {
            try {
                const parsed = JSON.parse(serviceAccount);
                adminApp = initializeApp({
                    credential: cert(parsed),
                    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-1406183744-ed22f-default-rtdb.firebaseio.com",
                });
            } catch (error) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
                throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY environment variable");
            }
        } else {
            // Fallback: use application default credentials (for Cloud-hosted environments)
            adminApp = initializeApp({
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-1406183744-ed22f-default-rtdb.firebaseio.com",
            });
        }
    }

    adminAuth = getAuth(adminApp);
    adminDb = getDatabase(adminApp);
}

export function getAdminAuth(): Auth {
    initializeAdminSDK();
    if (!adminAuth) throw new Error("Firebase Admin Auth not initialized");
    return adminAuth;
}

export function getAdminDatabase(): Database {
    initializeAdminSDK();
    if (!adminDb) throw new Error("Firebase Admin Database not initialized");
    return adminDb;
}
