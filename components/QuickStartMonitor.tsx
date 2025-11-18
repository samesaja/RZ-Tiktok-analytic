"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function QuickStartMonitor() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const normalizedUsername = username.trim().replace(/^@/, "");

  const handleStart = async () => {
    if (!normalizedUsername) {
      setError("Masukkan username TikTok terlebih dahulu.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Hanya redirect ke halaman live untuk username tersebut
      router.push(`/live/${normalizedUsername}`);
      setMessage(`Mengarahkan ke /live/${normalizedUsername}...`);
    } catch (err: any) {
      setError(err.message ?? "Gagal melakukan redirect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 border-slate-800 bg-slate-900/60 space-y-3">
      <div>
        <div className="text-sm font-semibold text-slate-200">
          Mulai Monitoring Live
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Masukkan username TikTok yang sedang atau akan live, lalu klik Start.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="contoh: corord6 atau @corord6"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-slate-900 border-slate-700 text-sm"
        />
        <Button
          onClick={handleStart}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-sm whitespace-nowrap"
        >
          {loading ? "Starting…" : "Start Monitoring"}
        </Button>
      </div>

      {normalizedUsername && (
        <div className="text-xs text-slate-400">
          Setelah start, buka{" "}
          <Link
            href={`/live/${normalizedUsername}`}
            className="text-emerald-400 underline underline-offset-4"
          >
            /live/{normalizedUsername}
          </Link>{" "}
          untuk melihat dashboard live secara real-time.
        </div>
      )}

      {message && (
        <div className="text-xs text-emerald-400">
          {message}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400">
          {error}
        </div>
      )}
    </Card>
  );
}
