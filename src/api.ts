import { getPreferenceValues, openExtensionPreferences, showHUD, showToast, Toast } from "@raycast/api";
import type {
  ApiErrorBody,
  Card,
  Player,
  PlaylistPage,
  Queue,
  RepeatMode,
  SearchResult,
  SearchType,
  Status,
} from "./types";

interface Preferences {
  token: string;
  port?: string;
}

/** Transport and quick reads. Search and playlist loads go to YouTube, so they get longer. */
const FAST_TIMEOUT_MS = 3000;
const SLOW_TIMEOUT_MS = 15000;

export const NOT_RUNNING = "NOT_RUNNING";
export const NOT_RUNNING_MESSAGE = "Limusic isn't running or its Local API is disabled";

export class LimusicError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LimusicError";
  }
}

function baseUrl(): { url: string; token: string } {
  const { token, port } = getPreferenceValues<Preferences>();
  const p = Number(port?.trim() || "26538");
  return { url: `http://127.0.0.1:${Number.isInteger(p) ? p : 26538}/api/v1`, token: token.trim() };
}

async function request<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
  timeoutMs = FAST_TIMEOUT_MS,
): Promise<T> {
  const { url, token } = baseUrl();
  let res: Response;
  try {
    res = await fetch(url + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new LimusicError("TIMEOUT", "Limusic didn't answer in time");
    }
    throw new LimusicError(NOT_RUNNING, NOT_RUNNING_MESSAGE);
  }
  const data = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new LimusicError(err?.code ?? `HTTP_${res.status}`, err?.message ?? res.statusText, res.status);
  }
  return data as T;
}

const post = (path: string, body?: unknown, timeoutMs?: number) => request<{ ok: true }>("POST", path, body, timeoutMs);

export const api = {
  status: () => request<Status>("GET", "/status"),
  player: () => request<Player>("GET", "/player"),
  play: () => post("/player/play"),
  pause: () => post("/player/pause"),
  toggle: () => post("/player/toggle"),
  next: () => post("/player/next"),
  previous: () => post("/player/previous"),
  seek: (positionMs: number) => post("/player/seek", { positionMs: Math.max(0, Math.round(positionMs)) }),
  setVolume: (volume: number) => post("/player/volume", { volume: Math.min(100, Math.max(0, Math.round(volume))) }),
  setShuffle: (enabled?: boolean) => post("/player/shuffle", enabled === undefined ? undefined : { enabled }),
  setRepeat: (mode?: RepeatMode) => post("/player/repeat", mode === undefined ? undefined : { mode }),
  search: (q: string, type: SearchType) =>
    request<{ type: SearchType; results: SearchResult[] }>(
      "GET",
      `/search?q=${encodeURIComponent(q)}&type=${type}`,
      undefined,
      SLOW_TIMEOUT_MS,
    ).then((r) => r.results),
  playItem: (type: Card["type"], id: string, opts: { shuffle?: boolean; startIndex?: number } = {}) =>
    post("/play", { type, id, ...opts }, SLOW_TIMEOUT_MS),
  queue: () => request<Queue>("GET", "/queue"),
  enqueue: (videoId: string, position: "next" | "end") => post("/queue", { videoId, position }, SLOW_TIMEOUT_MS),
  jump: (index: number) => post("/queue/jump", { index }),
  removeFromQueue: (index: number) => request<{ ok: true }>("DELETE", `/queue/${index}`),
  playlists: () =>
    request<{ playlists: Card[] }>("GET", "/library/playlists", undefined, SLOW_TIMEOUT_MS).then((r) => r.playlists),
  playlist: (id: string) =>
    request<PlaylistPage>("GET", `/library/playlists/${encodeURIComponent(id)}`, undefined, SLOW_TIMEOUT_MS),
  like: (liked: boolean, videoId?: string) => post("/track/like", { liked, videoId }),
};

function describe(e: unknown): { title: string; message?: string; code?: string } {
  if (e instanceof LimusicError) {
    switch (e.code) {
      case NOT_RUNNING:
        return {
          title: NOT_RUNNING_MESSAGE,
          code: e.code,
          message: "Start Limusic and enable Settings > Data > Local API.",
        };
      case "UNAUTHORIZED":
        return {
          title: "Wrong access token",
          code: e.code,
          message: "Copy it again from Limusic's Local API settings.",
        };
      case "NOT_LOGGED_IN":
        return { title: "Sign in to Limusic first", code: e.code };
      default:
        return { title: e.message, code: e.code };
    }
  }
  return { title: e instanceof Error ? e.message : String(e) };
}

/** Toast for view commands; offers the preferences when the token or setup is the problem. */
export async function showError(e: unknown): Promise<void> {
  const d = describe(e);
  await showToast({
    style: Toast.Style.Failure,
    title: d.title,
    message: d.message,
    primaryAction:
      d.code === "UNAUTHORIZED" || d.code === NOT_RUNNING
        ? { title: "Open Extension Preferences", onAction: () => openExtensionPreferences() }
        : undefined,
  });
}

/** No-view commands: run, then say what happened in a HUD (the window is already gone). */
export async function runHud(action: () => Promise<string>): Promise<void> {
  try {
    await showHUD(await action());
  } catch (e) {
    await showHUD(describe(e).title);
  }
}

export function trackLine(p: Player): string {
  return p.track ? `${p.track.title} - ${p.track.artists}` : "Nothing playing";
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "--:--";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

export const musicUrl = (videoId: string) => `https://music.youtube.com/watch?v=${videoId}`;
