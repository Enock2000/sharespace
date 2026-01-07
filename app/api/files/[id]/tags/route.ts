import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, FileTag, FileTagAssignment } from "@/types/database";

// GET - Get tags for a specific file
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const file = await db.get<File>(`files/${params.id}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Get tag assignments for this file
        const assignmentsMap = await db.get<Record<string, FileTagAssignment>>(`tag_assignments`) || {};
        const fileAssignments = Object.values(assignmentsMap)
            .filter(a => a.file_id === params.id);

        // Get tag details
        const tagsMap = await db.get<Record<string, FileTag>>(`tags`) || {};
        const fileTags = fileAssignments
            .map(a => tagsMap[a.tag_id])
            .filter(Boolean);

        return NextResponse.json({ tags: fileTags });
    } catch (error: any) {
        console.error("Get file tags error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Add tag to file
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const file = await db.get<File>(`files/${params.id}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const body = await request.json();
        const { tagId } = body;

        if (!tagId) {
            return NextResponse.json({ error: "Tag ID required" }, { status: 400 });
        }

        // Verify tag exists and belongs to tenant
        const tag = await db.get<FileTag>(`tags/${tagId}`);
        if (!tag || tag.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        // Check if already assigned
        const assignmentId = `ta_${params.id}_${tagId}`;
        const existing = await db.get<FileTagAssignment>(`tag_assignments/${assignmentId}`);
        if (existing) {
            return NextResponse.json({ message: "Tag already assigned" });
        }

        // Create assignment
        const assignment: FileTagAssignment = {
            file_id: params.id,
            tag_id: tagId,
            assigned_by: userId,
            assigned_at: Date.now()
        };

        await db.set(`tag_assignments/${assignmentId}`, assignment);

        return NextResponse.json({ success: true, tag });
    } catch (error: any) {
        console.error("Add file tag error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove tag from file
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const assignmentId = `ta_${params.id}_${tagId}`;
        await db.remove(`tag_assignments/${assignmentId}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Remove file tag error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
