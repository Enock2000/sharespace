import { NextRequest, NextResponse } from "next/server";
import { searchUsers, updateUserRole, deactivateUser } from "@/lib/database/admin-schema";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        let users;
        if (search) {
            users = await searchUsers(search);
        } else {
            // Import database functions
            const { getFirebaseDatabase } = await import("@/lib/firebase-config");
            const { ref, get } = await import("firebase/database");

            const db = getFirebaseDatabase();
            const usersRef = ref(db, "users");
            const snapshot = await get(usersRef);

            users = [];
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    users.push({ id: child.key, ...child.val() });
                });
            }
        }

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, role, deactivate } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId" },
                { status: 400 }
            );
        }

        if (role) {
            await updateUserRole(userId, role);
        }

        if (deactivate !== undefined) {
            await deactivateUser(userId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
