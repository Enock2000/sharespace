import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";

export async function GET(request: Request) {
    try {
        // In a real app, we should verify the user is authenticated here
        // The middleware protects /admin routes, but this is an API route
        // Assuming the client calling this is authenticated

        const data = await backblazeService.getUploadUrl();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Failed to get B2 upload URL:", error);
        return NextResponse.json(
            { error: "Failed to get upload URL" },
            { status: 500 }
        );
    }
}
