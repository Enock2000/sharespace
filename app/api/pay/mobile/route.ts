import { initiateMobileMoney } from "@/lib/payments/lenco";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const result = await initiateMobileMoney({
            amount: body.amount,
            currency: body.currency,
            phone: body.phone,
            country: body.country,
            reference: body.reference,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
