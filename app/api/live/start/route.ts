// app/api/live/start/route.ts
import { NextResponse } from "next/server";
import { startMonitoring } from "@/lib/liveService";

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
    const data = await startMonitoring(body.username);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[live/start] Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to start monitoring" },
      { status: 500 }
    );
  }
}

