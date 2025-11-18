// app/api/analytics/account/[username]/gemini/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function GET(
  _req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username: rawUsername } = await context.params;
  const username = decodeURIComponent(rawUsername);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const sessions = await prisma.liveSession.findMany({
      where: { username },
      include: { metrics: true },
      orderBy: { startedAt: "asc" },
    });

    if (!sessions.length) {
      return NextResponse.json({
        username,
        analysis:
          "Belum ada sesi live yang terekam untuk akun ini, jadi analisis AI belum bisa dibuat.",
      });
    }

    const summary = sessions.map((s: any) => {
      const sortedMetrics = [...s.metrics].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      const scores = sortedMetrics.map((m) => m.algorithmScore ?? 0);
      const engagementRates = sortedMetrics.map((m) => m.engagementRate ?? 0);
      const retentionRates = sortedMetrics.map((m) => m.retentionRate ?? 0);

      const lastScore = scores.length ? scores[scores.length - 1] : 0;
      const avgEngagement = engagementRates.length
        ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
        : 0;
      const avgRetention = retentionRates.length
        ? retentionRates.reduce((a, b) => a + b, 0) / retentionRates.length
        : 0;

      return {
        sessionId: s.sessionId,
        startedAt: s.startedAt.toISOString(),
        lastScore,
        avgEngagement,
        avgRetention,
      };
    });

    const prompt = `Anda adalah analis live streaming TikTok.
Berdasarkan data historis beberapa sesi live untuk akun @${username}, berikan analisis singkat dalam bahasa Indonesia.

Data (JSON):
${JSON.stringify(summary, null, 2)}

Tolong berikan jawaban:
- Ringkasan performa akun secara umum (1 paragraf singkat).
- Pola yang terlihat dari score dan engagement/retention.
- 3 saran praktis dan spesifik untuk meningkatkan performa live berikutnya.
Gunakan bullet list yang rapi, maksimal 200-250 kata.`;

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[gemini] HTTP error", res.status, text);
      return NextResponse.json(
        { error: `Gemini error ${res.status}: ${text.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const json = (await res.json()) as any;
    const analysisText: string | undefined =
      json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysisText) {
      console.error("[gemini] Unexpected response shape", JSON.stringify(json).slice(0, 500));
      return NextResponse.json(
        { error: "Tidak bisa membaca respon dari Gemini" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      username,
      analysis: analysisText,
    });
  } catch (err: any) {
    console.error("[analytics/account/gemini] Error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to generate Gemini analysis" },
      { status: 500 }
    );
  }
}
