import { db } from "@/lib/database/schema";
import { TeamMember } from "@/types/database";

export const getUserTeamIds = async (userId: string): Promise<string[]> => {
    // 1. Get all team memberships
    // This could be optimized if we indexed by user_id, but for Firebase structure 
    // we might have to fetch all team_members or user's specific path if structured that way.
    // Based on `types/database.ts`, `TeamMember` is likely at `team_members/{id}`.
    // Since we don't have a secondary index, we might default to:
    // A) fetching all team_members (slow at scale)
    // B) Assuming we store `users/{id}/teams` or similar.
    // Let's check how `team_members` are stored. 
    // If it's `team_members/{autoId} = { team_id, user_id ... }`, full scan is bad.
    // Ideally we should have `users/{userId}/teams/{teamId} = true`.

    // STARTUP FIX: Check if we can store/retrieve this efficiently.
    // For now, let's assume `team_members` are stored as `team_members/{teamId}_{userId}` 
    // or we query.

    // MVP Approach: 
    // Check if `users/{userId}` has a `teams` field? No, type doesn't show it.
    // We will scan `team_members` for now. In production, we'd add an index or denormalize.

    const allMembers = await db.get<Record<string, TeamMember>>("team_members");
    if (!allMembers) return [];

    return Object.values(allMembers)
        .filter(m => m.user_id === userId)
        .map(m => m.team_id);
};
