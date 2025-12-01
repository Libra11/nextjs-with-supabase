import { SteamGame, SteamPlayerSummary } from "@/types/games";

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const BASE_URL = "https://api.steampowered.com";

if (!STEAM_API_KEY) {
  console.warn("STEAM_API_KEY is not set in environment variables");
}

export async function resolveVanityURL(
  vanityUrl: string
): Promise<string | null> {
  if (!STEAM_API_KEY) throw new Error("Missing Steam API Key");

  // If input is already numeric (likely a SteamID64), return it
  if (/^\d{17}$/.test(vanityUrl)) return vanityUrl;

  const url = `${BASE_URL}/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${vanityUrl}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.response?.success === 1) {
    return data.response.steamid;
  }
  return null;
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
  if (!STEAM_API_KEY) throw new Error("Missing Steam API Key");

  const url = `${BASE_URL}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
  const res = await fetch(url);
  const data = await res.json();

  return data.response?.games || [];
}

export async function getPlayerSummaries(
  steamId: string
): Promise<SteamPlayerSummary> {
  if (!STEAM_API_KEY) throw new Error("Missing Steam API Key");

  const url = `${BASE_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
  const res = await fetch(url);
  const data = await res.json();

  return data.response?.players?.[0];
}

export function getSteamImage(appid: number, hash: string) {
  // Use the library hero image (600x900) for better quality vertical cards
  // or header.jpg (460x215) for horizontal.
  // The previous hash URL was just a tiny icon.
  return `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/library_600x900.jpg`;
}

export async function getGameDetails(appid: string) {
  // Use the public store API (no key needed, but rate limited)
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
  const data = await res.json();

  if (data[appid]?.success) {
    return data[appid].data;
  }
  return null;
}
