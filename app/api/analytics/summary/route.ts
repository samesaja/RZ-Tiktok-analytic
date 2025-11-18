// app/api/analytics/summary/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ambil semua sesi (bisa dibatasi time window kalau sudah besar)
    const sessions = await prisma.liveSession.findMany({
      include: {
        metrics: true,
      },
    });

    if (!sessions.length) {
      return NextResponse.json({
        global: {
          totalAccounts: 0,
          totalSessions: 0,
          avgScoreAll: 0,
          bestScoreOverall: 0,
          medianScore: 0,
          engagementFactor: 0,
          retentionFactor: 0,
          qualityFactor: 0,
          monetizationFactor: 0,
          followFactor: 0,
        },
        accounts: [],
      });
    }

    // Flatten semua metrics per session
    type SessionAgg = {
      username: string;
      sessionId: string;
      startedAt: Date;
      endedAt: Date | null;
      scores: number[];
      engagementRates: number[];
      retentionRates: number[];
      engagementVelocities: number[];
      totalLikes: number;
      totalComments: number;
      totalGifts: number;
      totalGiftValue: number;
      totalJoins: number;
      totalFollows: number;
      peakViewers: number;
    };

    const sessionAggs: SessionAgg[] = sessions.map((s: any) => {
      const scores = s.metrics.map((m: any) => m.algorithmScore ?? 0);
      const engagementRates = s.metrics.map((m: any) => m.engagementRate ?? 0);
      const retentionRates = s.metrics.map((m: any) => m.retentionRate ?? 0);
      const engagementVelocities = s.metrics.map(
        (m: any) => m.engagementVelocity ?? 0
      );

      const lastMetric = s.metrics.at(-1);

      return {
        username: s.username,
        sessionId: s.sessionId,
        startedAt: s.startedAt,
        endedAt: s.endedAt ?? null,
        scores,
        engagementRates,
        retentionRates,
        engagementVelocities,
        totalLikes: lastMetric?.totalLikes ?? 0,
        totalComments: lastMetric?.totalComments ?? 0,
        totalGifts: lastMetric?.totalGifts ?? 0,
        totalGiftValue: lastMetric?.totalGiftValue ?? 0,
        totalJoins: lastMetric?.totalJoins ?? 0,
        totalFollows: lastMetric?.totalFollows ?? 0,
        peakViewers: lastMetric?.peakViewers ?? s.peakViewers ?? 0,
      };
    });

    // Semua score untuk global
    const allScores = sessionAggs
      .flatMap((s: SessionAgg) => s.scores)
      .filter((v) => v > 0);
    const totalSessions = sessions.length;
    const totalAccounts = new Set(
      sessions.map((s: any) => s.username)
    ).size;
    const avgScoreAll =
      allScores.reduce((sum, v) => sum + v, 0) / (allScores.length || 1);
    const bestScoreOverall = allScores.length
      ? Math.max(...allScores)
      : 0;
    const medianScore = computeMedian(allScores);

    // Faktor global (sangat sederhana: rata-rata normalized 0-100)
    const allEng = sessionAggs.flatMap((s: SessionAgg) => s.engagementRates);
    const allRet = sessionAggs.flatMap((s: SessionAgg) => s.retentionRates);
    const allVel = sessionAggs.flatMap((s: SessionAgg) => s.engagementVelocities);

    const engagementFactor = normalizeTo100(
      average(allEng),
      0,
      5 // anggap 5 interactions/viewer sudah sangat bagus
    );
    const retentionFactor = normalizeTo100(
      average(allRet),
      0,
      1 // 100% retention
    );
    const qualityFactor = engagementFactor; // placeholder (nanti bisa pakai unique commenters/gifters)
    const monetizationFactor = 0; // nanti bisa dihitung dari gifts/minute
    const followFactor = 0; // nanti dari follow/viewers

    // Group by username
    const byUsername = new Map<string, SessionAgg[]>();
    for (const s of sessionAggs) {
      if (!byUsername.has(s.username)) {
        byUsername.set(s.username, []);
      }
      byUsername.get(s.username)!.push(s);
    }

    const accounts = Array.from(byUsername.entries()).map(
      ([username, sess]) => {
        const allSessScores = sess
          .flatMap((s: SessionAgg) => s.scores)
          .filter((v) => v > 0);
        const avgScore =
          allSessScores.reduce((sum, v) => sum + v, 0) /
          (allSessScores.length || 1);
        const bestScore = allSessScores.length
          ? Math.max(...allSessScores)
          : 0;
        const worstScore = allSessScores.length
          ? Math.min(...allSessScores)
          : 0;

        const allEngRates = sess.flatMap((s) => s.engagementRates);
        const allRetRates = sess.flatMap((s) => s.retentionRates);
        const allVelRates = sess.flatMap((s) => s.engagementVelocities);

        const avgEngagementRate = average(allEngRates);
        const avgRetentionRate = average(allRetRates);
        const avgEngagementVelocity = average(allVelRates);

        // Simple strength/weakness based on normalized factors
        const factors = {
          engagement_velocity: normalizeTo100(avgEngagementVelocity, 0, 1),
          retention: normalizeTo100(avgRetentionRate, 0, 1),
          quality: normalizeTo100(avgEngagementRate, 0, 5),
          monetization: 0,
          follow: 0,
        };

        const sortedFactors = Object.entries(factors).sort(
          (a, b) => b[1] - a[1]
        );
        const strengthFactors = sortedFactors
          .filter(([, v]) => v >= 60)
          .map(([k]) => k)
          .slice(0, 2);
        const weaknessFactors = sortedFactors
          .filter(([, v]) => v < 40)
          .map(([k]) => k)
          .slice(0, 2);

        // Cari sesi terbaik
        let bestSession = sess[0];
        let bestSessScore = bestScore;
        for (const s of sess) {
          const sMax = s.scores.length ? Math.max(...s.scores) : 0;
          if (sMax >= bestSessScore) {
            bestSessScore = sMax;
            bestSession = s;
          }
        }

        // Latest session (by startedAt)
        const latest = sess
          .slice()
          .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
        const latestScore = latest.scores.length
          ? latest.scores[latest.scores.length - 1]
          : 0;

        return {
          username,
          displayName: null,
          sessionsCount: sess.length,
          avgScore,
          bestScore,
          worstScore,
          avgEngagementRate,
          avgRetentionRate,
          avgEngagementVelocity,
          strengthFactors,
          weaknessFactors,
          bestSessionId: bestSession.sessionId,
          bestSessionStartedAt: bestSession.startedAt.toISOString(),
          bestSessionPeakViewers: bestSession.peakViewers,
          bestSessionScore: bestSessScore,
          lastSessionScore: latestScore,
          lastSessionStartedAt: latest.startedAt.toISOString(),
        };
      }
    );

    return NextResponse.json({
      global: {
        totalAccounts,
        totalSessions,
        avgScoreAll,
        bestScoreOverall,
        medianScore,
        engagementFactor,
        retentionFactor,
        qualityFactor,
        monetizationFactor,
        followFactor,
      },
      accounts,
    });
  } catch (err: any) {
    console.error("[analytics/summary] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to compute analytics summary" },
      { status: 500 }
    );
  }
}

function average(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function computeMedian(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function normalizeTo100(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}

