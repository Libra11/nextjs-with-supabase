import { createClient } from "@/utils/supabase/server";
import { GameCard } from "@/components/games/game-card";
import { SteamSyncButton } from "@/components/games/steam-sync-button";
import { redirect } from "next/navigation";
import { Game } from "@/types/games";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function GamesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .eq("user_id", user.id)
    .order("total_playtime_minutes", { ascending: false });

  if (error) {
    console.error("Error fetching games:", error);
    return <div>Error loading games</div>;
  }

  const typedGames = (games || []) as Game[];

  return (
    <div className="min-h-screen w-full bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="w-full px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Game Library
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {typedGames.length} Games •{" "}
              {Math.round(
                typedGames.reduce(
                  (acc, g) => acc + g.total_playtime_minutes,
                  0
                ) / 60
              )}{" "}
              Hours Total
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/games/add">
              <button className="flex items-center gap-2 rounded-lg bg-[#171a21] px-4 py-2 text-sm font-bold text-white hover:bg-[#2a303c] transition-colors border border-white/10">
                <Plus size={16} />
                Add Game
              </button>
            </Link>
            <SteamSyncButton />
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="p-8 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {typedGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
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
