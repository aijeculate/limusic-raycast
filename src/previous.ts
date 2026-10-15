import { api, runHud, trackLine } from "./api";

export default async function Command() {
  await runHud(async () => {
    await api.previous();
    return `Previous: ${trackLine(await api.player())}`;
  });
}
