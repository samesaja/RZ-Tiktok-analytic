// app/api/live/active/route.ts
import { NextResponse } from "next/server";
import { getActiveMonitors } from "@/lib/liveService";

export async function GET() {
  try {
    const data = await getActiveMonitors();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[live/active] Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch active monitors" },
      { status: 500 }
    );
  }
}

