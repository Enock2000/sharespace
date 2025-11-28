import * as filestack from 'filestack-js';

const API_KEY = "A7wMT9KlRu6grbF2ZK9Cgz";

export const client = filestack.init(API_KEY);

export const FILESTACK_OPTIONS = {
    fromSources: ["local_file_system", "url", "imagesearch", "facebook", "instagram", "googledrive", "dropbox"],
    accept: ["image/*", "application/pdf", "video/*", "audio/*", "text/*"],
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024, // 100MB
};
