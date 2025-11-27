import { database } from "../firebase-config";
import { ref, get, set, push, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { User, Tenant, Folder, File } from "@/types/database";

// Generic database helpers
export const db = {
    get: async <T>(path: string): Promise<T | null> => {
        const snapshot = await get(ref(database, path));
        return snapshot.exists() ? (snapshot.val() as T) : null;
    },

    set: async <T>(path: string, data: T): Promise<void> => {
        await set(ref(database, path), data);
    },

    push: async <T>(path: string, data: T): Promise<string | null> => {
        const newRef = push(ref(database, path));
        await set(newRef, { ...data, id: newRef.key });
        return newRef.key;
    },

    update: async <T>(path: string, data: Partial<T>): Promise<void> => {
        await update(ref(database, path), data);
    },

    remove: async (path: string): Promise<void> => {
        await remove(ref(database, path));
    },

    query: async <T>(path: string, field: string, value: string | number | boolean): Promise<T[]> => {
        const q = query(ref(database, path), orderByChild(field), equalTo(value));
        const snapshot = await get(q);
        if (!snapshot.exists()) return [];

        const results: T[] = [];
        snapshot.forEach((child) => {
            results.push(child.val());
        });
        return results;
    }
};
