// Mirrors limusic's docs/local-api.md (API v1).

export type RepeatMode = "off" | "all" | "one";
export type SearchType = "songs" | "albums" | "artists" | "playlists";
export type CardType = "song" | "album" | "artist" | "playlist";

export interface Track {
  id: string;
  title: string;
  artists: string;
  album: string | null;
  albumId: string | null;
  durationMs: number | null;
  thumbnailUrl: string | null;
  liked: boolean | null;
}

export interface Card {
  type: CardType;
  id: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
}

export type SearchResult = (Track & { type: "song" }) | Card;

export interface Status {
  version: string;
  apiVersion: number;
}

export interface Player {
  track: Track | null;
  positionMs: number;
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface Queue {
  currentIndex: number;
  tracks: Track[];
}

export interface PlaylistPage {
  id: string;
  title: string | null;
  subtitle: string | null;
  thumbnailUrl: string | null;
  tracks: Track[];
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
