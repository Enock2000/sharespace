"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { client, FILESTACK_OPTIONS } from "@/lib/filestack-config";
import { PickerFileMetadata } from "filestack-js";

export default function FileUploader({
    currentFolderId,
    onUploadComplete
}: {
    currentFolderId: string | null,
    onUploadComplete: () => void
}) {
    const [uploading, setUploading] = useState(false);
    const { user } = useAuth();

    const handleUpload = () => {
        if (!user) return;

        const pickerOptions = {
            ...FILESTACK_OPTIONS,
            onUploadDone: async (res: any) => {
                setUploading(true);
                try {
                    const filesUploaded = res.filesUploaded as PickerFileMetadata[];

                    // Save metadata to our database for each file
                    for (const file of filesUploaded) {
                        await saveFileMetadata(file);
                    }

                    onUploadComplete();
                } catch (error) {
                    console.error("Failed to save file metadata:", error);
                    alert("Upload completed but failed to save to database.");
                } finally {
                    setUploading(false);
                }
            },
        };

        client.picker(pickerOptions).open();
    };

    const saveFileMetadata = async (file: PickerFileMetadata) => {
        const response = await fetch("/api/files/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: file.filename,
                size: file.size,
                mime_type: file.mimetype,
                folderId: currentFolderId,
                userId: user?.uid,
                filestackUrl: file.url,
                filestackHandle: file.handle,
                source: "filestack"
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to save file metadata");
        }
    };

    return (
        <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
            {uploading ? (
                <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <span>☁️</span>
                    <span>Upload Files</span>
                </>
            )}
        </button>
    );
}
