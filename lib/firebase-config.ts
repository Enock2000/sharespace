import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let database: Database | undefined;

// Lazy initialization - only initialize when actually used
function initializeFirebase() {
    if (typeof window === 'undefined') {
        // Don't initialize on server side during build
        return;
    }

    if (!app) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        database = getDatabase(app);
    }
}

// Getters that initialize on first use
export function getFirebaseApp(): FirebaseApp {
    initializeFirebase();
    if (!app) throw new Error("Firebase not initialized");
    return app;
}

export function getFirebaseAuth(): Auth {
    initializeFirebase();
    if (!auth) throw new Error("Firebase Auth not initialized");
    return auth;
}

export function getFirebaseDatabase(): Database {
    initializeFirebase();
    if (!database) throw new Error("Firebase Database not initialized");
    return database;
}

// For backward compatibility
export { app, auth, database };
