import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { Tenant, User, Folder } from "@/types/database";
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

        // Extract first and last name from email (temporary until user updates profile)
        const emailName = email.split('@')[0];
        const nameParts = emailName.split('.');
        const firstName = nameParts[0] || "User";
        const lastName = nameParts[1] || "";

        // Create tenant
        const tenantId = uuidv4();
        const tenant: Tenant = {
            id: tenantId,
            name: companyName,
            created_at: Date.now(),
            owner_id: userId,
        };

        await db.set(`tenants/${tenantId}`, tenant);

        // Create owner user
        const user: User = {
            id: userId,
            email,
            first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
            last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
            role: "owner",
            tenant_id: tenantId,
            created_at: Date.now(),
            updated_at: Date.now(),
            is_active: true,
        };

        await db.set(`users/${userId}`, user);

        // Create default folder
        const folderId = uuidv4();
        const folder: Folder = {
            id: folderId,
            name: "General",
            parent_id: null,
            tenant_id: tenantId,
            created_by: userId,
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        await db.set(`folders/${folderId}`, folder);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
