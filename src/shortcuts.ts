import { Keyboard } from "@raycast/api";

/** Cmd on macOS, Ctrl on Windows, plus any extra modifiers. */
export function shortcut(key: Keyboard.KeyEquivalent, extra: Keyboard.KeyModifier[] = []): Keyboard.Shortcut {
  return {
    macOS: { modifiers: ["cmd", ...extra], key },
    Windows: { modifiers: ["ctrl", ...extra], key },
  };
}
