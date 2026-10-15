import { api, runHud } from "./api";

export default async function Command() {
  await runHud(async () => {
    const p = await api.player();
    if (!p.track) return "Nothing playing";
    const like = p.track.liked !== true;
    await api.like(like, p.track.id);
    return like ? `Liked ${p.track.title}` : `Removed like from ${p.track.title}`;
  });
}
