// components/AlgorithmDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AccountAlgorithmInsight {
  username: string;
  displayName?: string | null;
  sessionsCount: number;
  avgScore: number;
  bestScore: number;
  worstScore: number;
  avgEngagementRate: number;
  avgRetentionRate: number;
  avgEngagementVelocity: number;
  strengthFactors: string[];
  weaknessFactors: string[];
  bestSessionId: string;
  bestSessionStartedAt: string;
  bestSessionPeakViewers: number;
  bestSessionScore: number;
  lastSessionScore: number;
  lastSessionStartedAt: string;
}

interface GlobalAlgorithmSummary {
  totalAccounts: number;
  totalSessions: number;
  avgScoreAll: number;
  bestScoreOverall: number;
  medianScore: number;
  engagementFactor: number;
  retentionFactor: number;
  qualityFactor: number;
  monetizationFactor: number;
  followFactor: number;
}

interface AlgorithmSummaryResponse {
  global: GlobalAlgorithmSummary;
  accounts: AccountAlgorithmInsight[];
}

export function AlgorithmDashboard() {
  const [data, setData] = useState<AlgorithmSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/analytics/summary");
        const json = (await res.json()) as AlgorithmSummaryResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[AlgorithmDashboard] Error:", err);
          setError(err.message ?? "Failed to load algorithm summary");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-slate-400">
        Memuat analisis algoritma…
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-red-400">
        Gagal memuat analisis algoritma: {error ?? "unknown error"}
      </Card>
    );
  }

  const { global, accounts } = data;

  if (!accounts.length) {
    return (
      <Card className="p-4 border-slate-800 bg-slate-900/60 text-sm text-slate-400">
        Belum ada data historis. Jalankan monitoring minimal satu sesi live, simpan metrics ke database,
        lalu kembali ke halaman ini.
      </Card>
    );
  }

  // Cari akun dengan score terbaik
  const topAccount = [...accounts].sort(
    (a, b) => b.bestScore - a.bestScore
  )[0];

  return (
    <div className="space-y-6">
      {/* Global summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          label="Total Accounts"
          value={global.totalAccounts}
          sub="Pernah dimonitor"
        />
        <MetricCard
          label="Total Sessions"
          value={global.totalSessions}
          sub="Semua akun"
        />
        <MetricCard
          label="Avg Score (All)"
          value={global.avgScoreAll.toFixed(1)}
          sub="Rata-rata seluruh sesi"
        />
        <MetricCard
          label="Best Score Overall"
          value={global.bestScoreOverall.toFixed(1)}
          sub="Live terbaik"
        />
        <MetricCard
          label="Median Score"
          value={global.medianScore.toFixed(1)}
          sub="Stabilitas performa"
        />
      </div>

      {/* Algorithm factor summary */}
      <Card className="p-4 border-slate-800 bg-slate-900/60">
        <div className="text-sm font-semibold mb-3">
          Faktor Algoritma (Global)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs text-slate-200">
          <FactorBar label="Engagement" value={global.engagementFactor} hint="Likes + Komentar per menit" />
          <FactorBar label="Retention" value={global.retentionFactor} hint="Penonton yang bertahan" />
          <FactorBar label="Quality" value={global.qualityFactor} hint="Unique commenters/gifters" />
          <FactorBar label="Monetization" value={global.monetizationFactor} hint="Gifts per menit" />
          <FactorBar label="Follow" value={global.followFactor} hint="Konversi follow" />
        </div>
      </Card>

      {/* Highlight top account */}
      <Card className="p-4 border-slate-800 bg-slate-900/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-emerald-400">
              Top Performer
            </div>
            <div className="text-lg font-semibold text-slate-50">
              @{topAccount.username}
            </div>
            <div className="text-xs text-slate-400">
              Best Score: {topAccount.bestScore.toFixed(1)} · Sessions: {topAccount.sessionsCount}
            </div>
            <div className="mt-2 text-xs text-slate-300">
              {renderAccountInsightSummary(topAccount)}
            </div>
          </div>
          <div className="flex gap-2 md:items-center md:justify-end">
            <Link href={`/live/${topAccount.username}`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                Lihat Live Detail
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Accounts table */}
      <Card className="p-4 border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">
            Analisis per Akun
          </h2>
        </div>

        <div className="hidden md:grid md:grid-cols-12 text-xs font-medium text-slate-400 border-b border-slate-800 pb-2">
          <div className="col-span-3">Account</div>
          <div className="col-span-2 text-right">Sessions</div>
          <div className="col-span-2 text-right">Avg Score</div>
          <div className="col-span-2 text-right">Best Score</div>
          <div className="col-span-2 text-right">Eng Rate / Retention</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-slate-800">
          {accounts.map((acc) => (
            <AccountRow key={acc.username} account={acc} />
          ))}
        </div>
      </Card>
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

interface FactorBarProps {
  label: string;
  value: number; // 0-100
  hint?: string;
}

function FactorBar({ label, value, hint }: FactorBarProps) {
  const width = Math.max(5, Math.min(100, value));
  const color =
    value >= 75
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-sky-500"
      : value >= 30
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-300">{label}</span>
        <span className="text-[11px] text-slate-400">{value.toFixed(0)}/100</span>
      </div>
      <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-slate-500">
          {hint}
        </div>
      )}
    </div>
  );
}

function AccountRow({ account }: { account: AccountAlgorithmInsight }) {
  const scoreColor =
    account.avgScore >= 70
      ? "text-emerald-400"
      : account.avgScore >= 50
      ? "text-sky-400"
      : account.avgScore >= 30
      ? "text-yellow-400"
      : "text-red-400";

  const engText = `${account.avgEngagementRate.toFixed(2)} · ${(account.avgRetentionRate * 100).toFixed(0)}%`;

  return (
    <div className="py-2 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 text-xs md:text-sm items-center">
      <div className="col-span-3 flex flex-col">
        <span className="font-medium text-slate-100">
          @{account.username}
        </span>
        {account.displayName && (
          <span className="text-[11px] text-slate-500">
            {account.displayName}
          </span>
        )}
        <span className="text-[11px] text-slate-500 mt-0.5">
          {renderAccountInsightSummary(account)}
        </span>
      </div>

      <div className="col-span-2 md:text-right text-slate-200">
        {account.sessionsCount}
      </div>

      <div className={`col-span-2 md:text-right ${scoreColor}`}>
        {account.avgScore.toFixed(1)}
      </div>

      <div className="col-span-2 md:text-right text-slate-200">
        {account.bestScore.toFixed(1)}
      </div>

      <div className="col-span-2 md:text-right text-slate-200">
        {engText}
      </div>

      <div className="col-span-1 flex md:justify-end">
        <Link href={`/dashboard/account/${account.username}`}>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            Detail
          </Button>
        </Link>
      </div>
    </div>
  );
}

function renderAccountInsightSummary(account: AccountAlgorithmInsight): string {
  const strengths = account.strengthFactors.slice(0, 2);
  const weaknesses = account.weaknessFactors.slice(0, 1);

  const strengthText = strengths.length
    ? `Kuat di ${strengths.map(mapFactorLabel).join(" & ")}`
    : "";

  const weaknessText = weaknesses.length
    ? `perlu perbaiki ${weaknesses.map(mapFactorLabel).join(" & ")}`
    : "";

  const parts = [];
  if (strengthText) parts.push(strengthText);
  if (weaknessText) parts.push(weaknessText);

  return parts.join(", ");
}

function mapFactorLabel(key: string): string {
  switch (key) {
    case "engagement_velocity":
      return "kecepatan interaksi";
    case "retention":
      return "retensi penonton";
    case "quality":
      return "kualitas interaksi";
    case "monetization":
      return "monetisasi";
    case "follow":
      return "konversi follow";
    default:
      return key;
  }
}
