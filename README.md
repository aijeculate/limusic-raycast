# Limusic for Raycast

Control [Limusic](https://github.com/SimoHypers/limusic) from Raycast on Windows (and macOS).

## Setup

1. In Limusic, open **Settings > Data > Local API** and turn it on.
2. Copy the access token.
3. On the first run of any command, paste the token into the extension preferences. Change the
   port only if you changed it in Limusic (default `26538`).

Needs a Limusic build with the Local API (see `docs/local-api.md` in Limusic).

## Commands

| Command | What it does |
|---|---|
| Play / Pause, Next Track, Previous Track | Transport, with a HUD of the result |
| Like Current Track | Toggle the like on the playing track (needs sign-in) |
| Increase / Decrease Volume | +/- 10 |
| Toggle Shuffle, Cycle Repeat | Modes |
| Now Playing | Artwork, progress (updates every second) and every control |
| Search Music | Songs, albums, artists, playlists: Play Now, Play Next, Add to Queue, Copy URL |
| Show Queue | Current track tagged; Jump to Track, Remove from Queue |
| Library Playlists | Play, shuffle, or open a playlist and play from any track |

## Troubleshooting

- **"Limusic isn't running or its Local API is disabled"**: start Limusic and enable the API.
- **"Wrong access token"**: copy it again; regenerating it in Limusic invalidates the old one.
- **"Sign in to Limusic first"**: liking and your YouTube library need a signed-in account.

## Development

```sh
npm install
npm run dev     # ray develop
npm run lint
npm run build
```

Set `author` in `package.json` to your Raycast username before publishing.
