import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase-config";

const getAuth = () => getFirebaseAuth();

export const registerUser = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(getAuth(), email, password);
};

export const loginUser = async (email: string, password: string) => {
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
