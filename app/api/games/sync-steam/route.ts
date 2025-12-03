import { createClient } from "@/utils/supabase/server";
import { getOwnedGames, getSteamImage, resolveVanityURL } from "@/lib/steam";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { steamIdInput } = await request.json();

    if (!steamIdInput) {
      return NextResponse.json(
        { error: "Steam ID or URL is required" },
        { status: 400 }
      );
    }

    const steamId = await resolveVanityURL(steamIdInput);
    if (!steamId) {
      return NextResponse.json(
        { error: "Could not resolve Steam ID" },
        { status: 404 }
      );
    }

    const steamGames = await getOwnedGames(steamId);

    // Upsert games
    const operations = steamGames.map(async (game) => {
      // 1. Upsert Game
      const { data: savedGame, error: gameError } = await supabase
        .from("games")
        .upsert(
          {
            user_id: user.id,
            name: game.name,
            platform: "steam",
            steam_appid: game.appid.toString(),
            icon_url: getSteamImage(game.appid, game.img_icon_url),
            total_playtime_minutes: game.playtime_forever,
            is_shared: (game as any).is_shared || false,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,steam_appid",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (gameError) {
        console.error(`Error syncing game ${game.name}:`, gameError);
        return;
      }

      // 2. Handle Virtual Session (One big session for Steam total time)
      // We try to find an existing Steam session for this game and update it,
      // or create a new one if it doesn't exist.
      // Note: Ideally we'd track increments, but without history API,
      // we treat the total as one session as requested.

      const { data: existingSession } = await supabase
        .from("play_sessions")
        .select("id")
        .eq("game_id", savedGame.id)
        .eq("source", "steam_api")
        .single();

      const durationSeconds = game.playtime_forever * 60;

      if (existingSession) {
        await supabase
          .from("play_sessions")
          .update({
            duration_seconds: durationSeconds,
            end_time: new Date().toISOString(), // Update end time to now
          })
          .eq("id", existingSession.id);
      } else {
        await supabase.from("play_sessions").insert({
          game_id: savedGame.id,
          user_id: user.id,
          start_time: new Date().toISOString(), // Set start to now for new imports
          end_time: new Date().toISOString(),
          duration_seconds: durationSeconds,
          source: "steam_api",
        });
      }
    });

    await Promise.all(operations);

    return NextResponse.json({ success: true, count: steamGames.length });
  } catch (error: any) {
    console.error("Steam sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
