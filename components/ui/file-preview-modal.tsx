"use client";

import { useEffect, useState } from "react";
import { File } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth/auth-context";

interface FilePreviewModalProps {
    isOpen: boolean;
    file: File | null;
    onClose: () => void;
    onDownload: (file: File) => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

export function FilePreviewModal({
    isOpen,
    file,
    onClose,
    onDownload,
    onNext,
    onPrev,
    hasNext = false,
    hasPrev = false,
}: FilePreviewModalProps) {
    const { user } = useAuth();
    const [downloadUrl, setDownloadUrl] = useState<string>("");

    useEffect(() => {
        const getUrl = async () => {
            if (!file || !user) return;
            try {
                const token = await user.getIdToken();
                const res = await fetch(`/api/files/download/${file.id}/url?token=${token}`);
                if (res.ok) {
                    const data = await res.json();
                    setDownloadUrl(data.url);
                } else {
                    console.error("Failed to fetch download url format");
                }
            } catch (err) {
                console.error("Error fetching preview url:", err);
            }
        };
        getUrl();
    }, [file, user]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight" && onNext && hasNext) onNext();
            if (e.key === "ArrowLeft" && onPrev && hasPrev) onPrev();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onNext, onPrev, hasNext, hasPrev, onClose]);

    if (!isOpen || !file) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col animate-in fade-in duration-200">
            {/* Viewer Header */}
            <div className="flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-md">
                <div className="flex flex-col">
                    <h3 className="font-medium text-lg">{file.name}</h3>
                    <span className="text-sm text-white/60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onDownload(file)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Download"
                    >
                        <Icons.Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Close (Esc)"
                    >
                        <span className="text-xl font-bold">✕</span>
                    </button>
                </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">
                {/* Navigation Buttons */}
                {onPrev && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className={`absolute left-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all ${!hasPrev ? "opacity-0 pointer-events-none" : ""
                            }`}
                        disabled={!hasPrev}
                    >
                        <span className="text-2xl">◀</span>
                    </button>
                )}

                <div className="max-w-full max-h-full flex items-center justify-center w-full h-full">
                    {file.mime_type.startsWith("image/") ? (
                        <img
                            src={downloadUrl}
                            alt={file.name}
                            crossOrigin="anonymous"
                            className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
                        />
                    ) : file.mime_type.startsWith("video/") ? (
                        <video
                            src={downloadUrl}
                            controls
                            autoPlay
                            crossOrigin="anonymous"
                            className="max-w-full max-h-[80vh] shadow-2xl rounded-lg bg-black"
                        >
                            Your browser does not support video playback.
                        </video>
                    ) : file.mime_type.startsWith("audio/") ? (
                        <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-12 rounded-2xl shadow-2xl text-center">
                            <div className="w-32 h-32 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
                                <span className="text-6xl">🎵</span>
                            </div>
                            <h3 className="text-white text-xl font-semibold mb-6">{file.name}</h3>
                            <audio
                                src={downloadUrl}
                                controls
                                autoPlay
                                crossOrigin="anonymous"
                                className="w-80"
                            >
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    ) : file.mime_type === "application/pdf" ? (
                        <iframe
                            src={downloadUrl}
                            className="w-[80vw] h-[80vh] bg-white rounded-lg shadow-2xl"
                        />
                    ) : (
                        <div className="text-center text-white">
                            <Icons.File className="w-20 h-20 mx-auto mb-4 opacity-50" />
                            <p className="text-xl mb-4">Preview not available</p>
                            <button
                                onClick={() => onDownload(file)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                Download to View
                            </button>
                        </div>
                    )}
                </div>

                {onNext && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className={`absolute right-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all ${!hasNext ? "opacity-0 pointer-events-none" : ""
                            }`}
                        disabled={!hasNext}
                    >
                        <span className="text-2xl">▶</span>
                    </button>
                )}
            </div>
        </div>
    );
}
