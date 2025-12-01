import { NextRequest, NextResponse } from "next/server";
import { getAllTenants, updateTenant, deleteTenant, getTenantById } from "@/lib/database/admin-schema";
import { logAdminAction } from "@/lib/auth/admin-middleware";

export async function GET(request: NextRequest) {
    try {
        const tenants = await getAllTenants();

        return NextResponse.json({ tenants });
    } catch (error) {
        console.error("Error fetching tenants:", error);
        return NextResponse.json(
            { error: "Failed to fetch tenants" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, owner_id, plan = "free", storage_quota = 250 * 1024 * 1024 * 1024, user_limit = 50 } = body;

        if (!name || !owner_id) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create new tenant
        const { getFirebaseDatabase } = await import("@/lib/firebase-config");
        const { ref, set } = await import("firebase/database");

        const db = getFirebaseDatabase();
        const tenantId = `tenant_${Date.now()}`;
        const tenantRef = ref(db, `tenants/${tenantId}`);

        const newTenant = {
            name,
            owner_id,
            created_at: Date.now(),
            is_suspended: false,
            storage_quota,
            user_limit,
            plan,
        };

        await set(tenantRef, newTenant);

        // Log the action
        await logAdminAction(
            "system",
            "system",
            "tenant_create",
            "tenant",
            tenantId,
            { name, plan }
        );

        return NextResponse.json({ tenant: { id: tenantId, ...newTenant } });
    } catch (error) {
        console.error("Error creating tenant:", error);
        return NextResponse.json(
            { error: "Failed to create tenant" },
            { status: 500 }
        );
    }
}
