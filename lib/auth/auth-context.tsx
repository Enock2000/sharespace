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
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return; // Wait until initial auth state is known

        // Basic client-side protection
        const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
        const isAdminPage = pathname?.startsWith("/admin");
        const isPublicPage = pathname === "/" || pathname?.startsWith("/pricing");

        if (!user && !isAuthPage && !isAdminPage && !isPublicPage) {
            router.push("/login");
        } else if (user && isAuthPage) {
            // Only redirect regular login, not admin login
            router.push("/dashboard");
        }
        // Admin pages handle their own redirects in their layouts/middleware
    }, [pathname, router, user, loading]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
