// app/api/live/metrics/route.ts
import { NextResponse } from "next/server";
import { getLiveMetrics } from "@/lib/liveService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  try {
    const data = await getLiveMetrics(username);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[live/metrics] Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to fetch live metrics" },
      { status: 500 }
    );
  }
}

