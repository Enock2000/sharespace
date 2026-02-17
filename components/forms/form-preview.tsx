"use client";

import { FormField } from "@/types/database";
import FieldRenderer from "./field-renderer";

interface FormPreviewProps {
    title: string;
    description?: string;
    fields: FormField[];
}

export default function FormPreview({ title, description, fields }: FormPreviewProps) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
                    <h2 className="text-xl font-bold text-white">
                        {title || "Untitled Form"}
                    </h2>
                    {description && (
                        <p className="text-blue-100 text-sm mt-1">{description}</p>
                    )}
                </div>

                {/* Fields */}
                <div className="p-6 space-y-6">
                    {fields.length === 0 ? (
                        <p className="text-center text-slate-400 dark:text-slate-500 py-8 text-sm">
                            No fields added yet. Add fields to see a preview.
                        </p>
                    ) : (
                        fields.map((field) => (
                            <FieldRenderer
                                key={field.id}
                                field={field}
                                value={undefined}
                                onChange={() => { }}
                                disabled
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                {fields.length > 0 && (
                    <div className="px-6 pb-6">
                        <button
                            disabled
                            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm opacity-80 cursor-not-allowed"
                        >
                            Submit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
