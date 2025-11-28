import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBycuDWBy135k1lGe_9x7RI9vfRdYYR4nM",
    authDomain: "studio-1406183744-ed22f.firebaseapp.com",
    databaseURL: "https://studio-1406183744-ed22f-default-rtdb.firebaseio.com",
    projectId: "studio-1406183744-ed22f",
    storageBucket: "studio-1406183744-ed22f.firebasestorage.app",
    messagingSenderId: "296224798311",
    appId: "1:296224798311:web:02492fe8ffaf8d7dbcc6c2"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let database: Database | undefined;

// Initialize Firebase - now works on both client and server
function initializeFirebase() {
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
