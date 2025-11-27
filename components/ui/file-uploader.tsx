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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setProgress(0);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await uploadFile(file);
            }
            onUploadComplete();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const uploadFile = async (file: File) => {
        // 1. Get upload URL from API
        const response = await fetch("/api/files/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: file.name,
                size: file.size,
                mime_type: file.type,
                folderId: currentFolderId,
                userId: user?.uid,
            }),
        });

        if (!response.ok) throw new Error("Failed to get upload URL");

        const { uploadUrl, authorizationToken, fileId, storageKey } = await response.json();

        // 2. Upload to B2
        // For MVP, we'll do a simple upload. For >50MB, we'd implement chunking here.
        // B2 requires SHA1 checksum in header for small files, or "do_not_verify"

        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: {
                "Authorization": authorizationToken,
                "X-Bz-File-Name": storageKey, // We use the storage key as the filename in B2
                "Content-Type": file.type || "application/octet-stream",
                "X-Bz-Content-Sha1": "do_not_verify",
                "X-Bz-Info-Author": user?.uid || "unknown",
            },
            body: file,
        });

        if (!uploadResponse.ok) {
            throw new Error("Failed to upload to storage");
        }

        // 3. Confirm upload (optional, but good for updating status)
        // In our design, the initial API call already created the DB record
        // We might want to update it to "active" status if we had a status field
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                {uploading ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Uploading...</span>
                    </>
                ) : (
                    <>
                        <span>☁️</span>
                        <span>Upload File</span>
                    </>
                )}
            </button>
        </div>
    );
}
