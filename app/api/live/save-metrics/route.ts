// app/api/live/save-metrics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LiveMetricsResponse } from "@/lib/liveService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiveMetricsResponse;

    const {
      username,
      session_id,
      current_metrics,
      raw_metrics,
    } = body;

    if (!username || !session_id) {
      return NextResponse.json(
        { error: "username and session_id are required" },
        { status: 400 }
      );
    }

    // Normalisasi username
    const normalizedUsername = username.replace(/^@/, "").toLowerCase();

    // Pastikan LiveSession ada
    const session = await prisma.liveSession.upsert({
      where: { sessionId: session_id },
      update: {
        username: normalizedUsername,
        // kalau Python nanti kirim finalScore/endedAt, bisa update di sini
      },
      create: {
        sessionId: session_id,
        username: normalizedUsername,
        isStreaming: true,
      },
    });

    // Simpan snapshot ke LiveMetrics
    await prisma.liveMetrics.create({
      data: {
        sessionId: session.sessionId,
        // timestamp pakai default now() di schema; kalau mau pakai waktu client,
        // bisa tambahkan field timestamp di body dan pakai di sini.

        viewers: current_metrics.viewers,
        peakViewers: current_metrics.peak_viewers,
        engagementRate: current_metrics.engagement_rate,
        algorithmScore: current_metrics.algorithm_score,
        engagementVelocity: current_metrics.engagement_velocity,
        retentionRate: current_metrics.retention_rate,

        totalLikes: raw_metrics.total_likes,
        totalComments: raw_metrics.total_comments,
        totalGifts: raw_metrics.total_gifts,
        totalGiftValue: raw_metrics.total_gift_value,
        totalJoins: raw_metrics.total_joins,
        totalFollows: raw_metrics.total_follows,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[live/save-metrics] Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Failed to save live metrics" },
      { status: 500 }
    );
  }
}

