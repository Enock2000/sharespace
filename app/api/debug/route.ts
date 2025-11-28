import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        // Get user
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get ALL files and folders from Firebase
        const allFilesData = await db.get(`files`);
        const allFoldersData = await db.get(`folders`);
        const allUsersData = await db.get(`users`);

        // Convert to arrays
        const allFiles = allFilesData && typeof allFilesData === 'object'
            ? Object.values(allFilesData)
            : [];
        const allFolders = allFoldersData && typeof allFoldersData === 'object'
            ? Object.values(allFoldersData)
            : [];
        const allUsers = allUsersData && typeof allUsersData === 'object'
            ? Object.values(allUsersData)
            : [];

        return NextResponse.json({
            currentUser: {
                id: user.id,
                email: user.email,
                tenant_id: user.tenant_id,
            },
            allUsers: allUsers.map((u: any) => ({
                id: u.id,
                email: u.email,
                tenant_id: u.tenant_id,
            })),
            allFiles: allFiles.map((f: any) => ({
                id: f.id,
                name: f.name,
                tenant_id: f.tenant_id,
                folder_id: f.folder_id,
                uploaded_by: f.uploaded_by,
            })),
            allFolders: allFolders.map((f: any) => ({
                id: f.id,
                name: f.name,
                tenant_id: f.tenant_id,
                parent_id: f.parent_id,
                created_by: f.created_by,
            })),
            stats: {
                totalFiles: allFiles.length,
                totalFolders: allFolders.length,
                filesForThisTenant: allFiles.filter((f: any) => f.tenant_id === user.tenant_id).length,
                foldersForThisTenant: allFolders.filter((f: any) => f.tenant_id === user.tenant_id).length,
            }
        });
    } catch (error: any) {
        console.error("Debug error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
