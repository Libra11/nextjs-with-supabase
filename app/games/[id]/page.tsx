import { createClient } from "@/utils/supabase/server";
import { SessionChart } from "@/components/games/session-chart";
import { SessionList } from "@/components/games/session-list";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Trophy, Calendar, Building2 } from "lucide-react";
import { Game, PlaySession } from "@/types/games";
import { format, parseISO } from "date-fns";
import { getGameDetails } from "@/lib/steam";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Fetch Game
  let { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (gameError || !game) {
    return <div>Game not found</div>;
  }

  // Lazy load Steam Details if missing and it's a Steam game
  if (game.platform === "steam" && game.steam_appid && !game.description) {
    try {
      const details = await getGameDetails(game.steam_appid);
      if (details) {
        const updates = {
          description: details.detailed_description,
          short_description: details.short_description,
          header_image: details.header_image,
          release_date: details.release_date?.date,
          developers: details.developers,
          publishers: details.publishers,
        };

        // Update DB
        await supabase.from("games").update(updates).eq("id", id);

        // Merge for current render
        game = { ...game, ...updates };
      }
    } catch (e) {
      console.error("Failed to fetch Steam details", e);
    }
  }

  const typedGame = game as Game;

  // Fetch Sessions
  const { data: sessions, error: sessionError } = await supabase
    .from("play_sessions")
    .select("*")
    .eq("game_id", id)
    .order("start_time", { ascending: false });

  const typedSessions = (sessions || []) as PlaySession[];

  return (
    <div className="min-h-screen w-full bg-[#0b0c10] text-white">
      {/* Hero / Header */}
      <div className="relative min-h-[50vh] w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/60 to-transparent z-10" />
        {/* Background Blur */}
        {(typedGame.header_image || typedGame.icon_url) && (
          <Image
            src={typedGame.header_image || typedGame.icon_url || ""}
            alt="Background"
            fill
            className="object-cover opacity-30 blur-xl"
            priority
          />
        )}

        <div className="relative z-20 h-full flex flex-col justify-end p-8 max-w-7xl mx-auto w-full pt-32">
          <Link
            href="/games"
            className="mb-8 inline-flex items-center text-gray-400 hover:text-white transition-colors w-fit hover:bg-white/10 px-3 py-1.5 rounded-lg -ml-3"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Library
          </Link>

          <div className="flex flex-col md:flex-row items-end gap-8">
            <div className="relative h-64 w-48 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-black rotate-2 hover:rotate-0 transition-transform duration-500">
              {typedGame.icon_url ? (
                <Image
                  src={typedGame.icon_url}
                  alt={typedGame.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                  ?
                </div>
              )}
            </div>
            <div className="mb-2 flex-1">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-6 drop-shadow-xl">
                {typedGame.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200 mb-8">
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur border border-white/5 hover:bg-white/20 transition-colors">
                  <Clock size={16} className="text-blue-400" />
                  <span className="font-bold">
                    {Math.round(typedGame.total_playtime_minutes / 60)}
                  </span>{" "}
                  Hours
                </span>
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur border border-white/5 capitalize">
                  <Trophy size={16} className="text-yellow-400" />
                  {typedGame.platform}
                </span>
                <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur border border-white/5">
                  <Calendar size={16} className="text-green-400" />
                  Last Played:{" "}
                  {format(parseISO(typedGame.updated_at), "yyyy/MM/dd")}
                </span>
                {typedGame.release_date && (
                  <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur border border-white/5">
                    <Calendar size={16} className="text-purple-400" />
                    Released: {typedGame.release_date}
                  </span>
                )}
              </div>

              {/* Short Description */}
              {typedGame.short_description && (
                <div
                  className="text-lg text-gray-300 max-w-3xl leading-relaxed drop-shadow-md border-l-4 border-blue-500 pl-4"
                  dangerouslySetInnerHTML={{
                    __html: typedGame.short_description,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
          {/* Detailed Description */}
          {typedGame.description && (
            <div className="prose prose-invert prose-lg max-w-none">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  About This Game
                </h2>
                <div
                  className="game-description text-gray-300 space-y-4"
                  dangerouslySetInnerHTML={{ __html: typedGame.description }}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-black/20 p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Playtime Activity</h2>
            <SessionChart sessions={typedSessions} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Game Info Card */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-white/80 uppercase tracking-wider text-sm">
              Game Info
            </h3>
            <div className="space-y-4">
              {typedGame.developers && (
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Building2 size={12} /> DEVELOPER
                  </div>
                  <div className="text-blue-400 hover:text-blue-300 transition-colors">
                    {typedGame.developers.join(", ")}
                  </div>
                </div>
              )}
              {typedGame.publishers && (
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Building2 size={12} /> PUBLISHER
                  </div>
                  <div className="text-blue-400 hover:text-blue-300 transition-colors">
                    {typedGame.publishers.join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Recent Sessions</h2>
            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              <SessionList sessions={typedSessions} />
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for the HTML content */}
      <style>{`
        .game-description img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .game-description a {
          color: #60a5fa;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
