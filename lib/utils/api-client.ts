import { User as FirebaseUser } from "firebase/auth";

/**
 * Wrapper around fetch() that automatically attaches the Firebase ID token
 * as an Authorization header for authenticated API requests.
 *
 * Usage:
 * ```
 * import { authFetch } from "@/lib/utils/api-client";
 * const res = await authFetch("/api/files", { method: "GET" }, user);
 * ```
 */
export async function authFetch(
    url: string,
    options: RequestInit = {},
    firebaseUser: FirebaseUser
): Promise<Response> {
    const idToken = await firebaseUser.getIdToken();

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${idToken}`);

    return fetch(url, {
        ...options,
        headers,
    });
}
