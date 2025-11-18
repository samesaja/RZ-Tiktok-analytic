// app/api/analytics/account/[username]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username: rawUsername } = await context.params;
  const username = decodeURIComponent(rawUsername);

  try {
    const sessions = await prisma.liveSession.findMany({
      where: { username },
      include: { metrics: true },
      orderBy: { startedAt: "asc" },
    });

    if (!sessions.length) {
      return NextResponse.json({
        username,
        sessions: [],
      });
    }

    const sessionSeries = sessions.map((s: any) => {
      const sortedMetrics = [...s.metrics].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      const scores = sortedMetrics.map((m) => m.algorithmScore ?? 0);
      const engagementRates = sortedMetrics.map((m) => m.engagementRate ?? 0);
      const retentionRates = sortedMetrics.map((m) => m.retentionRate ?? 0);

      const lastMetric = sortedMetrics.at(-1);

      return {
        sessionId: s.sessionId,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
        scores,
        engagementRates,
        retentionRates,
        lastScore: scores.length ? scores[scores.length - 1] : 0,
        peakViewers: lastMetric?.peakViewers ?? s.peakViewers ?? 0,
        totalLikes: lastMetric?.totalLikes ?? 0,
        totalComments: lastMetric?.totalComments ?? 0,
        totalGifts: lastMetric?.totalGifts ?? 0,
      };
    });

    return NextResponse.json({
      username,
      sessions: sessionSeries,
    });
  } catch (err: any) {
    console.error("[analytics/account] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load account analytics" },
      { status: 500 }
    );
  }
}
