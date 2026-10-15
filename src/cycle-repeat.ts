import { api, runHud } from "./api";

const LABEL = { off: "Repeat off", all: "Repeat all", one: "Repeat one" } as const;

export default async function Command() {
  await runHud(async () => {
    await api.setRepeat();
    return LABEL[(await api.player()).repeat];
  });
}
