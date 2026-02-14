import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";
import { registerUser } from "@/lib/auth/firebase-auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const {
            firstName,
            lastName,
            email,
            gender,
            password,
            role,
            createdBy
        } = await request.json();

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !createdBy) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get creator to find tenant
        const creator = await db.get<User>(`users/${createdBy}`);
        if (!creator) {
            return NextResponse.json({ error: "Creator not found" }, { status: 404 });
        }

        // Only admin and owner can create users
        if (creator.role !== "admin" && creator.role !== "owner") {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        // Create Firebase auth account
        const userCredential = await registerUser(email, password);
        const firebaseUser = userCredential.user;

        // Create user profile in database
        const newUser: User = {
            id: firebaseUser.uid,
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            gender: gender || undefined,
            role: role || "member",
            tenant_id: creator.tenant_id,
            created_at: Date.now(),
            updated_at: Date.now(),
            is_active: true,
        };

        // Save user to database under their company
        await db.set(`users/${firebaseUser.uid}`, newUser);

        // Log audit event
        await logEvent(
            creator.tenant_id,
            createdBy,
            "create_user",
            "user",
            firebaseUser.uid,
            { email, first_name: firstName, last_name: lastName, role }
        );

        return NextResponse.json({
            success: true,
            message: "User created successfully",
            userId: firebaseUser.uid
        });
    } catch (error: any) {
        console.error("Create user error:", error);

        // Handle Firebase auth errors
        if (error.code === 'auth/email-already-in-use') {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
