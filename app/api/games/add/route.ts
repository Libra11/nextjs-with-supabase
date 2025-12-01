/*
 * @Author: Libra
 * @Date: 2025-12-01 14:49:00
 * @LastEditTime: 2025-12-01 14:49:48
 * @LastEditors: Libra
 * @Description:
 */
import { createClient } from "@/utils/supabase/server";
import { getGameDetails } from "@/lib/steam";
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
    const body = await request.json();
    const { name, exe_name, steam_appid_input } = body;

    if (!name || !exe_name) {
      return NextResponse.json(
        { error: "Name and EXE Name are required" },
        { status: 400 }
      );
    }

    let gameData: any = {
      user_id: user.id,
      name,
      exe_name,
      platform: "local",
      total_playtime_minutes: 0,
    };

    // If Steam AppID is provided, try to fetch details
    if (steam_appid_input) {
      // Extract ID from URL if it's a URL, otherwise assume it's an ID
      let appid = steam_appid_input;
      const urlMatch = steam_appid_input.match(/\/app\/(\d+)/);
      if (urlMatch) {
        appid = urlMatch[1];
      }

      // Fetch details
      try {
        const details = await getGameDetails(appid);
        if (details) {
          gameData = {
            ...gameData,
            steam_appid: appid.toString(),
            description: details.detailed_description,
            short_description: details.short_description,
            header_image: details.header_image,
            icon_url: details.header_image, // Use header image as icon for local games if available, or we could use a specific icon
            release_date: details.release_date?.date,
            developers: details.developers,
            publishers: details.publishers,
          };
        }
      } catch (e) {
        console.error("Failed to fetch Steam details for local game:", e);
        // Continue without steam details if fetch fails
      }
    }

    const { data, error } = await supabase
      .from("games")
      .insert(gameData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, game: data });
  } catch (error: any) {
    console.error("Add game error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
