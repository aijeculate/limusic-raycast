import { Action, ActionPanel, Keyboard, Icon, Image, List, showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useState } from "react";
import { shortcut } from "./shortcuts";
import { api, formatMs, musicUrl, showError } from "./api";
import type { SearchResult, SearchType } from "./types";

const TYPES: { value: SearchType; title: string }[] = [
  { value: "songs", title: "Songs" },
  { value: "albums", title: "Albums" },
  { value: "artists", title: "Artists" },
  { value: "playlists", title: "Playlists" },
];

async function run(title: string, fn: () => Promise<unknown>) {
  const toast = await showToast({ style: Toast.Style.Animated, title: `${title}...` });
  try {
    await fn();
    toast.style = Toast.Style.Success;
    toast.title = title;
  } catch (e) {
    toast.hide();
    await showError(e);
  }
}

function webUrl(r: SearchResult): string {
  if (r.type === "song") return musicUrl(r.id);
  if (r.type === "artist") return `https://music.youtube.com/channel/${r.id}`;
  if (r.type === "playlist") return `https://music.youtube.com/playlist?list=${r.id.replace(/^VL/, "")}`;
  return `https://music.youtube.com/browse/${r.id}`;
}

export default function Command() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("songs");
  const { data, isLoading } = usePromise(
    async (q: string, t: SearchType) => (q.trim() ? api.search(q.trim(), t) : []),
    [query, type],
    { onError: showError },
  );

  return (
    <List
      isLoading={isLoading}
      throttle
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search YouTube Music via Limusic"
      searchBarAccessory={
        <List.Dropdown tooltip="Type" storeValue onChange={(v) => setType(v as SearchType)}>
          {TYPES.map((t) => (
            <List.Dropdown.Item key={t.value} value={t.value} title={t.title} />
          ))}
        </List.Dropdown>
      }
    >
      {!query.trim() ? (
        <List.EmptyView icon={Icon.MagnifyingGlass} title="Type to search" />
      ) : (
        (data ?? []).map((r) => {
          const isSong = r.type === "song";
          const subtitle = "artists" in r ? r.artists : (r.subtitle ?? undefined);
          return (
            <List.Item
              key={`${r.type}:${r.id}`}
              title={r.title}
              subtitle={subtitle}
              icon={
                r.thumbnailUrl
                  ? {
                      source: r.thumbnailUrl,
                      mask: r.type === "artist" ? Image.Mask.Circle : Image.Mask.RoundedRectangle,
                    }
                  : Icon.Music
              }
              accessories={"durationMs" in r && r.durationMs ? [{ text: formatMs(r.durationMs) }] : []}
              actions={
                <ActionPanel>
                  <Action
                    title="Play Now"
                    icon={Icon.Play}
                    onAction={() => run("Playing", () => api.playItem(r.type, r.id))}
                  />
                  {isSong && (
                    <>
                      <Action
                        title="Play Next"
                        icon={Icon.Forward}
                        shortcut={Keyboard.Shortcut.Common.New}
                        onAction={() => run("Playing next", () => api.enqueue(r.id, "next"))}
                      />
                      <Action
                        title="Add to Queue"
                        icon={Icon.Plus}
                        shortcut={Keyboard.Shortcut.Common.Edit}
                        onAction={() => run("Added to queue", () => api.enqueue(r.id, "end"))}
                      />
                    </>
                  )}
                  {(r.type === "album" || r.type === "playlist") && (
                    <Action
                      title="Shuffle Play"
                      icon={Icon.Shuffle}
                      shortcut={shortcut("s")}
                      onAction={() => run("Shuffling", () => api.playItem(r.type, r.id, { shuffle: true }))}
                    />
                  )}
                  <Action.CopyToClipboard
                    title="Copy YouTube Music URL"
                    content={webUrl(r)}
                    shortcut={Keyboard.Shortcut.Common.Copy}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
