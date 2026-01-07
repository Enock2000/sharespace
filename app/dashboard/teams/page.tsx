"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { Team, User } from "@/types/database";

interface TeamWithCount extends Team {
    member_count: number;
}

interface MemberWithUser {
    team_id: string;
    user_id: string;
    role: "admin" | "member";
    user: { id: string; first_name: string; last_name: string; email: string } | null;
}

export default function TeamsPage() {
    const { user } = useAuth();
    const [teams, setTeams] = useState<TeamWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<TeamWithCount | null>(null);
    const [teamMembers, setTeamMembers] = useState<MemberWithUser[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamDescription, setNewTeamDescription] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]);

    const fetchTeams = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/teams?userId=${user.uid}`);
            const data = await res.json();
            setTeams(data.teams || []);
        } catch (error) {
            console.error("Failed to fetch teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async (teamId: string) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/teams/${teamId}/members?userId=${user.uid}`);
            const data = await res.json();
            setTeamMembers(data.members || []);
        } catch (error) {
            console.error("Failed to fetch team members:", error);
        }
    };

    const fetchAllUsers = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/users?userId=${user.uid}`);
            const data = await res.json();
            setAllUsers(data.users || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    };

    useEffect(() => {
        fetchTeams();
        fetchAllUsers();
    }, [user]);

    useEffect(() => {
        if (selectedTeam) {
            fetchTeamMembers(selectedTeam.id);
        }
    }, [selectedTeam]);

    const handleCreateTeam = async () => {
        if (!user || !newTeamName.trim()) return;
        try {
            const res = await fetch(`/api/teams?userId=${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTeamName.trim(),
                    description: newTeamDescription.trim()
                })
            });

            if (res.ok) {
                const data = await res.json();
                setTeams(prev => [...prev, data.team]);
                setShowCreate(false);
                setNewTeamName("");
                setNewTeamDescription("");
            }
        } catch (error) {
            console.error("Failed to create team:", error);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!user || !confirm("Delete this team?")) return;
        try {
            const res = await fetch(`/api/teams?userId=${user.uid}&teamId=${teamId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setTeams(prev => prev.filter(t => t.id !== teamId));
                if (selectedTeam?.id === teamId) {
                    setSelectedTeam(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete team:", error);
        }
    };

    const handleAddMember = async (memberId: string) => {
        if (!user || !selectedTeam) return;
        try {
            const res = await fetch(`/api/teams/${selectedTeam.id}/members?userId=${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId })
            });

            if (res.ok) {
                const data = await res.json();
                setTeamMembers(prev => [...prev, data.member]);
                setTeams(prev => prev.map(t =>
                    t.id === selectedTeam.id
                        ? { ...t, member_count: t.member_count + 1 }
                        : t
                ));
            }
        } catch (error) {
            console.error("Failed to add member:", error);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!user || !selectedTeam || !confirm("Remove this member?")) return;
        try {
            const res = await fetch(
                `/api/teams/${selectedTeam.id}/members?userId=${user.uid}&memberId=${memberId}`,
                { method: "DELETE" }
            );

            if (res.ok) {
                setTeamMembers(prev => prev.filter(m => m.user_id !== memberId));
                setTeams(prev => prev.map(t =>
                    t.id === selectedTeam.id
                        ? { ...t, member_count: Math.max(0, t.member_count - 1) }
                        : t
                ));
            }
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const nonMembers = allUsers.filter(
        u => !teamMembers.find(m => m.user_id === u.id)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Icons.Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        Teams & Groups
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Organize your team members into groups
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                    <Icons.Plus className="w-4 h-4" />
                    Create Team
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Teams List */}
                <div className="lg:col-span-1 space-y-4">
                    {teams.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                            <Icons.Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No teams yet</p>
                        </div>
                    ) : (
                        teams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setSelectedTeam(team)}
                                className={`w-full p-4 rounded-xl border transition-all text-left ${selectedTeam?.id === team.id
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: team.color }}
                                    >
                                        {team.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{team.name}</h3>
                                        <p className="text-xs text-slate-500">{team.member_count} members</p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Team Details */}
                <div className="lg:col-span-2">
                    {selectedTeam ? (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            {/* Team Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                        style={{ backgroundColor: selectedTeam.color }}
                                    >
                                        {selectedTeam.name[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {selectedTeam.name}
                                        </h2>
                                        <p className="text-sm text-slate-500">{selectedTeam.description || "No description"}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteTeam(selectedTeam.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Members */}
                            <div className="p-4">
                                <h3 className="font-medium text-slate-900 dark:text-white mb-3">Members</h3>
                                <div className="space-y-2">
                                    {teamMembers.map(member => (
                                        <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                                {member.user?.first_name?.[0] || "?"}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {member.user ? `${member.user.first_name} ${member.user.last_name}` : "Unknown"}
                                                </p>
                                                <p className="text-xs text-slate-500">{member.user?.email}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded ${member.role === "admin"
                                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                    : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                }`}>
                                                {member.role}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                className="p-1 text-slate-400 hover:text-red-500"
                                            >
                                                <Icons.X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Member */}
                                {nonMembers.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add Members</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {nonMembers.slice(0, 5).map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => handleAddMember(u.id)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm transition-colors"
                                                >
                                                    <Icons.Plus className="w-3 h-3" />
                                                    {u.first_name} {u.last_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                            <Icons.Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">Select a team to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Team Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Team</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="Engineering, Marketing, etc."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={newTeamDescription}
                                    onChange={(e) => setNewTeamDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    rows={2}
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTeam}
                                disabled={!newTeamName.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Create Team
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
