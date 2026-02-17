"use client";
import { SignatureRequest } from "@/types/database";
import StatusBadge from "./status-badge";
import { Icons } from "@/components/ui/icons";
import { useRouter } from "next/navigation";

export default function RequestCard({ request, onDelete }: { request: SignatureRequest; onDelete: (id: string) => void }) {
    const router = useRouter();
    const signedCount = (request.signers || []).filter(s => s.status === "signed").length;
    const totalSigners = (request.signers || []).length;
    const progressPercent = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;

    return (
        <div
            onClick={() => router.push(`/dashboard/signatures/${request.id}`)}
            className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {request.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{request.document_name}</p>
                </div>
                <StatusBadge status={request.status} />
            </div>

            {/* Signers Progress */}
            {totalSigners > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {signedCount} of {totalSigners} signed
                        </span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Signer Avatars */}
            {totalSigners > 0 && (
                <div className="flex items-center gap-1 mb-3">
                    {request.signers.slice(0, 5).map((signer) => (
                        <div
                            key={signer.id}
                            title={`${signer.name} (${signer.status})`}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${signer.status === "signed" ? "bg-green-100 dark:bg-green-900/30 border-green-400 text-green-700 dark:text-green-400" :
                                    signer.status === "declined" ? "bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-400" :
                                        signer.status === "viewed" ? "bg-purple-100 dark:bg-purple-900/30 border-purple-400 text-purple-700 dark:text-purple-400" :
                                            "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                                }`}
                        >
                            {signer.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {totalSigners > 5 && (
                        <span className="text-xs text-slate-400 ml-1">+{totalSigners - 5}</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(request.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {request.status === "completed" && (
                        <button
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Download"
                        >
                            <Icons.Download className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(request.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                    >
                        <Icons.Trash className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
