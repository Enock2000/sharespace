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
                await uploadFileToBackblaze(file);
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

    const uploadFileToBackblaze = async (file: File) => {
        // Step 1: Get upload URL from our API
        const urlResponse = await fetch("/api/files/upload-url");
        if (!urlResponse.ok) {
            throw new Error("Failed to get upload URL");
        }
        const { uploadUrl, authorizationToken } = await urlResponse.json();

        // Step 2: Upload file directly to Backblaze B2
        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Authorization": authorizationToken,
                "X-Bz-File-Name": encodeURIComponent(file.name),
                "Content-Type": file.type || "application/octet-stream",
                "X-Bz-Content-Sha1": "do_not_verify"
            },
            body: file
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("B2 Upload Error:", errorText);
            throw new Error("Failed to upload to Backblaze");
        }

        const uploadResult = await uploadResponse.json();

        // Step 3: Save metadata to our database
        const saveResponse = await fetch("/api/files/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: file.name,
                size: file.size,
                mime_type: file.type || "application/octet-stream",
                folderId: currentFolderId,
                userId: user?.uid,
                provider: "backblaze",
                fileId: uploadResult.fileId,
                fileName: uploadResult.fileName
            }),
        });

        if (!saveResponse.ok) {
            throw new Error("Failed to save file metadata");
        }
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
