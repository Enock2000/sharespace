"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";

export default function FileUploader({
    currentFolderId,
    onUploadComplete
}: {
    currentFolderId: string | null,
    onUploadComplete: () => void
}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !user) return;

        setUploading(true);
        setProgress(0);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await uploadFile(file);
                setProgress(Math.round(((i + 1) / files.length) * 100));
            }
            onUploadComplete();
        } catch (error) {
            console.error("Failed to upload files:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setProgress(0);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user!.uid);
        formData.append("folderId", currentFolderId || "null");

        const response = await fetch("/api/files/upload-file", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Upload failed");
        }

        return await response.json();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,video/*,audio/*,text/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            />
            <button
                onClick={handleClick}
                disabled={uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
                {uploading ? (
                    <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Uploading... {progress}%</span>
                    </>
                ) : (
                    <>
                        <span>☁️</span>
                        <span>Upload Files</span>
                    </>
                )}
            </button>
        </>
    );
}
