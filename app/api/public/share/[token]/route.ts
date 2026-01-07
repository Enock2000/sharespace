import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { ShareLink, File } from "@/types/database";
import { createHash } from "crypto";

// GET - Validate token and get file info (if public)
export async function GET(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        // Find link by token
        // Inefficient without index, but functional for demo
        const linksMap = await db.get<Record<string, ShareLink>>(`share_links`) || {};
        const link = Object.values(linksMap).find(l => l.token === params.token && l.is_active);

        if (!link) {
            return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
        }

        // Check expiration
        if (link.expires_at && Date.now() > link.expires_at) {
            return NextResponse.json({ error: "Link expired" }, { status: 410 });
        }

        // Increment view count
        await db.update(`share_links/${link.id}`, { views: link.views + 1 });

        // If password protected, return limited info
        if (link.password_hash) {
            return NextResponse.json({
                requiresPassword: true,
                valid: true
            });
        }

        // Retrieve file
        const file = await db.get<File>(`files/${link.file_id}`);
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            requiresPassword: false,
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url, // In a real system, generate a signed URL here
                updated_at: file.updated_at
            }
        });

    } catch (error: any) {
        console.error("Public share link error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Unlock with password
export async function POST(
    request: Request,
    { params }: { params: { token: string } }
) {
    try {
        const body = await request.json();
        const { password } = body;

        const linksMap = await db.get<Record<string, ShareLink>>(`share_links`) || {};
        const link = Object.values(linksMap).find(l => l.token === params.token && l.is_active);

        if (!link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

        if (link.expires_at && Date.now() > link.expires_at) {
            return NextResponse.json({ error: "Link expired" }, { status: 410 });
        }

        // Verify password
        const hash = createHash('sha256').update(password).digest('hex');
        if (link.password_hash && link.password_hash !== hash) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        // Retrieve file
        const file = await db.get<File>(`files/${link.file_id}`);
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json({
            valid: true,
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url,
                updated_at: file.updated_at
            }
        });

    } catch (error: any) {
        console.error("Unlock share link error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
