import { Action, ActionPanel, Keyboard, Icon, List, showHUD } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { shortcut } from "./shortcuts";
import { api, formatMs, musicUrl, showError } from "./api";
import type { Card } from "./types";

async function play(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    await showHUD(label);
  } catch (e) {
    await showError(e);
  }
}

function PlaylistTracks({ playlist }: { playlist: Card }) {
  const { data, isLoading } = usePromise(api.playlist, [playlist.id], { onError: showError });
  return (
    <List isLoading={isLoading} navigationTitle={playlist.title} searchBarPlaceholder="Filter tracks">
      {(data?.tracks ?? []).map((t, i) => (
        <List.Item
          key={`${i}:${t.id}`}
          title={t.title}
          subtitle={t.artists}
          icon={t.thumbnailUrl ? { source: t.thumbnailUrl } : Icon.Music}
          accessories={[{ text: formatMs(t.durationMs) }]}
          actions={
            <ActionPanel>
              <Action
                title="Play from Here"
                icon={Icon.Play}
                onAction={() =>
                  play(`Playing ${playlist.title}`, () => api.playItem("playlist", playlist.id, { startIndex: i }))
                }
              />
              <Action
                title="Shuffle Playlist"
                icon={Icon.Shuffle}
                shortcut={shortcut("s")}
                onAction={() =>
                  play(`Shuffling ${playlist.title}`, () => api.playItem("playlist", playlist.id, { shuffle: true }))
                }
              />
              <Action
                title="Add to Queue"
                icon={Icon.Plus}
                shortcut={Keyboard.Shortcut.Common.Edit}
                onAction={() => play(`Queued ${t.title}`, () => api.enqueue(t.id, "end"))}
              />
              <Action.CopyToClipboard title="Copy YouTube Music URL" content={musicUrl(t.id)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export default function Command() {
  const { data, isLoading } = usePromise(api.playlists, [], { onError: showError });
  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter playlists">
      <List.EmptyView icon={Icon.List} title="No playlists" description="Sign in to Limusic to see your library." />
      {(data ?? []).map((p) => (
        <List.Item
          key={p.id}
          title={p.title}
          subtitle={p.subtitle ?? undefined}
          icon={p.thumbnailUrl ? { source: p.thumbnailUrl } : Icon.List}
          actions={
            <ActionPanel>
              <Action.Push title="Show Tracks" icon={Icon.List} target={<PlaylistTracks playlist={p} />} />
              <Action
                title="Play Playlist"
                icon={Icon.Play}
                shortcut={shortcut("p")}
                onAction={() => play(`Playing ${p.title}`, () => api.playItem("playlist", p.id))}
              />
              <Action
                title="Shuffle Playlist"
                icon={Icon.Shuffle}
                shortcut={shortcut("s")}
                onAction={() => play(`Shuffling ${p.title}`, () => api.playItem("playlist", p.id, { shuffle: true }))}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
