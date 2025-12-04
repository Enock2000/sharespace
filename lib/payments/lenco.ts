'use server';

import { z } from 'zod';

const base = process.env.VSHR_BASE_URL!;
const secretKey = process.env.VSHR_SECRET_KEY!;

/* ---------------------- INITIATE MOBILE MONEY PAYMENT --------------------- */

export const MobileMoneySchema = z.object({
  amount: z.number(),
  currency: z.string(),
  phone: z.string(),
  country: z.string(),
  reference: z.string(),
});

export async function initiateMobileMoney(input: z.infer<typeof MobileMoneySchema>) {
  const valid = MobileMoneySchema.safeParse(input);
  if (!valid.success) return { success: false, error: valid.error.errors };

  try {
    const res = await fetch(`${base}/collections/mobile-money`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: input.amount.toString(),
        currency: input.currency,
        phone: input.phone,
        country: input.country,
        reference: input.reference
      })
    });

    const json = await res.json();
    if (!res.ok) return { success: false, error: json };

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/* ------------------------ VERIFY PAYMENT STATUS -------------------------- */

export async function verifyPayment(reference: string) {
  try {
    const res = await fetch(
      `${base}/collections/status/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );

    const json = await res.json();
    if (!res.ok) return { success: false, error: json };

    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
