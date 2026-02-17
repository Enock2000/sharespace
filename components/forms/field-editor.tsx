"use client";

import { FormField, FormFieldType, FormFieldValidation } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface FieldEditorProps {
    field: FormField;
    onChange: (field: FormField) => void;
    onClose: () => void;
}

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
    short_text: "Short Text",
    long_text: "Long Text",
    number: "Number",
    email: "Email",
    phone: "Phone",
    date: "Date",
    time: "Time",
    dropdown: "Dropdown",
    radio: "Radio Buttons",
    checkbox: "Checkboxes",
    yes_no: "Yes / No",
    rating: "Rating",
    file_upload: "File Upload",
    signature: "Signature",
};

export default function FieldEditor({ field, onChange, onClose }: FieldEditorProps) {
    const [newOption, setNewOption] = useState("");
    const hasOptions = ["dropdown", "radio", "checkbox"].includes(field.type);

    const updateField = (updates: Partial<FormField>) => {
        onChange({ ...field, ...updates });
    };

    const updateValidation = (updates: Partial<FormFieldValidation>) => {
        onChange({
            ...field,
            validation: { ...field.validation, ...updates },
        });
    };

    const addOption = () => {
        if (!newOption.trim()) return;
        const options = [...(field.options || []), newOption.trim()];
        updateField({ options });
        setNewOption("");
    };

    const removeOption = (index: number) => {
        const options = [...(field.options || [])];
        options.splice(index, 1);
        updateField({ options });
    };

    const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all";

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Icons.Settings className="w-4 h-4" />
                    Field Settings
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <Icons.X className="w-5 h-5" />
                </button>
            </div>

            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg font-medium">
                {FIELD_TYPE_LABELS[field.type]}
            </div>

            {/* Label */}
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Label *</label>
                <input
                    className={inputClass}
                    value={field.label}
                    onChange={(e) => updateField({ label: e.target.value })}
                    placeholder="Field label"
                />
            </div>

            {/* Placeholder */}
            {!["checkbox", "radio", "yes_no", "rating", "signature", "file_upload"].includes(field.type) && (
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Placeholder</label>
                    <input
                        className={inputClass}
                        value={field.placeholder || ""}
                        onChange={(e) => updateField({ placeholder: e.target.value })}
                        placeholder="Placeholder text"
                    />
                </div>
            )}

            {/* Help Text */}
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Help Text</label>
                <input
                    className={inputClass}
                    value={field.help_text || ""}
                    onChange={(e) => updateField({ help_text: e.target.value })}
                    placeholder="Additional instructions for the respondent"
                />
            </div>

            {/* Required Toggle */}
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => updateField({ required: !field.required })}>
                <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${field.required ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${field.required ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Required</span>
            </label>

            {/* Options Builder for dropdown/radio/checkbox */}
            {hasOptions && (
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Options</label>
                    <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    className={`${inputClass} flex-1`}
                                    value={opt}
                                    onChange={(e) => {
                                        const options = [...(field.options || [])];
                                        options[i] = e.target.value;
                                        updateField({ options });
                                    }}
                                />
                                <button
                                    onClick={() => removeOption(i)}
                                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                                >
                                    <Icons.X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input
                                className={`${inputClass} flex-1`}
                                value={newOption}
                                onChange={(e) => setNewOption(e.target.value)}
                                placeholder="Add option..."
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                            />
                            <button
                                onClick={addOption}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                            >
                                <Icons.Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Validation: min/max length for text */}
            {(field.type === "short_text" || field.type === "long_text") && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Min Length</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={field.validation?.min_length ?? ""}
                            onChange={(e) => updateValidation({ min_length: e.target.value ? Number(e.target.value) : undefined })}
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Length</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={field.validation?.max_length ?? ""}
                            onChange={(e) => updateValidation({ max_length: e.target.value ? Number(e.target.value) : undefined })}
                            min={0}
                        />
                    </div>
                </div>
            )}

            {/* Validation: min/max for number */}
            {field.type === "number" && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Min Value</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={field.validation?.min ?? ""}
                            onChange={(e) => updateValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Value</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={field.validation?.max ?? ""}
                            onChange={(e) => updateValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                        />
                    </div>
                </div>
            )}

            {/* Regex for text fields */}
            {(field.type === "short_text" || field.type === "long_text") && (
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Regex Pattern (advanced)</label>
                    <input
                        className={inputClass}
                        value={field.validation?.regex || ""}
                        onChange={(e) => updateValidation({ regex: e.target.value || undefined })}
                        placeholder="e.g. ^[A-Z].*"
                    />
                </div>
            )}


        </div>
    );
}
