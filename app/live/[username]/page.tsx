// app/live/[username]/page.tsx
import { LivePanel } from "@/components/LivePanel";

interface LivePageProps {
  params: Promise<{ username: string }>;
}

export default async function LivePage({ params }: LivePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Live Analytics: @{decodedUsername}
          </h1>
          <p className="text-sm text-slate-400">
            Real-time TikTok Live monitoring powered by Python service.
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">
        <LivePanel username={decodedUsername} />
      </main>
    </div>
  );
}
