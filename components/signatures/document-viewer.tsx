"use client";
import { useState, useRef, useCallback } from "react";
import { SignatureField } from "@/types/database";
import { getSignerColor } from "./signer-manager";

interface DocumentViewerProps {
    documentUrl: string;
    documentPages: number;
    fields: SignatureField[];
    signerIndex?: (signerId: string) => number;
    highlightSignerId?: string;
    onFieldClick?: (field: SignatureField) => void;
    interactive?: boolean;
}

export default function DocumentViewer({ documentUrl, documentPages, fields, signerIndex, highlightSignerId, onFieldClick, interactive }: DocumentViewerProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    const pageFields = fields.filter(f => f.page === currentPage);
    const getColor = useCallback((signerId: string) => {
        const idx = signerIndex ? signerIndex(signerId) : 0;
        return getSignerColor(idx);
    }, [signerIndex]);

    const fieldTypeLabel = (type: string) => {
        switch (type) {
            case "signature": return "✍️ Sign";
            case "initials": return "🔤 Initials";
            case "date": return "📅 Date";
            case "text": return "📝 Text";
            case "checkbox": return "☑️ Check";
            default: return type;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        ←
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {currentPage} of {documentPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(documentPages, currentPage + 1))}
                        disabled={currentPage === documentPages}
                        className="px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        →
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                        className="px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        −
                    </button>
                    <span className="text-xs text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                        className="px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Document Area */}
            <div ref={containerRef} className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-4 flex justify-center">
                <div
                    className="relative bg-white shadow-xl border border-slate-200"
                    style={{
                        width: `${595 * zoom}px`,
                        height: `${842 * zoom}px`,
                        backgroundImage: documentUrl ? `url(${documentUrl})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    {/* Placeholder when no image */}
                    {!documentUrl && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <span className="text-lg">Document Preview</span>
                        </div>
                    )}

                    {/* Field Overlays */}
                    {pageFields.map((field) => {
                        const color = getColor(field.signer_id);
                        const isHighlighted = highlightSignerId === field.signer_id;
                        const hasValue = !!field.value;

                        return (
                            <div
                                key={field.id}
                                onClick={() => onFieldClick?.(field)}
                                className={`absolute border-2 rounded-md flex items-center justify-center transition-all ${interactive ? "cursor-pointer hover:shadow-lg" : ""
                                    } ${isHighlighted ? "ring-2 ring-offset-1 ring-indigo-500 z-10" : ""} ${hasValue ? "bg-green-50/80 border-green-400" : "border-dashed"
                                    }`}
                                style={{
                                    left: `${field.x}%`,
                                    top: `${field.y}%`,
                                    width: `${field.width}%`,
                                    height: `${field.height}%`,
                                    borderColor: hasValue ? undefined : color.bg.replace("bg-", ""),
                                    backgroundColor: hasValue ? undefined : `${color.bg.replace("bg-", "")}15`,
                                }}
                                title={`${field.label} (${field.type})`}
                            >
                                {hasValue ? (
                                    field.type === "signature" || field.type === "initials" ? (
                                        <img src={field.value} alt="signature" className="max-w-full max-h-full object-contain" />
                                    ) : field.type === "checkbox" ? (
                                        <span className="text-green-600 font-bold text-lg">✓</span>
                                    ) : (
                                        <span className="text-xs text-slate-700 px-1 truncate">{field.value}</span>
                                    )
                                ) : (
                                    <span className="text-[10px] text-slate-500 opacity-70">{fieldTypeLabel(field.type)}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
