import { verifyPayment } from "@/lib/payments/lenco";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const reference = searchParams.get("reference");

        if (!reference) {
            return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
        }

        const result = await verifyPayment(reference);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
