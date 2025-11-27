"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth } from "../firebase-config";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = getFirebaseAuth().onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);

            // Basic client-side protection
            const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
            const isPublicPage = pathname === "/";

            if (!user && !isAuthPage && !isPublicPage) {
                router.push("/login");
            } else if (user && isAuthPage) {
                router.push("/dashboard");
            }
        });

        return () => unsubscribe();
    }, [pathname, router]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
