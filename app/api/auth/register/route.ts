import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { Tenant, User } from "@/types/database";
id: folderId,
    name: "General",
        parent_id: null,
            tenant_id: tenantId,
                owner_id: userId,
                    created_at: now,
                        path: [],
        });

return NextResponse.json({ success: true, tenantId });
    } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
}
}
