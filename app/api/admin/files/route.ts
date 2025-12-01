import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    files = files.filter((f) => f.tenant_id === tenantId);
}

if (search) {
    files = files.filter((f) =>
        f.name.toLowerCase().includes(search) ||
        f.uploaded_by.toLowerCase().includes(search)
    );
}

// Sort by date desc
files.sort((a, b) => b.created_at - a.created_at);

// Limit results for performance (e.g., 100 most recent)
// In a real app, implement cursor-based pagination
const limitedFiles = files.slice(0, 100);

return NextResponse.json({ files: limitedFiles });
    } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
    );
}
}
