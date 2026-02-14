export class RateLimiter {
    private requests: Map<string, { count: number; expiresAt: number }>;

    constructor() {
        this.requests = new Map();
    }

    check(identifier: string, limit: number, windowMs: number): boolean {
        const now = Date.now();
        const record = this.requests.get(identifier);

        if (!record || now > record.expiresAt) {
            this.requests.set(identifier, {
                count: 1,
                expiresAt: now + windowMs
            });
            return true;
        }

        if (record.count >= limit) {
            return false;
        }

        record.count++;
        return true;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now > record.expiresAt) {
                this.requests.delete(key);
            }
        }
    }
}

// Singleton instance for the application
export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
