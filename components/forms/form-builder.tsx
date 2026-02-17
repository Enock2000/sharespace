"use client";

import { FormField, FormFieldType } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import FieldEditor from "./field-editor";
import FieldRenderer from "./field-renderer";
import { useState, useRef } from "react";

interface FormBuilderProps {
    fields: FormField[];
    onChange: (fields: FormField[]) => void;
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string; description: string }[] = [
    { type: "short_text", label: "Short Text", icon: "Type", description: "Single-line text input" },
    { type: "long_text", label: "Long Text", icon: "FileText", description: "Multi-line text area" },
    { type: "number", label: "Number", icon: "Hash", description: "Numeric input" },
    { type: "email", label: "Email", icon: "Mail", description: "Email address field" },
    { type: "phone", label: "Phone", icon: "Phone", description: "Phone number field" },
    { type: "date", label: "Date", icon: "Calendar", description: "Date picker" },
    { type: "time", label: "Time", icon: "Clock", description: "Time picker" },
    { type: "dropdown", label: "Dropdown", icon: "ChevronDown", description: "Select from a list" },
    { type: "radio", label: "Multiple Choice", icon: "ListChecks", description: "Choose one option" },
    { type: "checkbox", label: "Checkboxes", icon: "Check", description: "Choose multiple options" },
    { type: "yes_no", label: "Yes / No", icon: "ToggleLeft", description: "Binary yes/no choice" },
    { type: "rating", label: "Rating", icon: "Star", description: "Star rating scale" },
    { type: "file_upload", label: "File Upload", icon: "Upload", description: "Upload a file" },
    { type: "signature", label: "Signature", icon: "Pen", description: "Draw a signature" },
];

function generateFieldId(): string {
    return "f_" + Math.random().toString(36).substring(2, 10);
}

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [showPalette, setShowPalette] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState("");
    const labelInputRef = useRef<HTMLInputElement>(null);

    const addField = (type: FormFieldType) => {
        const label = FIELD_TYPES.find(f => f.type === type)?.label || "Question";
        const newField: FormField = {
            id: generateFieldId(),
            type,
            label: `${label}`,
            required: false,
            order: fields.length,
            options: ["dropdown", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2", "Option 3"] : undefined,
            validation: type === "rating" ? { min: 1, max: 5 } : undefined,
        };
        onChange([...fields, newField]);
        setSelectedFieldId(newField.id);
        setEditingLabelId(newField.id);
        setShowPalette(false);
        setSearchFilter("");
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

    const toggleRequired = (fieldId: string) => {
        onChange(fields.map(f => f.id === fieldId ? { ...f, required: !f.required } : f));
    };

    // Drag and drop
    const handleDragStart = (index: number) => { setDraggedIndex(index); };
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        moveField(draggedIndex, index);
        setDraggedIndex(index);
    };
    const handleDragEnd = () => { setDraggedIndex(null); };

    const selectedField = fields.find(f => f.id === selectedFieldId);
    const IconComponent = (name: string) => {
        const icons: Record<string, any> = Icons;
        return icons[name] || Icons.File;
    };

    const filteredTypes = searchFilter
        ? FIELD_TYPES.filter(ft => ft.label.toLowerCase().includes(searchFilter.toLowerCase()) || ft.description.toLowerCase().includes(searchFilter.toLowerCase()))
        : FIELD_TYPES;

    return (
        <div className="flex gap-6 min-h-[500px]">
            {/* Main fields area */}
            <div className="flex-1 space-y-3">
                {/* Empty state */}
                {fields.length === 0 && !showPalette && (
                    <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Icons.ClipboardList className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Build Your Form</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                            Add questions to your form by clicking the button below. Choose from 14 different field types.
                        </p>
                        <button
                            onClick={() => setShowPalette(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                        >
                            <Icons.Plus className="w-4 h-4 inline mr-2" />
                            Add Your First Question
                        </button>
                    </div>
                )}

                {/* Existing fields */}
                {fields.map((field, index) => {
                    const TypeIcon = IconComponent(FIELD_TYPES.find(ft => ft.type === field.type)?.icon || "File");
                    const isSelected = selectedFieldId === field.id;
                    const isEditingLabel = editingLabelId === field.id;

                    return (
                        <div
                            key={field.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedFieldId(field.id)}
                            className={`group relative rounded-xl border-2 transition-all cursor-pointer ${isSelected
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg shadow-blue-500/5"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                                } ${draggedIndex === index ? "opacity-50 scale-95" : ""}`}
                        >
                            {/* Field number badge */}
                            <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                {index + 1}
                            </div>

                            <div className="p-4 pl-6">
                                <div className="flex items-start gap-3">
                                    {/* Drag handle */}
                                    <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icons.GripVertical className="w-5 h-5" />
                                    </div>

                                    {/* Field content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Label row */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <TypeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            {isEditingLabel ? (
                                                <input
                                                    ref={labelInputRef}
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateField({ ...field, label: e.target.value })}
                                                    onBlur={() => setEditingLabelId(null)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") setEditingLabelId(null); }}
                                                    className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-blue-400 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                                                    autoFocus
                                                    placeholder="Type your question..."
                                                />
                                            ) : (
                                                <span
                                                    className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate cursor-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); setEditingLabelId(field.id); }}
                                                    title="Click to edit question"
                                                >
                                                    {field.label || "Untitled Question"}
                                                </span>
                                            )}
                                            {field.required && (
                                                <span className="text-red-500 text-sm font-bold">*</span>
                                            )}
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-medium">
                                                {FIELD_TYPES.find(ft => ft.type === field.type)?.label}
                                            </span>
                                        </div>

                                        {/* Live field preview */}
                                        <div className="pointer-events-none opacity-50 scale-[0.97] origin-top-left">
                                            <FieldRenderer field={field} value={undefined} onChange={() => { }} disabled />
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingLabelId(field.id); }}
                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                            title="Edit question"
                                        >
                                            <Icons.Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleRequired(field.id); }}
                                            className={`p-1.5 rounded-lg transition-all ${field.required ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                                            title={field.required ? "Remove required" : "Mark as required"}
                                        >
                                            <Icons.AlertTriangle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); duplicateField(field); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                            title="Duplicate"
                                        >
                                            <Icons.Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); moveField(index, index - 1); }}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30"
                                            title="Move up"
                                            disabled={index === 0}
                                        >
                                            <Icons.ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); moveField(index, index + 1); }}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30"
                                            title="Move down"
                                            disabled={index === fields.length - 1}
                                        >
                                            <Icons.ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-0.5" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Delete question"
                                        >
                                            <Icons.Trash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Add Question Button — always visible */}
                <button
                    onClick={() => setShowPalette(!showPalette)}
                    className={`w-full py-4 border-2 border-dashed rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${showPalette
                        ? "border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                        : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
                        }`}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${showPalette ? "bg-blue-500 text-white rotate-45" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                        <Icons.Plus className="w-4 h-4" />
                    </div>
                    {showPalette ? "Choose a question type" : "Add Question"}
                </button>

                {/* Field Type Palette */}
                {showPalette && (
                    <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Question Types</h4>
                            <button
                                onClick={() => { setShowPalette(false); setSearchFilter(""); }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search field types */}
                        <div className="relative mb-4">
                            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                placeholder="Search field types..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {filteredTypes.map(({ type, label, icon, description }) => {
                                const Icon = IconComponent(icon);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => addField(type)}
                                        className="flex flex-col items-start gap-1.5 p-3 rounded-xl text-left hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{description}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredTypes.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">No matching field types</p>
                        )}
                    </div>
                )}

                {/* Field count summary */}
                {fields.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2">
                        <span>{fields.length} question{fields.length !== 1 ? "s" : ""}</span>
                        <span>{fields.filter(f => f.required).length} required</span>
                    </div>
                )}
            </div>

            {/* Field Editor Panel */}
            {selectedField && (
                <div className="w-80 flex-shrink-0 sticky top-0 self-start">
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
