import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase-config";

export const registerUser = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
    return signOut(auth);
};

export const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
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
