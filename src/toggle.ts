import { api, runHud, trackLine } from "./api";

export default async function Command() {
  await runHud(async () => {
    await api.toggle();
    const p = await api.player();
    return p.isPlaying ? `Playing: ${trackLine(p)}` : "Paused";
  });
}
