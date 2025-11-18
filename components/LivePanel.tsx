// components/LivePanel.tsx
"use client";

import { useEffect, useState } from "react";
import type { LiveMetricsResponse } from "@/lib/liveService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LivePanelProps {
  username: string;
}

export function LivePanel({ username }: LivePanelProps) {
  const [data, setData] = useState<LiveMetricsResponse | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollInterval =
    Number(process.env.NEXT_PUBLIC_LIVE_POLL_INTERVAL ?? 5000);

  useEffect(() => {
    if (!isMonitoring) return;
    if (!username) return;

    let cancelled = false;

    const fetchMetrics = async () => {
      try {
        const res = await fetch(
          `/api/live/metrics?username=${encodeURIComponent(username)}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as LiveMetricsResponse;

        if (!cancelled) {
          setData(json);
          setError(null);
        }

        // Kirim snapshot ke backend Next.js untuk disimpan ke DB (Prisma)
        try {
          await fetch("/api/live/save-metrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(json),
          });
        } catch (err) {
          // Gagal simpan ke DB tidak blok UI live; hanya log di console
          console.error("[LivePanel] save-metrics error:", err);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[LivePanel] fetchMetrics error:", err);
          setError(err.message ?? "Failed to fetch metrics");
        }
      }
    };

    fetchMetrics();
    const id = setInterval(fetchMetrics, pollInterval);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isMonitoring, username, pollInterval]);

  const handleStart = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/live/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setIsMonitoring(true);
    } catch (err: any) {
      console.error("[LivePanel] start error:", err);
      setError(err.message ?? "Failed to start monitoring");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/live/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected response: ${text.slice(0, 100)}`);
      }

      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setIsMonitoring(false);
    } catch (err: any) {
      console.error("[LivePanel] stop error:", err);
      setError(err.message ?? "Failed to stop monitoring");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (() => {
    if (!isMonitoring) return "Not monitoring";
    if (!data) return "Monitoring… awaiting events";
    if (data.is_streaming) return "Monitoring (stream live)";
    return "Monitoring (stream offline)";
  })();

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <Card className="p-4 flex items-center justify-between border-slate-800 bg-slate-900/60">
        <div>
          <div className="text-sm text-slate-400">Status</div>
          <div className="text-base font-medium">{statusLabel}</div>
          {error && (
            <div className="mt-1 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {!isMonitoring ? (
            <Button
              onClick={handleStart}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Starting…" : "Start Monitoring"}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={loading}
              variant="destructive"
            >
              {loading ? "Stopping…" : "Stop Monitoring"}
            </Button>
          )}
        </div>
      </Card>

      {/* Metrics cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Viewers"
            value={data.current_metrics.viewers}
            sub={`Peak: ${data.current_metrics.peak_viewers}`}
          />
          <MetricCard
            label="Engagement Rate"
            value={data.current_metrics.engagement_rate.toFixed(2)}
            sub="interactions per viewer"
          />
          <MetricCard
            label="Algorithm Score"
            value={data.current_metrics.algorithm_score.toFixed(1)}
            sub="0 - 100"
          />
          <MetricCard
            label="Likes (est / raw)"
            value={data.raw_metrics.total_likes}
            sub={`raw events: ${data.raw_metrics.raw_like_events}`}
          />
        </div>
      )}

      {/* Raw metrics detail */}
      {data && (
        <Card className="p-4 border-slate-800 bg-slate-900/60">
          <div className="text-sm font-semibold mb-2">Raw Metrics</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300">
            <MetricRow label="Total Comments" value={data.raw_metrics.total_comments} />
            <MetricRow label="Total Gifts" value={data.raw_metrics.total_gifts} />
            <MetricRow label="Gift Value" value={data.raw_metrics.total_gift_value} />
            <MetricRow label="Total Joins" value={data.raw_metrics.total_joins} />
            <MetricRow label="Total Follows" value={data.raw_metrics.total_follows} />
            <MetricRow label="Unique Commenters" value={data.raw_metrics.unique_commenters} />
            <MetricRow label="Unique Gifters" value={data.raw_metrics.unique_gifters} />
            <MetricRow label="Estimated Viewers" value={data.raw_metrics.estimated_viewers} />
          </div>
        </Card>
      )}

      {/* Hint saat belum ada data */}
      {!data && isMonitoring && !error && (
        <Card className="p-4 border-slate-800 bg-slate-900/40 text-sm text-slate-400">
          Menunggu event pertama dari TikTok Live… coba join, like, atau komen dari akun lain.
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <Card className="p-4 border-slate-800 bg-slate-900/60">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-slate-50">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-slate-500">
          {sub}
        </div>
      )}
    </Card>
  );
}

interface MetricRowProps {
  label: string;
  value: number | string;
}

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-100">{value}</span>
    </div>
  );
}
