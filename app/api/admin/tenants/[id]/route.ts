import { NextRequest, NextResponse } from "next/server";
import { getTenantById, updateTenant, deleteTenant } from "@/lib/database/admin-schema";
import { logAdminAction } from "@/lib/auth/admin-middleware";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tenant = await getTenantById(params.id);

        if (!tenant) {
            return NextResponse.json(
                { error: "Tenant not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ tenant });
    } catch (error) {
        console.error("Error fetching tenant:", error);
        return NextResponse.json(
            { error: "Failed to fetch tenant" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        await updateTenant(params.id, body);

        // Log the action
        await logAdminAction(
            "system",
            "system",
            "tenant_update",
            "tenant",
            params.id,
            body
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating tenant:", error);
        return NextResponse.json(
            { error: "Failed to update tenant" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await deleteTenant(params.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting tenant:", error);
        return NextResponse.json(
            { error: "Failed to delete tenant" },
            { status: 500 }
        );
    }
}
