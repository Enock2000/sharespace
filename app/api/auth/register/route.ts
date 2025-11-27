import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { Tenant, User } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const { userId, email, companyName } = await request.json();

        if (!userId || !email || !companyName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const tenantId = uuidv4();
        const now = Date.now();

        // Create Tenant
        const newTenant: Tenant = {
            id: tenantId,
            name: companyName,
            plan: "free",
            status: "active",
            storage_used: 0,
            owner_id: userId,
            created_at: now,
        };

        // Create User Profile
        const newUser: User = {
            id: userId,
            email,
            role: "owner",
            tenant_id: tenantId,
            status: "active",
            created_at: now,
        };

        // Transaction-like updates (not atomic in REST, but close enough for MVP)
        await db.set(`tenants/${tenantId}`, newTenant);
        await db.set(`users/${userId}`, newUser);

        // Create default "General" folder
        const folderId = uuidv4();
        await db.set(`folders/${folderId}`, {
            id: folderId,
            name: "General",
            parent_id: null,
            tenant_id: tenantId,
            owner_id: userId,
            created_at: now,
            path: [],
        });

        return NextResponse.json({ success: true, tenantId });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
