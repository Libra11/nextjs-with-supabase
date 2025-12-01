import { createClient } from "@/utils/supabase/server";
import { GameCard } from "@/components/games/game-card";
import { SteamSyncButton } from "@/components/games/steam-sync-button";
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
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-12 px-8">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight text-white/90 drop-shadow-lg">
              LIBRARY
            </h1>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-xs font-medium text-white/60 flex gap-4">
              <span>{typedGames.length} GAMES</span>
              <span>{totalPlaytime} HOURS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/games/add">
              <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/5 hover:scale-105 active:scale-95">
                <Plus size={14} />
                ADD GAME
              </button>
            </Link>
            <SteamSyncButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-20 px-8 w-full space-y-12">
        {/* HERO SECTION (Most Recent Game) */}
        {heroGame && (
          <div className="relative w-full h-[50vh] min-h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
            {/* Background Image */}
            <div className="absolute inset-0">
              {heroGame.header_image || heroGame.icon_url ? (
                <Image
                  src={heroGame.header_image || heroGame.icon_url || ""}
                  alt="Hero Background"
                  fill
                  className="object-cover opacity-60 blur-sm scale-105 group-hover:scale-100 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10]/80 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-12 w-full md:w-2/3 lg:w-1/2 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-bold tracking-wider uppercase mb-2">
                  <Play size={14} className="fill-current" />
                  Recently Played
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-white leading-none drop-shadow-xl">
                  {heroGame.name}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-white/80">
                <span className="flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                  <Clock size={16} className="text-blue-400" />
                  {Math.round(heroGame.total_playtime_minutes / 60)}h Total
                </span>
                <span className="flex items-center gap-2 bg-black/30 backdrop-blur px-3 py-1 rounded-lg border border-white/10 uppercase">
                  <Trophy size={16} className="text-yellow-400" />
                  {heroGame.platform}
                </span>
              </div>

              <div className="pt-4">
                <Link href={`/games/${heroGame.id}`}>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 shadow-lg shadow-blue-900/50 transition-all hover:scale-105 active:scale-95">
                    <Play size={20} className="fill-white" />
                    RESUME
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ALL GAMES GRID */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white/90 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            ALL GAMES
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
            {typedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>

        {typedGames.length === 0 && (
          <div className="mt-20 text-center text-gray-500">
            <p className="text-lg">No games found.</p>
            <p className="text-sm mt-2">
              Click "Sync Steam" to import your library.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
