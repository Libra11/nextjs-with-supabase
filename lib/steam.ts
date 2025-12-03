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

  // Get family IDs from environment variable
  const familyIds = process.env.STEAM_FAMILY_IDS
    ? process.env.STEAM_FAMILY_IDS.split(",").map((id) => id.trim())
    : [];

  // Combine main ID with family IDs, ensuring uniqueness
  const targetIds = Array.from(new Set([steamId, ...familyIds])).filter(Boolean);

  const fetchGamesForId = async (id: string) => {
    try {
      const url = `${BASE_URL}/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${id}&include_appinfo=true&include_played_free_games=true&include_free_sub=1&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.response?.games || []) as SteamGame[];
    } catch (error) {
      console.error(`Failed to fetch games for Steam ID ${id}:`, error);
      return [];
    }
  };

  // Fetch all libraries in parallel
  const results = await Promise.all(targetIds.map((id) => fetchGamesForId(id)));

  // Merge games, deduplicating by appid
  const gameMap = new Map<number, SteamGame & { is_shared?: boolean }>();
  
  // 1. Process main user's games
  if (results.length > 0) {
    const userGames = results[0];
    userGames.forEach((game) => {
      gameMap.set(game.appid, { ...game, is_shared: false });
    });
  }

  // 2. Process family games
  for (let i = 1; i < results.length; i++) {
    const familyGames = results[i];
    familyGames.forEach((game) => {
      if (!gameMap.has(game.appid)) {
        // User doesn't have it at all -> Add as shared, use owner's playtime
        gameMap.set(game.appid, { ...game, is_shared: true });
      } else {
        // User has it (or Steam API returned it for user)
        // If user's playtime is 0 but owner has playtime, it might be a shared game 
        // where API didn't return playtime for borrower.
        // In this case, we use owner's playtime but still mark it as shared/borrowed visually?
        // User asked to "show owner's time" if we can't get theirs.
        const existing = gameMap.get(game.appid)!;
        if (existing.playtime_forever === 0 && game.playtime_forever > 0) {
           // Update with owner's playtime and mark as shared so we can distinguish in UI
           gameMap.set(game.appid, { ...game, is_shared: true });
        }
      }
    });
  }

  return Array.from(gameMap.values());
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
