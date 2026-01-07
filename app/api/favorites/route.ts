import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, FavoriteFile, File } from "@/types/database";

// GET - List user's favorite files
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

        // Get all favorites for this user
        const favoritesMap = await db.get<Record<string, FavoriteFile>>(`favorites`) || {};
        const userFavorites = Object.values(favoritesMap)
            .filter(f => f.user_id === userId)
            .sort((a, b) => b.added_at - a.added_at);

        // Get file details for each favorite
        const filesMap = await db.get<Record<string, File>>(`files`) || {};
        const favoriteFiles = userFavorites
            .map(fav => filesMap[fav.file_id])
            .filter(f => f && !f.is_deleted && f.tenant_id === user.tenant_id);

        return NextResponse.json({ favorites: favoriteFiles });
    } catch (error: any) {
        console.error("Get favorites error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Add file to favorites
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const fileId = searchParams.get("fileId");

    if (!userId || !fileId) {
        return NextResponse.json({ error: "User ID and File ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const file = await db.get<File>(`files/${fileId}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Check if already favorited
        const favoritesMap = await db.get<Record<string, FavoriteFile>>(`favorites`) || {};
        const existingFavorite = Object.entries(favoritesMap)
            .find(([_, f]) => f.user_id === userId && f.file_id === fileId);

        if (existingFavorite) {
            return NextResponse.json({ message: "Already favorited", favorite: true });
        }

        // Add favorite
        const favoriteId = `fav_${userId}_${fileId}`;
        const favorite: FavoriteFile = {
            user_id: userId,
            file_id: fileId,
            added_at: Date.now()
        };

        await db.set(`favorites/${favoriteId}`, favorite);

        return NextResponse.json({ success: true, favorite: true });
    } catch (error: any) {
        console.error("Add favorite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove file from favorites
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const fileId = searchParams.get("fileId");

    if (!userId || !fileId) {
        return NextResponse.json({ error: "User ID and File ID required" }, { status: 400 });
    }

    try {
        const favoriteId = `fav_${userId}_${fileId}`;
        await db.remove(`favorites/${favoriteId}`);

        return NextResponse.json({ success: true, favorite: false });
    } catch (error: any) {
        console.error("Remove favorite error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
