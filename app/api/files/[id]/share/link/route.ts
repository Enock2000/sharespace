import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, ShareLink } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";
import { createHash } from "crypto";

// Helper to generate secure token
function generateToken(): string {
    return createHash('sha256').update(Math.random().toString() + Date.now().toString()).digest('hex').substring(0, 32);
}

// GET - List active share links for a file
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

        // Fetch all share links
        // In a real app we would index this. For now fetching all links and filtering.
        const linksMap = await db.get<Record<string, ShareLink>>(`share_links`) || {};
        const activeLinks = Object.values(linksMap)
            .filter(link => link.file_id === params.id && link.is_active);

        return NextResponse.json({ links: activeLinks });
    } catch (error: any) {
        console.error("Get share links error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new share link
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
        const { password, expiresAt } = body;

        const token = generateToken();
        const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const shareLink: ShareLink = {
            id: linkId,
            tenant_id: user.tenant_id,
            file_id: params.id,
            token: token,
            created_by: userId,
            created_at: Date.now(),
            access_count: 0,
            is_active: true,
            expires_at: expiresAt ? new Date(expiresAt).getTime() : undefined,
            password_hash: password ? createHash('sha256').update(password).digest('hex') : undefined
        };

        await db.set(`share_links/${linkId}`, shareLink);

        await logEvent(user.tenant_id, userId, "create_share_link", "file", params.id, {
            link_id: linkId,
            has_password: !!password,
            expires_at: shareLink.expires_at
        });

        // Don't return password hash
        const { password_hash, ...safeLink } = shareLink;
        return NextResponse.json({ link: safeLink });

    } catch (error: any) {
        console.error("Create share link error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Revoke a share link
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const linkId = searchParams.get("linkId");

    if (!userId || !linkId) {
        return NextResponse.json({ error: "User ID and Link ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const link = await db.get<ShareLink>(`share_links/${linkId}`);
        if (!link) {
            return NextResponse.json({ error: "Link not found" }, { status: 404 });
        }

        // Verify ownership (tenant level)
        if (link.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Soft delete/deactivate
        await db.update(`share_links/${linkId}`, { is_active: false });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Revoke share link error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
