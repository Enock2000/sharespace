import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { File } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

// GET - List favorites
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const favoritesMap = await db.get<Record<string, { file_id: string; added_at: number }>>(`favorites/${user.id}`) || {};
        const favorites = Object.entries(favoritesMap);

        // Get file details for each favorite
        const filesWithDetails = await Promise.all(
            favorites.map(async ([key, fav]) => {
                const file = await db.get<File>(`files/${fav.file_id}`);
                return file ? { ...file, favorited_at: fav.added_at, favorite_key: key } : null;
            })
        );

        return NextResponse.json({
            favorites: filesWithDetails.filter(Boolean).sort((a: any, b: any) => b.favorited_at - a.favorited_at)
        });
    } catch (error: any) {
        console.error("Get favorites error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Add to favorites
export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { fileId } = await request.json();

        if (!fileId) {
            return NextResponse.json({ error: "File ID required" }, { status: 400 });
        }

        // Verify file exists and belongs to user's tenant
        const file = await db.get<File>(`files/${fileId}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Check if already favorited
        const existingFavorites = await db.get<Record<string, any>>(`favorites/${user.id}`) || {};
        const alreadyFavorited = Object.values(existingFavorites).some(f => f.file_id === fileId);

        if (alreadyFavorited) {
            return NextResponse.json({ error: "Already favorited" }, { status: 409 });
        }

        const favoriteKey = `fav_${Date.now()}`;
        await db.set(`favorites/${user.id}/${favoriteKey}`, {
            file_id: fileId,
            added_at: Date.now()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Add favorite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove from favorites
export async function DELETE(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
        return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    try {
        const favoritesMap = await db.get<Record<string, { file_id: string }>>(`favorites/${user.id}`) || {};

        const entryToRemove = Object.entries(favoritesMap).find(([_, fav]) => fav.file_id === fileId);

        if (!entryToRemove) {
            return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
        }

        await db.remove(`favorites/${user.id}/${entryToRemove[0]}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Remove favorite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
