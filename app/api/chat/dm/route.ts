import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, DMConversation } from "@/types/database";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { targetUserId, targetEmail, currentUserId } = body;

        if (!currentUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = await db.get<User>(`users/${currentUserId}`);
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let otherUser: User | null = null;
        let otherUserId = targetUserId;

        // Logic 1: Look up by ID (Internal usually)
        if (targetUserId) {
            otherUser = await db.get<User>(`users/${targetUserId}`);
        }
        // Logic 2: Look up by Email (Internal or External)
        else if (targetEmail) {
            // Inefficient scan without index (mock implementation)
            const allUsers = await db.get<Record<string, User>>(`users`) || {};
            otherUser = Object.values(allUsers).find(u => u.email.toLowerCase() === targetEmail.toLowerCase()) || null;
            if (otherUser) otherUserId = otherUser.id;
        }

        if (!otherUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent self-chat
        if (otherUserId === currentUserId) {
            return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
        }

        // Check if DM already exists
        // We need an index ideally. For now, we fetch all DMs and filter.
        // Optimization: Store DMs under `user_dms/{userId}/{dmId}` reference for O(1) lookup.
        // But for this schema `dms/{dmId}`, we scan.
        // To avoid scan, we construct a deterministic ID?
        // ID = `dm_${sort(uid1, uid2).join('_')}`
        const participants = [currentUserId, otherUserId].sort();
        const dmId = `dm_${participants[0]}_${participants[1]}`;

        let dm = await db.get<DMConversation>(`dms/${dmId}`);

        if (!dm) {
            // Create new DM
            dm = {
                id: dmId,
                participants: participants,
                participants_tenants: {
                    [currentUserId]: currentUser.tenant_id,
                    [otherUserId]: otherUser.tenant_id
                },
                created_at: Date.now(),
                updated_at: Date.now()
            };
            await db.set(`dms/${dmId}`, dm);
        }

        return NextResponse.json({ conversation: dm, otherUser });

    } catch (error) {
        console.error("DM creation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
