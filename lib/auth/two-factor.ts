import * as OTPAuth from "otpauth";
import { db } from "@/lib/database/schema";
import QRCode from "qrcode";

// Store secrets in a protected path, not in the public user object
const SECRETS_PATH = "secrets/2fa";

export const generateTwoFactorSecret = async (userId: string, email: string) => {
    // Generate a new TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });

    // Create the TOTP object
    const totp = new OTPAuth.TOTP({
        issuer: "SharedSpaces",
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: secret
    });

    // Save secret to database (encrypted in a real app, plaintext here for MVP/POC but in a secure path)
    // We store the base32 string
    await db.set(`${SECRETS_PATH}/${userId}`, { secret: secret.base32 });

    // Generate otpauth URL
    const otpauthUrl = totp.toString();

    // Generate QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    return {
        secret: secret.base32,
        otpauthUrl,
        qrCodeUrl
    };
};

export const verifyTwoFactorToken = async (userId: string, token: string): Promise<boolean> => {
    const secretData = await db.get<{ secret: string }>(`${SECRETS_PATH}/${userId}`);
    if (!secretData || !secretData.secret) return false;

    const totp = new OTPAuth.TOTP({
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretData.secret)
    });

    // Validate the token
    // delta returns null if invalid, or the drift counter (integer) if valid
    const delta = totp.validate({ token, window: 1 });

    return delta !== null;
};
