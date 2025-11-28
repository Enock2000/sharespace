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
