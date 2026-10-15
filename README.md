![Requires the Limusic Local API fork](https://img.shields.io/badge/REQUIRES%20THE%20LIMUSIC%20LOCAL%20API%20FORK-red?style=for-the-badge)

> [!CAUTION]
> ## 🚨 THIS EXTENSION DOES NOT WORK WITH OFFICIAL LIMUSIC 🚨
> It needs the **[Limusic Local API fork](https://github.com/aijeculate/limusic)**, which adds the opt-in Local API this extension talks to.
> The official Limusic from [SimoHypers/limusic](https://github.com/SimoHypers/limusic) does **not** include it, so every command will fail with "Limusic isn't running or its Local API is disabled".
>
> **Install the fork's build first, then follow the setup below.**

# Limusic for Raycast

Control Limusic from Raycast on Windows (and macOS), using the Local API from the fork linked above.

## Install

1. **Get the Limusic fork build.** Download the latest Windows build from the [fork](https://github.com/aijeculate/limusic) (see its Releases page, or the newest successful "Fork sync + Windows build" run under Actions → Artifacts), or build it from source. The fork tracks upstream's `dev` branch and is rebuilt when upstream changes.
2. **Install this extension from source** (it is not in the Raycast Store):
   ```
   git clone https://github.com/aijeculate/limusic-raycast
   cd limusic-raycast
   npm install
   npm run build
   ```
   Then open Raycast, run **Import Extension**, and select the `limusic-raycast` folder. Don't move or delete the folder afterwards.

## Setup

1. In the Limusic fork, open **Settings > Data > Local API** and turn it on.
2. Copy the access token.
3. On the first run of any command, paste the token into the extension preferences. Change the
port only if you changed it in Limusic (default `26538`).

See `docs/local-api.md` in the fork for the API details.

## Commands

| Command                                  | What it does                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Play / Pause, Next Track, Previous Track | Transport, with a HUD of the result                                            |
| Like Current Track                       | Toggle the like on the playing track (needs sign-in)                           |
| Increase / Decrease Volume               | +/- 10                                                                         |
| Toggle Shuffle, Cycle Repeat             | Modes                                                                          |
| Now Playing                              | Artwork, progress (updates every second) and every control                     |
| Search Music                             | Songs, albums, artists, playlists: Play Now, Play Next, Add to Queue, Copy URL |
| Show Queue                               | Current track tagged; Jump to Track, Remove from Queue                         |
| Library Playlists                        | Play, shuffle, or open a playlist and play from any track                      |

## Troubleshooting

- **"Limusic isn't running or its Local API is disabled"**: start Limusic and enable the API. If there is no Local API setting at all, you are on official Limusic and need the fork build.
- **"Wrong access token"**: copy it again; regenerating it in Limusic invalidates the old one.
- **"Sign in to Limusic first"**: liking and your YouTube library need a signed-in account.

## Development

```
npm install
npm run dev     # ray develop
npm run lint
npm run build
```

Set `author` in `package.json` to your Raycast username before publishing.
