import { Action, ActionPanel, Color, Keyboard, Detail, Icon } from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { shortcut } from "./shortcuts";
import { api, formatMs, LimusicError, musicUrl, NOT_RUNNING_MESSAGE, showError } from "./api";
import type { Player } from "./types";

const BAR_WIDTH = 16;
/** Artwork edge in pixels. Raise or lower this to resize the cover. */
const ART_SIZE = 180;

function progressBar(position: number, duration: number | null): string {
  if (!duration || duration <= 0) return "";
  const filled = Math.round(Math.min(1, position / duration) * BAR_WIDTH);
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

/**
 * Ask YouTube's image servers for a small cover instead of the full-quality one.
 * Raycast's `raycast-width`/`raycast-height` hints aren't honoured everywhere,
 * so the image itself has to be small for it to display small.
 */
function smallArtwork(url: string, size = ART_SIZE): string {
  let out = url;
  try {
    const u = new URL(url);
    if (/(googleusercontent|ggpht)\.com$/.test(u.hostname)) {
      // e.g. .../abc=w544-h544-l90-rj  or  .../abc=s1200  or  .../abc (no size)
      const sized = `=w${size}-h${size}-l90-rj`;
      u.pathname = /=[^/]*$/.test(u.pathname) ? u.pathname.replace(/=[^/]*$/, sized) : u.pathname + sized;
      out = u.toString();
    } else if (/(^|\.)ytimg\.com$/.test(u.hostname)) {
      // Video thumbnails are 16:9. /vi/ID/maxresdefault.jpg -> /vi/ID/mqdefault.jpg (320x180)
      u.pathname = u.pathname.replace(/\/[^/]+\.(jpg|webp)$/, "/mqdefault.jpg");
      u.search = "";
      u.searchParams.set("raycast-height", String(size));
      return u.toString();
    }
    const sizedUrl = new URL(out);
    sizedUrl.searchParams.set("raycast-width", String(size));
    sizedUrl.searchParams.set("raycast-height", String(size));
    return sizedUrl.toString();
  } catch {
    return out;
  }
}

export default function Command() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Only toast a failure once; polling would otherwise repeat it every second.
  const reported = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setPlayer(await api.player());
      setError(null);
      reported.current = false;
    } catch (e) {
      setError(e instanceof LimusicError ? e.message : NOT_RUNNING_MESSAGE);
      if (!reported.current) {
        reported.current = true;
        await showError(e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const act = (fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      await showError(e);
    }
  };

  const track = player?.track;
  let markdown: string;
  if (error) {
    markdown = `## ${error}\n\nStart Limusic and turn on **Settings > Data > Local API**.`;
  } else if (!track) {
    markdown = loading ? "" : "## Nothing playing";
  } else {
    const art = track.thumbnailUrl ? `![${track.title}](${smallArtwork(track.thumbnailUrl)})\n\n` : "";
    const sub = `${track.artists}${track.album ? ` · *${track.album}*` : ""}`;
    markdown = `${art}# ${track.title}\n\n${sub}`;
  }

  return (
    <Detail
      isLoading={loading}
      markdown={markdown}
      metadata={
        player && track ? (
          <Detail.Metadata>
            <Detail.Metadata.Label
              title={`${formatMs(player.positionMs)} / ${formatMs(track.durationMs)}`}
              text={progressBar(player.positionMs, track.durationMs)}
            />
            <Detail.Metadata.Separator />
            <Detail.Metadata.TagList title="State">
              <Detail.Metadata.TagList.Item
                text={player.isPlaying ? "Playing" : "Paused"}
                color={player.isPlaying ? Color.Green : Color.Orange}
              />
            </Detail.Metadata.TagList>
            <Detail.Metadata.Label title="Volume" text={`${player.volume}%`} />
            <Detail.Metadata.Label title="Shuffle" text={player.shuffle ? "On" : "Off"} />
            <Detail.Metadata.Label title="Repeat" text={player.repeat} />
            {track.liked != null && <Detail.Metadata.Label title="Liked" text={track.liked ? "Yes" : "No"} />}
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action
            title={player?.isPlaying ? "Pause" : "Play"}
            icon={player?.isPlaying ? Icon.Pause : Icon.Play}
            onAction={act(api.toggle)}
          />
          <Action title="Next Track" icon={Icon.Forward} shortcut={shortcut("arrowRight")} onAction={act(api.next)} />
          <Action
            title="Previous Track"
            icon={Icon.Rewind}
            shortcut={shortcut("arrowLeft")}
            onAction={act(api.previous)}
          />
          {track && (
            <Action
              title={track.liked ? "Remove Like" : "Like"}
              icon={Icon.Heart}
              shortcut={shortcut("l")}
              onAction={act(() => api.like(!track.liked, track.id))}
            />
          )}
          {player && (
            <>
              <Action
                title="Seek Forward 10 Seconds"
                icon={Icon.ArrowRight}
                shortcut={shortcut("arrowRight", ["shift"])}
                onAction={act(() => api.seek(player.positionMs + 10000))}
              />
              <Action
                title="Seek Back 10 Seconds"
                icon={Icon.ArrowLeft}
                shortcut={shortcut("arrowLeft", ["shift"])}
                onAction={act(() => api.seek(player.positionMs - 10000))}
              />
              <Action
                title="Increase Volume"
                icon={Icon.SpeakerUp}
                shortcut={shortcut("arrowUp")}
                onAction={act(() => api.setVolume(player.volume + 10))}
              />
              <Action
                title="Decrease Volume"
                icon={Icon.SpeakerDown}
                shortcut={shortcut("arrowDown")}
                onAction={act(() => api.setVolume(player.volume - 10))}
              />
              <Action
                title="Toggle Shuffle"
                icon={Icon.Shuffle}
                shortcut={shortcut("s")}
                onAction={act(() => api.setShuffle())}
              />
              <Action
                title="Cycle Repeat"
                icon={Icon.Repeat}
                shortcut={Keyboard.Shortcut.Common.Refresh}
                onAction={act(() => api.setRepeat())}
              />
            </>
          )}
          {track && <Action.CopyToClipboard title="Copy YouTube Music URL" content={musicUrl(track.id)} />}
        </ActionPanel>
      }
    />
  );
}
