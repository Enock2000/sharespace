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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        setProgress(0);

        try {
            // 1. Get Upload URL
            const urlRes = await fetch("/api/files/b2-upload-url");
            if (!urlRes.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, authorizationToken } = await urlRes.json();

            // 2. Upload to B2
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", uploadUrl);

                xhr.setRequestHeader("Authorization", authorizationToken);
                xhr.setRequestHeader("X-Bz-File-Name", encodeURIComponent(file.name));
                xhr.setRequestHeader("Content-Type", file.type || "b2/x-auto");
                xhr.setRequestHeader("X-Bz-Content-Sha1", "do_not_verify"); // Faster, but less safe. Good for browser uploads.

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        setProgress(Math.round(percentComplete));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Network error during upload"));
                xhr.send(file);
            })
                .then(async (b2Response: any) => {
                    // 3. Save Metadata
                    const saveRes = await fetch("/api/files/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: file.name,
                            size: file.size,
                            mime_type: file.type,
                            folderId: currentFolderId,
                            userId: user.uid,
                            provider: "backblaze",
                            fileId: b2Response.fileId,
                            fileName: b2Response.fileName,
                            bucketId: b2Response.bucketId
                        }),
                    });

                    if (!saveRes.ok) throw new Error("Failed to save file metadata");

                    onUploadComplete();
                });

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

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
                {uploading ? (
                    <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>{progress}%</span>
                    </>
                ) : (
                    <>
                        <Icons.UploadCloud className="w-5 h-5" />
                        <span>Upload File</span>
                    </>
                )}
            </button>
        </div>
    );
}
