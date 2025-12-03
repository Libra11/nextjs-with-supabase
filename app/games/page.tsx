import { createClient } from "@/utils/supabase/server";
import { SteamSyncButton } from "@/components/games/steam-sync-button";
import { GameLibrary } from "@/components/games/game-library";
import { redirect } from "next/navigation";
import { Game } from "@/types/games";
import { Plus, Play, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function GamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch games ordered by last played (updated_at) to pick the hero
  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false }); // Recent first

  if (error) {
    console.error("Error fetching games:", error);
    return <div>Error loading games</div>;
  }

  const typedGames = (games || []) as Game[];

  // The most recent game for the Hero section
  const heroGame = typedGames[0];

  // Sort the rest of the list by total playtime or keep recent?
  // Steam Library usually sorts by "Recent" or "Name". Let's keep "Recent" for now as it's dynamic.
  // Or maybe user prefers Playtime? Let's stick to the current sort which is now "Recent" due to the query change.

  const totalPlaytime = Math.round(
    typedGames.reduce((acc, g) => acc + g.total_playtime_minutes, 0) / 60
  );

  return (
    <div className="min-h-screen w-full bg-[#0b0c10] text-white relative selection:bg-blue-500/30">
      {/* Fixed Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0b0c10] to-[#0b0c10] pointer-events-none z-0" />

      {/* Header (Transparent & Floating) */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12 px-4 md:px-8 pointer-events-none">
        <div className="w-full flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white/90 drop-shadow-lg">
              LIBRARY
            </h1>
            <div className="hidden md:block h-6 w-px bg-white/20" />
            <div className="hidden md:flex text-xs font-medium text-white/60 gap-4">
              <span>{typedGames.length} GAMES</span>
              <span>{totalPlaytime} HOURS</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/games/add">
              <button className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 md:px-4 text-[10px] md:text-xs font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/5 hover:scale-105 active:scale-95">
                <Plus size={14} />
                <span className="hidden sm:inline">ADD GAME</span>
                <span className="sm:hidden">ADD</span>
              </button>
            </Link>
            <SteamSyncButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-0 w-full space-y-0">
        {/* HERO SECTION (Most Recent Game) */}
        {heroGame && (
          <div className="relative w-full h-[50vh] md:h-[65vh] min-h-[400px] md:min-h-[500px] overflow-hidden group shadow-2xl mb-8 md:mb-12">
            {/* Background Image with Zoom Effect */}
            <div className="absolute inset-0">
              {heroGame.platform === "steam" && heroGame.steam_appid ? (
                <Image
                  src={`https://steamcdn-a.akamaihd.net/steam/apps/${heroGame.steam_appid}/library_hero.jpg`}
                  alt="Hero Background"
                  fill
                  className="object-cover opacity-80 scale-105 group-hover:scale-100 transition-transform duration-[20s] ease-linear"
                  priority
                />
              ) : heroGame.header_image || heroGame.icon_url ? (
                <Image
                  src={heroGame.header_image || heroGame.icon_url || ""}
                  alt="Hero Background"
                  fill
                  className="object-cover opacity-80 scale-105 group-hover:scale-100 transition-transform duration-[20s] ease-linear"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-black" />
              )}
              {/* Gradient Overlays for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10]/80 via-transparent to-transparent" />
            </div>

            {/* Content Container */}
            <div className="absolute bottom-0 left-0 w-full p-4 md:p-16 flex flex-col items-start justify-end z-10">
              {/* "Recently Played" Label */}
              <div className="flex items-center gap-2 text-blue-400 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-2 md:mb-4 opacity-90">
                <div className="w-1 h-3 md:h-4 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                Recently Played
              </div>

              {/* Game Title */}
              <h2 className="text-3xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-2xl mb-4 md:mb-6 max-w-4xl line-clamp-2">
                {heroGame.name}
              </h2>

              {/* Meta Info Badges */}
              <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded border border-white/10 text-[10px] md:text-xs font-bold text-gray-200">
                  <Clock size={12} className="text-blue-400" />
                  {Math.round(heroGame.total_playtime_minutes / 60)}h Total
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded border border-white/10 text-[10px] md:text-xs font-bold text-gray-200 uppercase">
                  {heroGame.platform === "steam" ? (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  ) : (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  )}
                  {heroGame.platform}
                </div>
              </div>

              {/* Action Button */}
              <Link href={`/games/${heroGame.id}`}>
                <button className="group/btn relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 md:px-10 md:py-4 rounded shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.8)] active:scale-95 flex items-center gap-2 md:gap-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
                  <Play size={20} className="fill-white md:w-6 md:h-6" />
                  <span className="font-black text-sm md:text-lg tracking-wide">
                    RESUME
                  </span>
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ALL GAMES LIBRARY (Client Component with Search/Sort) */}
        <div className="px-4 md:px-8 pb-20">
          <GameLibrary initialGames={typedGames} />
        </div>
      </main>
    </div>
  );
}
