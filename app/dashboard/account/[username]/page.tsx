"use client";

// app/dashboard/account/[username]/page.tsx
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

interface SessionSeries {
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  scores: number[];
  engagementRates: number[];
  retentionRates: number[];
  lastScore: number;
  peakViewers: number;
  totalLikes: number;
  totalComments: number;
  totalGifts: number;
}

interface AccountDetailResponse {
  username: string;
  sessions: SessionSeries[];
  error?: string;
}

interface GeminiAnalysisResponse {
  username: string;
  analysis: string;
  error?: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function AccountDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);

  const [data, setData] = useState<AccountDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/analytics/account/${encodeURIComponent(decodedUsername)}`
        );
        const json = (await res.json()) as AccountDetailResponse;
        if (!res.ok || (json as any).error) {
          throw new Error((json as any).error || `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? "Gagal memuat analytics akun.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [decodedUsername]);

  useEffect(() => {
    if (!decodedUsername) return;
    let cancelled = false;

    const loadGemini = async () => {
      setGeminiLoading(true);
      setGeminiError(null);
      try {
        const res = await fetch(
          `/api/analytics/account/${encodeURIComponent(
            decodedUsername
          )}/gemini`
        );
        const json = (await res.json()) as GeminiAnalysisResponse;
        if (!res.ok || (json as any).error) {
          throw new Error((json as any).error || `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setGeminiAnalysis(json.analysis);
        }
      } catch (err: any) {
        if (!cancelled) {
          setGeminiError(err.message ?? "Gagal memuat analisis Gemini.");
        }
      } finally {
        if (!cancelled) {
          setGeminiLoading(false);
        }
      }
    };

    loadGemini();

    return () => {
      cancelled = true;
    };
  }, [decodedUsername]);

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Analisis Akun: @{decodedUsername}
          </h1>
          <p className="text-sm text-slate-400">
            Ringkasan historis dan visualisasi performa live.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 text-slate-200"
          onClick={handleBack}
        >
          Kembali ke Dashboard
        </Button>
      </header>

      <main className="flex-1 px-6 py-6 space-y-4">
        {loading && (
          <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-slate-400">
            Memuat data akun…
          </Card>
        )}

        {!loading && error && (
          <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-red-400">
            Gagal memuat: {error}
          </Card>
        )}

        {!loading && !error && data && data.sessions.length === 0 && (
          <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-slate-400">
            Belum ada sesi live yang terekam untuk akun ini.
          </Card>
        )}

        {!loading && !error && data && data.sessions.length > 0 && (
          <>
            <GeminiInsight
              loading={geminiLoading}
              error={geminiError}
              analysis={geminiAnalysis}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ScorePerSessionChart sessions={data.sessions} />
              <EngagementRetentionChart sessions={data.sessions} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function GeminiInsight({
  loading,
  error,
  analysis,
}: {
  loading: boolean;
  error: string | null;
  analysis: string | null;
}) {
  if (loading && !analysis && !error) {
    return (
      <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-slate-400">
        Menghasilkan analisis AI (Gemini)…
      </Card>
    );
  }

  if (error) {
    const isOverloaded =
      error.includes("503") ||
      error.toLowerCase().includes("overloaded") ||
      error.toLowerCase().includes("unavailable");

    return (
      <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-red-400">
        {isOverloaded ? (
          <>
            Tidak bisa memuat analisis AI saat ini karena server Gemini sedang
            sibuk.
            <br />
            Coba lagi beberapa menit lagi setelah halaman ini di-refresh.
          </>
        ) : (
          <>Gagal memuat analisis Gemini: {error}</>
        )}
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-slate-200 space-y-2">
      <div className="text-sm font-semibold">Ringkasan Algoritma Akun (Gemini)</div>
      <div className="text-xs text-slate-400">
        Analisis otomatis berdasarkan data historis sesi live akun ini.
      </div>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
        {analysis}
      </div>
    </Card>
  );
}

function ScorePerSessionChart({ sessions }: { sessions: SessionSeries[] }) {
  const chartData = sessions.map((s, idx) => ({
    id: s.sessionId,
    index: idx + 1,
    label: `#${idx + 1}`,
    date: new Date(s.startedAt).toLocaleDateString(),
    score: s.lastScore,
  }));

  const chartConfig = {
    score: {
      label: "Score",
      // Emerald 500
      color: "hsl(142 76% 36%)",
    },
  } as const;

  return (
    <Card className="p-4 border-slate-800 bg-slate-900/60">
      <div className="text-sm font-semibold mb-2">Score per Session</div>
      <div className="text-xs text-slate-400 mb-3">
        Membandingkan score akhir tiap sesi live.
      </div>
      <ChartContainer config={chartConfig} className="mt-2">
        <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={32}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date}
              />
            }
          />
          <Bar
            dataKey="score"
            fill="var(--color-score)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

function EngagementRetentionChart({
  sessions,
}: {
  sessions: SessionSeries[];
}) {
  const chartData = sessions.map((s, idx) => {
    const avgEng = s.engagementRates.length
      ? s.engagementRates.reduce((a, b) => a + b, 0) / s.engagementRates.length
      : 0;
    const avgRet = s.retentionRates.length
      ? s.retentionRates.reduce((a, b) => a + b, 0) / s.retentionRates.length
      : 0;

    return {
      id: s.sessionId,
      index: idx + 1,
      label: `#${idx + 1}`,
      avgEng,
      avgRet,
    };
  });

  const chartConfig = {
    avgEng: {
      label: "Engagement",
      // Sky 500
      color: "hsl(204 94% 68%)",
    },
    avgRet: {
      label: "Retention",
      // Amber 400
      color: "hsl(43 96% 56%)",
    },
  } as const;

  return (
    <Card className="p-4 border-slate-800 bg-slate-900/60">
      <div className="text-sm font-semibold mb-2">
        Engagement vs Retention (per Session)
      </div>
      <div className="text-xs text-slate-400 mb-3">
        Garis biru: engagement rate, garis kuning: retention rate.
      </div>
      <ChartContainer config={chartConfig} className="mt-2">
        <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={32}
          />
          <ChartTooltip
            cursor={{ stroke: "hsl(var(--muted))" }}
            content={<ChartTooltipContent />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="avgEng"
            stroke="var(--color-avgEng)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="avgRet"
            stroke="var(--color-avgRet)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
