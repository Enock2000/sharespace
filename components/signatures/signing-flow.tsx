"use client";
import { useState, useRef } from "react";
import { SignatureField } from "@/types/database";
import { Icons } from "@/components/ui/icons";

interface SigningFlowProps {
    requestTitle: string;
    requestMessage?: string;
    signerName: string;
    signerRole: string;
    documentUrl: string;
    documentPages: number;
    fields: SignatureField[];
    onSubmit: (fieldValues: Record<string, string>) => void;
    onDecline: () => void;
    submitting: boolean;
}

export default function SigningFlow({ requestTitle, requestMessage, signerName, signerRole, documentUrl, documentPages, fields, onSubmit, onDecline, submitting }: SigningFlowProps) {
    const [step, setStep] = useState<"review" | "sign" | "confirm">("review");
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeSignatureField, setActiveSignatureField] = useState<string | null>(null);

    const pageFields = fields.filter(f => f.page === currentPage);

    // Canvas signature drawing
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        setIsDrawing(true);
        const ctx = canvasRef.current.getContext("2d")!;
        ctx.beginPath();
        const rect = canvasRef.current.getBoundingClientRect();
        const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d")!;
        const rect = canvasRef.current.getBoundingClientRect();
        const pos = "touches" in e ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top } : { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#1e293b";
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const endDrawing = () => {
        if (!isDrawing || !canvasRef.current || !activeSignatureField) return;
        setIsDrawing(false);
        const dataUrl = canvasRef.current.toDataURL();
        setFieldValues(prev => ({ ...prev, [activeSignatureField]: dataUrl }));
    };

    const clearSignature = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d")!;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (activeSignatureField) {
            setFieldValues(prev => {
                const next = { ...prev };
                delete next[activeSignatureField];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        fields.forEach(field => {
            if (field.required && !fieldValues[field.id]) {
                newErrors[field.id] = `${field.label} is required`;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        setStep("confirm");
    };

    const confirmSubmit = () => {
        onSubmit(fieldValues);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{requestTitle}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Signing as {signerName} ({signerRole})</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Step indicators */}
                        {(["review", "sign", "confirm"] as const).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-indigo-500 text-white" :
                                        ["review", "sign", "confirm"].indexOf(step) > i ? "bg-green-500 text-white" :
                                            "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                    }`}>
                                    {["review", "sign", "confirm"].indexOf(step) > i ? "✓" : i + 1}
                                </div>
                                {i < 2 && <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {/* Step: Review */}
                {step === "review" && (
                    <div className="space-y-6">
                        {requestMessage && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400">{requestMessage}</p>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ height: "600px" }}>
                            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative">
                                {documentUrl ? (
                                    <img src={documentUrl} alt="Document" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <p className="text-slate-400">Document preview</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                onClick={onDecline}
                                className="px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                                Decline to Sign
                            </button>
                            <button
                                onClick={() => setStep("sign")}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                            >
                                Continue to Sign →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Sign */}
                {step === "sign" && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Complete your fields</h2>

                            {fields.map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {(field.type === "signature" || field.type === "initials") && (
                                        <div>
                                            {fieldValues[field.id] ? (
                                                <div className="relative">
                                                    <img src={fieldValues[field.id]} alt={field.type} className="h-20 border rounded-lg bg-white" />
                                                    <button
                                                        onClick={() => {
                                                            setFieldValues(prev => {
                                                                const next = { ...prev };
                                                                delete next[field.id];
                                                                return next;
                                                            });
                                                        }}
                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <canvas
                                                        ref={canvasRef}
                                                        width={400}
                                                        height={120}
                                                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-white cursor-crosshair touch-none"
                                                        onMouseDown={(e) => { setActiveSignatureField(field.id); startDrawing(e); }}
                                                        onMouseMove={draw}
                                                        onMouseUp={endDrawing}
                                                        onMouseLeave={endDrawing}
                                                        onTouchStart={(e) => { setActiveSignatureField(field.id); startDrawing(e); }}
                                                        onTouchMove={draw}
                                                        onTouchEnd={endDrawing}
                                                    />
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <button onClick={clearSignature} className="text-xs text-slate-500 hover:text-red-500 transition-colors">Clear</button>
                                                        <button onClick={endDrawing} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">Done</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {field.type === "text" && (
                                        <input
                                            value={fieldValues[field.id] || ""}
                                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Enter text..."
                                        />
                                    )}

                                    {field.type === "date" && (
                                        <input
                                            type="date"
                                            value={fieldValues[field.id] || ""}
                                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    )}

                                    {field.type === "checkbox" && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={fieldValues[field.id] === "true"}
                                                onChange={(e) => setFieldValues(prev => ({ ...prev, [field.id]: e.target.checked ? "true" : "" }))}
                                                className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">I agree</span>
                                        </label>
                                    )}

                                    {errors[field.id] && (
                                        <p className="text-xs text-red-500">{errors[field.id]}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setStep("review")}
                                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
                            >
                                Review & Submit →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Confirm */}
                {step === "confirm" && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                <Icons.Check className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Ready to Submit</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                By clicking submit, you agree that your electronic signature is legally binding.
                            </p>

                            {/* Summary of filled fields */}
                            <div className="text-left bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 space-y-3">
                                {fields.map(field => (
                                    <div key={field.id} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{field.label}</span>
                                        {fieldValues[field.id] ? (
                                            field.type === "signature" || field.type === "initials" ? (
                                                <img src={fieldValues[field.id]} alt="sig" className="h-8" />
                                            ) : (
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">{fieldValues[field.id]}</span>
                                            )
                                        ) : (
                                            <span className="text-xs text-slate-400">(empty)</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setStep("sign")}
                                    disabled={submitting}
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                    ← Edit
                                </button>
                                <button
                                    onClick={confirmSubmit}
                                    disabled={submitting}
                                    className="px-8 py-3 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-60 transition-colors shadow-sm"
                                >
                                    {submitting ? "Submitting..." : "✓ Sign & Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
