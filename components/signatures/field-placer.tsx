"use client";
import { useState } from "react";
import { SignatureField, SignatureFieldType, Signer } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { getSignerColor } from "./signer-manager";

const FIELD_TYPES: { type: SignatureFieldType; icon: string; label: string; defaultW: number; defaultH: number }[] = [
    { type: "signature", icon: "✍️", label: "Signature", defaultW: 20, defaultH: 6 },
    { type: "initials", icon: "🔤", label: "Initials", defaultW: 10, defaultH: 5 },
    { type: "date", icon: "📅", label: "Date", defaultW: 15, defaultH: 4 },
    { type: "text", icon: "📝", label: "Text", defaultW: 20, defaultH: 4 },
    { type: "checkbox", icon: "☑️", label: "Checkbox", defaultW: 4, defaultH: 4 },
];

interface FieldPlacerProps {
    fields: SignatureField[];
    signers: Signer[];
    currentPage: number;
    onFieldsChange: (fields: SignatureField[]) => void;
}

export default function FieldPlacer({ fields, signers, currentPage, onFieldsChange }: FieldPlacerProps) {
    const [selectedSigner, setSelectedSigner] = useState<string>(signers[0]?.id || "");
    const [selectedField, setSelectedField] = useState<string | null>(null);

    const pageFields = fields.filter(f => f.page === currentPage);

    const addField = (type: SignatureFieldType) => {
        if (!selectedSigner) return;
        const config = FIELD_TYPES.find(ft => ft.type === type)!;
        const id = Math.random().toString(36).substring(2, 10);

        const newField: SignatureField = {
            id,
            signer_id: selectedSigner,
            type,
            label: `${config.label} ${pageFields.filter(f => f.type === type).length + 1}`,
            required: type === "signature",
            page: currentPage,
            x: 10 + Math.random() * 30,
            y: 10 + Math.random() * 40,
            width: config.defaultW,
            height: config.defaultH,
        };

        onFieldsChange([...fields, newField]);
        setSelectedField(id);
    };

    const removeField = (id: string) => {
        onFieldsChange(fields.filter(f => f.id !== id));
        if (selectedField === id) setSelectedField(null);
    };

    const updateFieldPosition = (id: string, x: number, y: number) => {
        onFieldsChange(fields.map(f => f.id === id ? { ...f, x, y } : f));
    };

    const signerColor = (signerId: string) => {
        const idx = signers.findIndex(s => s.id === signerId);
        return getSignerColor(idx >= 0 ? idx : 0);
    };

    return (
        <div className="space-y-4">
            {/* Signer Selector */}
            {signers.length > 0 && (
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Place fields for:</label>
                    <div className="flex flex-wrap gap-2">
                        {signers.map((signer, i) => {
                            const color = getSignerColor(i);
                            return (
                                <button
                                    key={signer.id}
                                    onClick={() => setSelectedSigner(signer.id)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedSigner === signer.id
                                        ? `${color.light} ring-2 ring-offset-1`
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                                    {signer.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Field Type Palette */}
            <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Add field:</label>
                <div className="grid grid-cols-5 gap-2">
                    {FIELD_TYPES.map((ft) => (
                        <button
                            key={ft.type}
                            onClick={() => addField(ft.type)}
                            disabled={!selectedSigner}
                            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <span className="text-lg">{ft.icon}</span>
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{ft.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Placed Fields List */}
            {pageFields.length > 0 && (
                <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Fields on page {currentPage} ({pageFields.length})
                    </label>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {pageFields.map((field) => {
                            const color = signerColor(field.signer_id);
                            const signer = signers.find(s => s.id === field.signer_id);
                            return (
                                <div
                                    key={field.id}
                                    onClick={() => setSelectedField(field.id === selectedField ? null : field.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${selectedField === field.id
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-300 dark:ring-indigo-600"
                                        : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        } border border-slate-200 dark:border-slate-700`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${color.bg} flex-shrink-0`} />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{FIELD_TYPES.find(ft => ft.type === field.type)?.icon}</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{field.label}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{signer?.name}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                        className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Icons.X className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {signers.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    Add signers first before placing fields on the document.
                </p>
            )}
        </div>
    );
}
