"use client";
import { useState } from "react";
import { Signer } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import StatusBadge from "./status-badge";

const SIGNER_COLORS = [
    { bg: "bg-blue-500", light: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
    { bg: "bg-green-500", light: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
    { bg: "bg-purple-500", light: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
    { bg: "bg-orange-500", light: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
    { bg: "bg-pink-500", light: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" },
    { bg: "bg-teal-500", light: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300" },
];

export function getSignerColor(index: number) {
    return SIGNER_COLORS[index % SIGNER_COLORS.length];
}

interface SignerManagerProps {
    signers: Signer[];
    signingOrder: "sequential" | "parallel";
    onSigningOrderChange: (order: "sequential" | "parallel") => void;
    onAddSigner: (name: string, email: string, role: string) => void;
    onRemoveSigner: (id: string) => void;
    readOnly?: boolean;
}

export default function SignerManager({ signers, signingOrder, onSigningOrderChange, onAddSigner, onRemoveSigner, readOnly }: SignerManagerProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Signer");
    const [showForm, setShowForm] = useState(false);

    const handleAdd = () => {
        if (!name.trim() || !email.trim()) return;
        onAddSigner(name.trim(), email.trim(), role.trim() || "Signer");
        setName("");
        setEmail("");
        setRole("Signer");
        setShowForm(false);
    };

    return (
        <div className="space-y-4">
            {/* Signing Order Toggle */}
            {!readOnly && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Signing order:</span>
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => onSigningOrderChange("sequential")}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${signingOrder === "sequential"
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                }`}
                        >
                            Sequential
                        </button>
                        <button
                            onClick={() => onSigningOrderChange("parallel")}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${signingOrder === "parallel"
                                    ? "bg-indigo-500 text-white"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                }`}
                        >
                            Parallel
                        </button>
                    </div>
                </div>
            )}

            {/* Signer List */}
            {signers.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <Icons.Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No signers added yet</p>
                </div>
            )}
            <div className="space-y-2">
                {signers.map((signer, i) => {
                    const color = getSignerColor(i);
                    return (
                        <div key={signer.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                {signingOrder === "sequential" ? signer.order : signer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{signer.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{signer.email} · {signer.role}</p>
                            </div>
                            {readOnly ? (
                                <StatusBadge status={signer.status} />
                            ) : (
                                <button
                                    onClick={() => onRemoveSigner(signer.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Icons.X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Signer */}
            {!readOnly && (
                <>
                    {showForm ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full name"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                type="email"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="Role (e.g. Client, Witness)"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdd}
                                    disabled={!name.trim() || !email.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add Signer
                                </button>
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            <Icons.Plus className="w-4 h-4" />
                            Add Signer
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
