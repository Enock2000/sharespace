// Resumable Upload Library for Backblaze B2 Large File API
// Supports chunked uploads with localStorage persistence for resume capability

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const STORAGE_KEY = "resumable_uploads";
const MAX_RETRIES = 3;

export interface UploadPart {
    partNumber: number;
    sha1: string;
    uploaded: boolean;
}

export interface ResumableUploadState {
    id: string;
    fileId: string; // B2 file ID
    fileName: string;
    fileSize: number;
    contentType: string;
    folderId: string | null;
    userId: string;
    parts: UploadPart[];
    currentPart: number;
    startedAt: number;
    lastUpdated: number;
}

export interface UploadProgress {
    uploadId: string;
    fileName: string;
    totalParts: number;
    uploadedParts: number;
    percentComplete: number;
    bytesUploaded: number;
    totalBytes: number;
    status: "pending" | "uploading" | "paused" | "complete" | "error";
    error?: string;
}

// Save upload state to localStorage
function saveUploadState(state: ResumableUploadState) {
    const uploads = getStoredUploads();
    uploads[state.id] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
}

// Get all stored uploads
function getStoredUploads(): Record<string, ResumableUploadState> {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
    }
}

// Remove upload from storage
function removeUploadState(uploadId: string) {
    const uploads = getStoredUploads();
    delete uploads[uploadId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
}

// Generate a simple hash for file identification
async function generateFileHash(file: File): Promise<string> {
    const slice = file.slice(0, 1024 * 1024); // First 1MB
    const buffer = await slice.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return `${file.name}_${file.size}_${hashHex.substring(0, 16)}`;
}

// Calculate SHA1 of a chunk (required by B2)
async function calculateSha1(chunk: Blob): Promise<string> {
    const buffer = await chunk.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Get pending uploads for a user
export function getPendingUploads(userId: string): ResumableUploadState[] {
    const uploads = getStoredUploads();
    return Object.values(uploads).filter(u => u.userId === userId);
}

// Check if file has a pending upload
export async function findPendingUpload(file: File, userId: string): Promise<ResumableUploadState | null> {
    const hash = await generateFileHash(file);
    const uploads = getStoredUploads();
    const pending = uploads[hash];
    if (pending && pending.userId === userId && pending.fileSize === file.size) {
        return pending;
    }
    return null;
}

// Start a new resumable upload
export async function startResumableUpload(
    file: File,
    folderId: string | null,
    userId: string,
    onProgress: (progress: UploadProgress) => void
): Promise<void> {
    const uploadId = await generateFileHash(file);
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);

    // Check for existing upload
    let state = await findPendingUpload(file, userId);

    if (!state) {
        // Start new large file upload
        const startResponse = await fetch("/api/files/large-file/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileName: file.name,
                contentType: file.type || "application/octet-stream",
            }),
        });

        if (!startResponse.ok) {
            throw new Error("Failed to start upload");
        }

        const { fileId, fileName } = await startResponse.json();

        // Initialize state
        state = {
            id: uploadId,
            fileId,
            fileName,
            fileSize: file.size,
            contentType: file.type || "application/octet-stream",
            folderId,
            userId,
            parts: Array.from({ length: totalParts }, (_, i) => ({
                partNumber: i + 1,
                sha1: "",
                uploaded: false,
            })),
            currentPart: 0,
            startedAt: Date.now(),
            lastUpdated: Date.now(),
        };

        saveUploadState(state);
    }

    // Resume or continue upload
    await uploadParts(file, state, onProgress);
}

// Upload file parts
async function uploadParts(
    file: File,
    state: ResumableUploadState,
    onProgress: (progress: UploadProgress) => void
) {
    const totalParts = state.parts.length;
    const partSha1Array: string[] = [];

    // Collect already uploaded parts
    for (const part of state.parts) {
        if (part.uploaded) {
            partSha1Array[part.partNumber - 1] = part.sha1;
        }
    }

    for (let i = 0; i < totalParts; i++) {
        const part = state.parts[i];

        if (part.uploaded) {
            // Already uploaded, skip
            continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Report progress
        const uploadedParts = state.parts.filter(p => p.uploaded).length;
        onProgress({
            uploadId: state.id,
            fileName: file.name,
            totalParts,
            uploadedParts,
            percentComplete: Math.round((uploadedParts / totalParts) * 100),
            bytesUploaded: uploadedParts * CHUNK_SIZE,
            totalBytes: file.size,
            status: "uploading",
        });

        // Upload this part with retries
        let retries = 0;
        let success = false;

        while (retries < MAX_RETRIES && !success) {
            try {
                // Get upload URL for this part
                const urlResponse = await fetch("/api/files/large-file/part-url", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileId: state.fileId }),
                });

                if (!urlResponse.ok) {
                    throw new Error("Failed to get part upload URL");
                }

                const { uploadUrl, authorizationToken } = await urlResponse.json();

                // Calculate SHA1 of chunk
                const sha1 = await calculateSha1(chunk);

                // Upload chunk
                const uploadResponse = await fetch(uploadUrl, {
                    method: "POST",
                    headers: {
                        Authorization: authorizationToken,
                        "X-Bz-Part-Number": String(part.partNumber),
                        "Content-Length": String(chunk.size),
                        "X-Bz-Content-Sha1": sha1,
                    },
                    body: chunk,
                });

                if (!uploadResponse.ok) {
                    throw new Error(`Part upload failed: ${uploadResponse.status}`);
                }

                // Mark part as uploaded
                part.sha1 = sha1;
                part.uploaded = true;
                partSha1Array[part.partNumber - 1] = sha1;
                state.lastUpdated = Date.now();
                saveUploadState(state);

                success = true;
            } catch (error) {
                retries++;
                if (retries >= MAX_RETRIES) {
                    onProgress({
                        uploadId: state.id,
                        fileName: file.name,
                        totalParts,
                        uploadedParts: state.parts.filter(p => p.uploaded).length,
                        percentComplete: Math.round((state.parts.filter(p => p.uploaded).length / totalParts) * 100),
                        bytesUploaded: state.parts.filter(p => p.uploaded).length * CHUNK_SIZE,
                        totalBytes: file.size,
                        status: "error",
                        error: `Failed after ${MAX_RETRIES} retries`,
                    });
                    throw error;
                }
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            }
        }
    }

    // All parts uploaded, finish the upload
    const finishResponse = await fetch("/api/files/large-file/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileId: state.fileId,
            partSha1Array,
            fileName: state.fileName,
            fileSize: state.fileSize,
            contentType: state.contentType,
            folderId: state.folderId,
            userId: state.userId,
        }),
    });

    if (!finishResponse.ok) {
        throw new Error("Failed to finish upload");
    }

    // Remove from storage on success
    removeUploadState(state.id);

    onProgress({
        uploadId: state.id,
        fileName: file.name,
        totalParts,
        uploadedParts: totalParts,
        percentComplete: 100,
        bytesUploaded: file.size,
        totalBytes: file.size,
        status: "complete",
    });
}

// Resume an existing upload
export async function resumeUpload(
    file: File,
    state: ResumableUploadState,
    onProgress: (progress: UploadProgress) => void
): Promise<void> {
    await uploadParts(file, state, onProgress);
}

// Cancel an upload
export async function cancelUpload(uploadId: string): Promise<void> {
    const uploads = getStoredUploads();
    const state = uploads[uploadId];

    if (state) {
        // Cancel on B2
        try {
            await fetch("/api/files/large-file/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: state.fileId }),
            });
        } catch {
            // Ignore errors on cancel
        }

        removeUploadState(uploadId);
    }
}

// Clear all pending uploads
export function clearPendingUploads() {
    localStorage.removeItem(STORAGE_KEY);
}
