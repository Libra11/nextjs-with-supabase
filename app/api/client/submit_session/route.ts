/*
 * @Author: Libra
 * @Date: 2025-12-01 14:14:23
 * @LastEditTime: 2025-12-01 17:27:26
 * @LastEditors: Libra
 * @Description:
 */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Simple secret for the client to use
const CLIENT_SECRET = process.env.CLIENT_SECRET;
// Service Role Key to bypass RLS since this is a server-to-server/client API
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get("authorization");
  if (CLIENT_SECRET && authHeader !== `Bearer ${CLIENT_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid Client Secret" },
      { status: 401 }
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error: "Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 500 }
    );
  }

  // Create Admin Client with Service Role Key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const body = await request.json();
    const { game_exe_name, start_time, end_time, user_id } = body;
    // ... rest of the file is mostly same but using admin supabase client ...

    if (!game_exe_name || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Find Game
    // If user_id is provided, use it. Otherwise try to find the game by exe_name directly.
    let query = supabase
      .from("games")
      .select("id, total_playtime_minutes, user_id")
      .eq("exe_name", game_exe_name);

    if (user_id) {
      query = query.eq("user_id", user_id);
    }

    const { data: games, error: gameError } = await query;

    if (gameError || !games || games.length === 0) {
      return NextResponse.json(
        { error: `Game not found for exe: ${game_exe_name}` },
        { status: 404 }
      );
    }

    if (games.length > 1) {
      return NextResponse.json(
        {
          error:
            "Ambiguous exe_name (multiple users have this game). Please provide user_id.",
        },
        { status: 400 }
      );
    }

    const game = games[0];

    // 3. Calculate Duration
    const start = new Date(start_time);
    const end = new Date(end_time);
    const durationSeconds = Math.floor(
      (end.getTime() - start.getTime()) / 1000
    );

    if (durationSeconds < 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // 4. Insert Session (Use service role or verify RLS allows this)
    // Since we are using standard client, RLS might block if we aren't logged in as that user.
    // But wait, `createClient` uses cookies. If we are a script, we have no cookies.
    // We need a Service Role client to bypass RLS for this "background task".
    // OR, we just rely on the fact that we authenticated with CLIENT_SECRET.

    // To properly write without user session, we need SUPABASE_SERVICE_ROLE_KEY.
    // But for simplicity in this specific project setup, I'll assume you might want to use
    const { error: sessionError } = await supabase
      .from("play_sessions")
      .insert({
        game_id: game.id,
        user_id: game.user_id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        // duration_seconds is generated always as (end_time - start_time), so we must NOT insert it manually.
        source: "local_client",
      });

    if (sessionError) {
      // If RLS fails, inform user
      if (sessionError.code === "42501") {
        return NextResponse.json(
          {
            error:
              "RLS Permission Denied. You need to use a Service Role Key for the client API.",
          },
          { status: 403 }
        );
      }
      throw sessionError;
    }

    // 5. Update Total Playtime
    const additionalMinutes = Math.floor(durationSeconds / 60);
    await supabase
      .from("games")
      .update({
        total_playtime_minutes:
          (game.total_playtime_minutes || 0) + additionalMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id);

    return NextResponse.json({
      success: true,
      added_minutes: additionalMinutes,
    });
  } catch (error: any) {
    console.error("Session submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
