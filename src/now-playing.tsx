import { Action, ActionPanel, Keyboard, Detail, Icon } from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { shortcut } from "./shortcuts";
import { api, formatMs, LimusicError, musicUrl, NOT_RUNNING_MESSAGE, showError } from "./api";
import type { Player } from "./types";

const BAR_WIDTH = 30;

function progressBar(position: number, duration: number | null): string {
  if (!duration || duration <= 0) return "";
  const filled = Math.round(Math.min(1, position / duration) * BAR_WIDTH);
  return "`" + "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled) + "`";
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
    const art = track.thumbnailUrl ? `![](${track.thumbnailUrl}?raycast-height=140)\n\n` : "";
    markdown =
      `${art}## ${track.title}\n\n${track.artists}${track.album ? ` · ${track.album}` : ""}\n\n` +
      `${progressBar(player.positionMs, track.durationMs)}\n\n` +
      `${formatMs(player.positionMs)} / ${formatMs(track.durationMs)}`;
  }

  return (
    <Detail
      isLoading={loading}
      markdown={markdown}
      metadata={
        player && track ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="State" text={player.isPlaying ? "Playing" : "Paused"} />
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
