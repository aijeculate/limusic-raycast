import { api, runHud, trackLine } from "./api";

export default async function Command() {
  await runHud(async () => {
    await api.next();
    return `Next: ${trackLine(await api.player())}`;
  });
}
