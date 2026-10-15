import { api, runHud } from "./api";

export default async function Command() {
  await runHud(async () => {
    await api.setShuffle();
    return (await api.player()).shuffle ? "Shuffle on" : "Shuffle off";
  });
}
