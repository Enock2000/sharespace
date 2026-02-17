"use client";

import { FormField, FormFieldType } from "@/types/database";
import SignaturePad from "./signature-pad";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface FieldRendererProps {
    field: FormField;
    value: any;
    onChange: (value: any) => void;
    error?: string;
    disabled?: boolean;
}

export default function FieldRenderer({ field, value, onChange, error, disabled = false }: FieldRendererProps) {
    const baseInputClass = `w-full px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm
        ${error
            ? "border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
            : "border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
        }
        bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
        disabled:bg-slate-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed outline-none`;

    const renderField = () => {
        switch (field.type) {
            case "short_text":
                return (
                    <input
                        type="text"
                        className={baseInputClass}
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        maxLength={field.validation?.max_length}
                        disabled={disabled}
                    />
                );

            case "long_text":
                return (
                    <textarea
                        className={`${baseInputClass} min-h-[100px] resize-y`}
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        maxLength={field.validation?.max_length}
                        disabled={disabled}
                        rows={4}
                    />
                );

            case "number":
                return (
                    <input
                        type="number"
                        className={baseInputClass}
                        placeholder={field.placeholder || ""}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        disabled={disabled}
                    />
                );

            case "email":
                return (
                    <input
                        type="email"
                        className={baseInputClass}
                        placeholder={field.placeholder || "Enter email address"}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case "phone":
                return (
                    <input
                        type="tel"
                        className={baseInputClass}
                        placeholder={field.placeholder || "Enter phone number"}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case "date":
                return (
                    <input
                        type="date"
                        className={baseInputClass}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case "time":
                return (
                    <input
                        type="time"
                        className={baseInputClass}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );

            case "dropdown":
                return (
                    <select
                        className={baseInputClass}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    >
                        <option value="">{field.placeholder || "Select an option..."}</option>
                        {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                );

            case "radio":
                return (
                    <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                    ${value === opt
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                                    }`}
                                >
                                    {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                );

            case "checkbox":
                const checkedValues = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                    ${checkedValues.includes(opt)
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                                    }`}
                                >
                                    {checkedValues.includes(opt) && (
                                        <Icons.Check className="w-3 h-3 text-white" />
                                    )}
                                </div>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                            </label>
                        ))}
                    </div>
                );

            case "yes_no":
                return (
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => !disabled && onChange(true)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${value === true
                                    ? "bg-green-500 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                }`}
                            disabled={disabled}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => !disabled && onChange(false)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${value === false
                                    ? "bg-red-500 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                }`}
                            disabled={disabled}
                        >
                            No
                        </button>
                    </div>
                );

            case "rating":
                const maxRating = field.validation?.max || 5;
                return (
                    <div className="flex items-center gap-1">
                        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => !disabled && onChange(star)}
                                className="transition-transform hover:scale-110"
                                disabled={disabled}
                            >
                                {star <= (value || 0) ? (
                                    <Icons.StarFilled className="w-8 h-8 text-amber-400" />
                                ) : (
                                    <Icons.Star className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                )}
                            </button>
                        ))}
                        {value > 0 && (
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{value}/{maxRating}</span>
                        )}
                    </div>
                );

            case "file_upload":
                return (
                    <div className="space-y-2">
                        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all
                            ${disabled
                                ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-blue-400"
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Icons.UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {value ? value.name || "File selected" : "Click to upload"}
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) onChange({ name: file.name, size: file.size, type: file.type, file });
                                }}
                                disabled={disabled}
                            />
                        </label>
                        {value?.name && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Icons.File className="w-4 h-4" />
                                <span>{value.name}</span>
                                {!disabled && (
                                    <button type="button" onClick={() => onChange(null)} className="text-red-500 hover:text-red-700">
                                        <Icons.X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );

            case "signature":
                return (
                    <SignaturePad
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        className={baseInputClass}
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                    />
                );
        }
    };

    // Handle checkbox toggle
    const handleCheckboxToggle = (opt: string) => {
        if (disabled) return;
        const current = Array.isArray(value) ? [...value] : [];
        const idx = current.indexOf(opt);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(opt);
        }
        onChange(current);
    };

    // Wrap checkbox options with toggle handler
    const renderCheckboxField = () => {
        const checkedValues = Array.isArray(value) ? value : [];
        return (
            <div className="space-y-2">
                {(field.options || []).map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group" onClick={() => handleCheckboxToggle(opt)}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${checkedValues.includes(opt)
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400"
                            }`}
                        >
                            {checkedValues.includes(opt) && (
                                <Icons.Check className="w-3 h-3 text-white" />
                            )}
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                    </label>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{field.help_text}</p>
            )}
            {field.type === "checkbox" ? renderCheckboxField() : renderField()}
            {error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
            )}
        </div>
    );
}
