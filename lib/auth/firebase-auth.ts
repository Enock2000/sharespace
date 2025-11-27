return signInWithEmailAndPassword(getAuth(), email, password);
};

export const logoutUser = async () => {
    return signOut(getAuth());
};

export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(getAuth(), email);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            getAuth(),
            (user) => {
                unsubscribe();
                resolve(user);
            },
            (error) => {
                unsubscribe();
                reject(error);
            }
        );
    });
};
