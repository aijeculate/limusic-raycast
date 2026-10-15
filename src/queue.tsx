import { Action, ActionPanel, Keyboard, Color, Icon, List } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { api, formatMs, musicUrl, showError } from "./api";

export default function Command() {
  const { data, isLoading, revalidate } = usePromise(api.queue, [], { onError: showError });

  const act = (fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
    } catch (e) {
      await showError(e);
    }
    revalidate();
  };

  const current = data?.currentIndex ?? -1;

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter queue">
      <List.EmptyView icon={Icon.List} title="The queue is empty" />
      {(data?.tracks ?? []).map((t, i) => {
        const isCurrent = i === current;
        return (
          <List.Item
            key={`${i}:${t.id}`}
            title={t.title}
            subtitle={t.artists}
            icon={t.thumbnailUrl ? { source: t.thumbnailUrl } : Icon.Music}
            accessories={[
              ...(isCurrent ? [{ tag: { value: "Now Playing", color: Color.Green } }] : []),
              ...(i < current ? [{ text: { value: "Played", color: Color.SecondaryText } }] : []),
              { text: formatMs(t.durationMs) },
            ]}
            actions={
              <ActionPanel>
                {!isCurrent && <Action title="Jump to Track" icon={Icon.Play} onAction={act(() => api.jump(i))} />}
                {i > current && (
                  <Action
                    title="Remove from Queue"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={Keyboard.Shortcut.Common.Remove}
                    onAction={act(() => api.removeFromQueue(i))}
                  />
                )}
                <Action.CopyToClipboard title="Copy YouTube Music URL" content={musicUrl(t.id)} />
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  shortcut={Keyboard.Shortcut.Common.Refresh}
                  onAction={revalidate}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
