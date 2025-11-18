// app/dashboard/page.tsx
import Link from "next/link";
import { AlgorithmDashboard } from "@/components/AlgorithmDashboard";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            TikTok Live Algorithm Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Insight performa dan algoritma dari semua live yang pernah dimonitor.
          </p>
        </div>
        <div className="flex justify-end">
          <Link href="/">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-200 text-sm"
            >
              Kembali ke Halaman Utama
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <AlgorithmDashboard />
      </main>
    </div>
  );
}
