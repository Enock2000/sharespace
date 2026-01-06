"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";

export default function B2FileUploader({
    currentFolderId,
    onUploadComplete
}: {
    currentFolderId: string | null,
    onUploadComplete: () => void
}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;

        setUploading(true);
        setProgress(0);
        setTotalFiles(files.length);
        setCurrentFileIndex(0);

        try {
            for (let i = 0; i < files.length; i++) {
                setCurrentFileIndex(i + 1);
                await uploadFile(files[i]);
                setProgress(Math.round(((i + 1) / files.length) * 100));
            }
            onUploadComplete();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setProgress(0);
            setTotalFiles(0);
            setCurrentFileIndex(0);
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

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
                multiple
                accept="image/*,application/pdf,video/*,audio/*,text/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
                {uploading ? (
                    <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>{currentFileIndex}/{totalFiles} ({progress}%)</span>
                    </>
                ) : (
                    <>
                        <Icons.UploadCloud className="w-5 h-5" />
                        <span>Upload Files</span>
                    </>
                )}
            </button>
        </div>
    );
}
