import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, FileTag } from "@/types/database";

// GET - List all tags for tenant
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const tagsMap = await db.get<Record<string, FileTag>>(`tags`) || {};
        const tenantTags = Object.values(tagsMap)
            .filter(t => t.tenant_id === user.tenant_id)
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ tags: tenantTags });
    } catch (error: any) {
        console.error("Get tags error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new tag
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { name, color } = body;

        if (!name || !color) {
            return NextResponse.json({ error: "Name and color required" }, { status: 400 });
        }

        // Check for duplicate tag name in tenant
        const tagsMap = await db.get<Record<string, FileTag>>(`tags`) || {};
        const duplicate = Object.values(tagsMap)
            .find(t => t.tenant_id === user.tenant_id && t.name.toLowerCase() === name.toLowerCase());

        if (duplicate) {
            return NextResponse.json({ error: "Tag with this name already exists" }, { status: 409 });
        }

        const tag: FileTag = {
            id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tenant_id: user.tenant_id,
            name: name.trim(),
            color: color,
            created_by: userId,
            created_at: Date.now()
        };

        await db.set(`tags/${tag.id}`, tag);

        return NextResponse.json({ tag });
    } catch (error: any) {
        console.error("Create tag error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete tag
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const tagId = searchParams.get("tagId");

    if (!userId || !tagId) {
        return NextResponse.json({ error: "User ID and Tag ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const tag = await db.get<FileTag>(`tags/${tagId}`);
        if (!tag || tag.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        // Only admins and owners can delete tags
        if (!["owner", "admin", "super_admin", "platform_admin"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Remove the tag
        await db.remove(`tags/${tagId}`);

        // Also remove all tag assignments for this tag
        const assignmentsMap = await db.get<Record<string, any>>(`tag_assignments`) || {};
        for (const [key, assignment] of Object.entries(assignmentsMap)) {
            if (assignment.tag_id === tagId) {
                await db.remove(`tag_assignments/${key}`);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete tag error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
