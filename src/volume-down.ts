import { api, runHud } from "./api";

export default async function Command() {
  await runHud(async () => {
    const { volume } = await api.player();
    const next = Math.min(100, Math.max(0, volume - 10));
    await api.setVolume(next);
    return `Volume ${next}%`;
  });
}
