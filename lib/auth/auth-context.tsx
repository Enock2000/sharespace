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
};

export const useAuth = () => useContext(AuthContext);
