// lib/liveService.ts

const BASE_URL =
  process.env.PY_LIVE_SERVICE_BASE_URL ?? "http://34.101.90.254:5000";
const API_KEY =
  process.env.PY_LIVE_SERVICE_API_KEY ?? "CHANGE_ME";

export interface LiveCurrentMetrics {
  viewers: number;
  peak_viewers: number;
  engagement_rate: number;
  algorithm_score: number;
  engagement_velocity: number;
  retention_rate: number;
}

export interface LiveRawMetrics {
  viewer_count: number;
  peak_viewers: number;
  total_likes: number;
  raw_like_events: number;
  total_comments: number;
  total_gifts: number;
  total_gift_value: number;
  total_joins: number;
  total_follows: number;
  unique_commenters: number;
  unique_gifters: number;
  estimated_viewers: number;
}

export interface LiveMetricsResponse {
  username: string;
  session_id: string;
  is_streaming: boolean;
  current_metrics: LiveCurrentMetrics;
  raw_metrics: LiveRawMetrics;
}

export interface StartMonitoringResponse {
  success: boolean;
  message: string;
  session_id: string;
  username: string;
}

export interface StopMonitoringResponse {
  success: boolean;
  message: string;
  username: string;
}

export interface ActiveMonitorItem {
  username: string;
  session_id: string;
  is_streaming: boolean;
  current_viewers: number;
  algorithm_score: number;
}

export interface ActiveMonitorsResponse {
  count: number;
  monitors: ActiveMonitorItem[];
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function startMonitoring(username: string) {
  return apiFetch<StartMonitoringResponse>("/api/start-monitoring", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function stopMonitoring(username: string) {
  return apiFetch<StopMonitoringResponse>("/api/stop-monitoring", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function getLiveMetrics(username: string) {
  return apiFetch<LiveMetricsResponse>(
    `/api/live-metrics/${encodeURIComponent(username)}`
  );
}

export async function getActiveMonitors() {
  return apiFetch<ActiveMonitorsResponse>("/api/active-monitors");
}

