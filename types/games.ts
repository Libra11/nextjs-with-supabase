export type GamePlatform = "steam" | "local";

export interface Game {
  id: string;
  user_id: string;
  name: string;
  platform: GamePlatform;
  steam_appid: string | null;
  exe_name: string | null;
  icon_url: string | null;
  total_playtime_minutes: number;
  description?: string;
  short_description?: string;
  header_image?: string;
  release_date?: string;
  developers?: string[];
  publishers?: string[];
  created_at: string;
  updated_at: string;
}

export interface PlaySession {
  id: string;
  game_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  source: "steam_api" | "local_client";
  created_at: string;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  img_icon_url: string;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}
