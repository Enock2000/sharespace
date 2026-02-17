"use client";

import { FormField, FormFieldType } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import FieldEditor from "./field-editor";
import FieldRenderer from "./field-renderer";
import { useState, useCallback } from "react";

interface FormBuilderProps {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
    { type: "short_text", label: "Short Text", icon: "Type" },
    { type: "long_text", label: "Long Text", icon: "FileText" },
    { type: "number", label: "Number", icon: "Hash" },
    { type: "email", label: "Email", icon: "Mail" },
    { type: "phone", label: "Phone", icon: "Phone" },
    { type: "date", label: "Date", icon: "Calendar" },
    { type: "time", label: "Time", icon: "Clock" },
    { type: "dropdown", label: "Dropdown", icon: "ChevronDown" },
    { type: "radio", label: "Radio", icon: "ListChecks" },
    { type: "checkbox", label: "Checkbox", icon: "Check" },
    { type: "yes_no", label: "Yes / No", icon: "ToggleLeft" },
    { type: "rating", label: "Rating", icon: "Star" },
    { type: "file_upload", label: "File Upload", icon: "Upload" },
    { type: "signature", label: "Signature", icon: "Pen" },
];

function generateFieldId(): string {
    return "f_" + Math.random().toString(36).substring(2, 10);
}

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [showPalette, setShowPalette] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const addField = (type: FormFieldType) => {
        const label = FIELD_TYPES.find(f => f.type === type)?.label || "Field";
        const newField: FormField = {
            id: generateFieldId(),
            type,
            label: `${label}`,
            required: false,
            order: fields.length,
            options: ["dropdown", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : undefined,
            validation: type === "rating" ? { min: 1, max: 5 } : undefined,
        };
        onChange([...fields, newField]);
        setSelectedFieldId(newField.id);
        setShowPalette(false);
    };

    const updateField = (updatedField: FormField) => {
        onChange(fields.map(f => f.id === updatedField.id ? updatedField : f));
    };

    const removeField = (fieldId: string) => {
        onChange(fields.filter(f => f.id !== fieldId));
        if (selectedFieldId === fieldId) setSelectedFieldId(null);
    };

    const duplicateField = (field: FormField) => {
        const duplicate: FormField = {
            ...field,
            id: generateFieldId(),
            label: `${field.label} (copy)`,
            order: fields.length,
        };
        const idx = fields.findIndex(f => f.id === field.id);
        const newFields = [...fields];
        newFields.splice(idx + 1, 0, duplicate);
        onChange(newFields.map((f, i) => ({ ...f, order: i })));
    };

    const moveField = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= fields.length) return;
        const newFields = [...fields];
        const [moved] = newFields.splice(fromIndex, 1);
        newFields.splice(toIndex, 0, moved);
        onChange(newFields.map((f, i) => ({ ...f, order: i })));
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        moveField(draggedIndex, index);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const selectedField = fields.find(f => f.id === selectedFieldId);
    const IconComponent = (name: string) => {
        const icons: Record<string, any> = Icons;
        return icons[name] || Icons.File;
    };

    return (
        <div className="flex gap-6 min-h-[500px]">
            {/* Fields list */}
            <div className="flex-1 space-y-3">
                {fields.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
                        <Icons.ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">No fields yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">Click &quot;Add Field&quot; to start building your form</p>
                        <button
                            onClick={() => setShowPalette(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                        >
                            <Icons.Plus className="w-4 h-4 inline mr-1.5" />
                            Add Field
                        </button>
                    </div>
                )}

                {fields.map((field, index) => {
                    const TypeIcon = IconComponent(FIELD_TYPES.find(ft => ft.type === field.type)?.icon || "File");
                    return (
                        <div
                            key={field.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedFieldId(field.id)}
                            className={`group relative p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedFieldId === field.id
                                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-md"
                                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"
                                } ${draggedIndex === index ? "opacity-50" : ""}`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Drag handle */}
                                <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                    <Icons.GripVertical className="w-5 h-5" />
                                </div>

                                {/* Field content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TypeIcon className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                            {field.label}
                                        </span>
                                        {field.required && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium">
                                                Required
                                            </span>
                                        )}
                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                                            {FIELD_TYPES.find(ft => ft.type === field.type)?.label}
                                        </span>
                                    </div>

                                    {/* Mini preview */}
                                    <div className="pointer-events-none opacity-60 scale-95 origin-top-left">
                                        <FieldRenderer field={field} value={undefined} onChange={() => { }} disabled />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveField(index, index - 1); }}
                                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                                        title="Move up"
                                        disabled={index === 0}
                                    >
                                        <Icons.ChevronDown className="w-4 h-4 rotate-180" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); moveField(index, index + 1); }}
                                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                                        title="Move down"
                                        disabled={index === fields.length - 1}
                                    >
                                        <Icons.ChevronDown className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); duplicateField(field); }}
                                        className="p-1 text-slate-400 hover:text-blue-500 rounded"
                                        title="Duplicate"
                                    >
                                        <Icons.Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                                        title="Delete"
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Add Field Button */}
                {fields.length > 0 && (
                    <button
                        onClick={() => setShowPalette(!showPalette)}
                        className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4" />
                        Add Field
                    </button>
                )}

                {/* Field Type Palette */}
                {showPalette && (
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Choose field type</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {FIELD_TYPES.map(({ type, label, icon }) => {
                                const Icon = IconComponent(icon);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => addField(type)}
                                        className="flex items-center gap-2 p-3 rounded-lg text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                                    >
                                        <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <span className="truncate">{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Field Editor Panel */}
            {selectedField && (
                <div className="w-80 flex-shrink-0 sticky top-0">
                    <FieldEditor
                        field={selectedField}
                        onChange={updateField}
                        onClose={() => setSelectedFieldId(null)}
                    />
                </div>
            )}
        </div>
    );
}
