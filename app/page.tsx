// app/page.tsx
import Link from "next/link";
import { AlgorithmDashboard } from "@/components/AlgorithmDashboard";
import { QuickStartMonitor } from "@/components/QuickStartMonitor";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">
            TikTok Live Analyzer
          </h1>
          <p className="text-sm text-slate-400">
            Dashboard algoritma dan monitoring untuk akun TikTok Live yang kamu analisa.
          </p>
        </div>
        <div className="flex md:justify-end">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-200 text-sm"
            >
              Buka Dashboard Historis
            </Button>
          </Link>
        </div>
      </header>

      <section className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel kiri: quick start monitoring */}
        <div className="lg:col-span-1">
          <QuickStartMonitor />
        </div>

        {/* Panel kanan: algorithm analytics summary */}
        <div className="lg:col-span-2">
          <AlgorithmDashboard />
        </div>
      </section>
    </main>
  );
}
