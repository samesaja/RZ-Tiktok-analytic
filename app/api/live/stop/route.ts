// app/api/live/stop/route.ts
import { NextResponse } from "next/server";
import { stopMonitoring } from "@/lib/liveService";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
  } | null;

  if (!body?.username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  try {
    const data = await stopMonitoring(body.username);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[live/stop] Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to stop monitoring" },
      { status: 500 }
    );
  }
}

