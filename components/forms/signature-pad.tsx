"use client";

import { useRef, useEffect, useState } from "react";

interface SignaturePadProps {
    value?: string;
    onChange: (dataUrl: string) => void;
    width?: number;
    height?: number;
    disabled?: boolean;
}

export default function SignaturePad({
    value,
    onChange,
    width = 400,
    height = 200,
    disabled = false,
}: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set up canvas
        canvas.width = width;
        canvas.height = height;
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Draw existing value
        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                setHasSignature(true);
            };
            img.src = value;
        }
    }, []);

    const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ("touches" in e) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx) return;

        const pos = getPosition(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setHasSignature(true);

        const canvas = canvasRef.current;
        if (canvas) {
            onChange(canvas.toDataURL("image/png"));
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onChange("");
    };

    return (
        <div className="space-y-2">
            <div
                className={`relative border-2 rounded-lg overflow-hidden ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800" : "border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 cursor-crosshair"
                    }`}
                style={{ maxWidth: width }}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full touch-none"
                    style={{ height: height, maxWidth: "100%" }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasSignature && !disabled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 dark:text-slate-500 text-sm">
                        Sign here
                    </div>
                )}
            </div>
            {!disabled && hasSignature && (
                <button
                    type="button"
                    onClick={clear}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                    Clear signature
                </button>
            )}
        </div>
    );
}
