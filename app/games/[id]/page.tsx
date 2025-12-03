import { createClient } from "@/utils/supabase/server";
import { SessionChart } from "@/components/games/session-chart";
import { SessionList } from "@/components/games/session-list";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Trophy,
  Calendar,
  Building2,
  Play,
} from "lucide-react";
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

        await supabase.from("games").update(updates).eq("id", id);
        game = { ...game, ...updates };
      }
    } catch (e) {
      console.error("Failed to fetch Steam details", e);
    }
  }

  const typedGame = game as Game;

  // Fetch Sessions
  const { data: sessions } = await supabase
    .from("play_sessions")
    .select("*")
    .eq("game_id", id)
    .order("start_time", { ascending: false });

  const typedSessions = (sessions || []) as PlaySession[];

  return (
    <div className="min-h-screen w-full bg-[#0b0c10] text-white relative selection:bg-blue-500/30">
      {/* Fullscreen Fixed Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {typedGame.header_image || typedGame.icon_url ? (
          <Image
            src={typedGame.header_image || typedGame.icon_url || ""}
            alt="Background"
            fill
            className="object-cover opacity-40 blur-md scale-105"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/80 to-black/40" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0b0c10]/80" />
      </div>

      {/* Scrollable Content Layer */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Top Navigation */}
        <div className="p-4 md:p-8 pb-0">
          <Link
            href="/games"
            className="inline-flex items-center text-white/60 hover:text-white transition-colors hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Library
          </Link>
        </div>

        {/* Hero Header */}
        <div className="w-full px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row items-end gap-8 md:gap-12 max-w-[1920px]">
          {/* Cover Art */}
          <div className="relative h-[300px] w-[200px] md:h-[400px] md:w-[267px] rounded-2xl overflow-hidden shadow-2xl shrink-0 ring-1 ring-white/10 group mx-auto md:mx-0">
            {typedGame.icon_url ? (
              <Image
                src={typedGame.icon_url}
                alt={typedGame.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-4xl font-bold">
                ?
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 space-y-6 md:space-y-8 pb-4 w-full">
            <div>
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <span
                  className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${typedGame.platform === "steam" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-green-500/30 bg-green-500/10 text-green-400"}`}
                >
                  {typedGame.platform}
                </span>
                {typedGame.release_date && (
                  <span className="text-white/40 text-sm font-medium tracking-wide">
                    RELEASED {typedGame.release_date.toUpperCase()}
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tight text-white drop-shadow-2xl leading-none text-center md:text-left">
                {typedGame.name}
              </h1>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-12 p-4 md:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 w-full md:w-fit mx-auto md:mx-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(typedGame.total_playtime_minutes / 60)}
                    <span className="text-sm font-normal text-white/50 ml-1">
                      hrs
                    </span>
                  </div>
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Time Played
                  </div>
                </div>
              </div>

              <div className="w-full h-px sm:w-px sm:h-10 bg-white/10" />

              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    {format(parseISO(typedGame.updated_at), "MMM d, yyyy")}
                  </div>
                  <div className="text-xs font-medium text-white/40 uppercase tracking-wider">
                    Last Session
                  </div>
                </div>
              </div>
            </div>

            {/* Short Description */}
            {typedGame.short_description && (
              <div
                className="text-base md:text-xl text-white/80 max-w-4xl leading-relaxed font-light text-center md:text-left"
                dangerouslySetInnerHTML={{
                  __html: typedGame.short_description,
                }}
              />
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="px-4 md:px-8 pb-20 w-full grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12 max-w-[1920px]">
          {/* Left Column: Description & Charts */}
          <div className="xl:col-span-2 space-y-8 md:space-y-12">
            {/* Detailed Description */}
            {typedGame.description && (
              <div className="rounded-3xl bg-[#1e2024]/80 backdrop-blur-md border border-white/5 p-6 md:p-10 shadow-2xl">
                <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-white flex items-center gap-3">
                  <div className="w-1 h-6 md:h-8 bg-blue-500 rounded-full" />
                  ABOUT THIS GAME
                </h2>
                <div
                  className="game-description prose prose-invert prose-lg max-w-none text-gray-300/90 text-sm md:text-base"
                  dangerouslySetInnerHTML={{ __html: typedGame.description }}
                />
              </div>
            )}

            {/* Chart */}
            <div className="rounded-3xl bg-[#1e2024]/80 backdrop-blur-md border border-white/5 p-6 md:p-10 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-white flex items-center gap-3">
                <div className="w-1 h-6 md:h-8 bg-green-500 rounded-full" />
                PLAYTIME HISTORY
              </h2>
              <div className="h-[300px] md:h-[400px] w-full">
                <SessionChart sessions={typedSessions} />
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar info */}
          <div className="space-y-8">
            {/* Metadata Card */}
            <div className="rounded-3xl bg-[#1e2024]/80 backdrop-blur-md border border-white/5 p-6 md:p-8 shadow-xl">
              <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">
                Game Info
              </h3>
              <div className="space-y-6">
                {typedGame.developers && (
                  <div>
                    <div className="flex items-center gap-2 text-white/60 mb-1 text-sm">
                      <Building2 size={14} /> DEVELOPER
                    </div>
                    <div className="text-blue-400 font-medium text-lg">
                      {typedGame.developers.join(", ")}
                    </div>
                  </div>
                )}
                {typedGame.publishers && (
                  <div>
                    <div className="flex items-center gap-2 text-white/60 mb-1 text-sm">
                      <Building2 size={14} /> PUBLISHER
                    </div>
                    <div className="text-blue-400 font-medium text-lg">
                      {typedGame.publishers.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Sessions Log */}
            <div className="rounded-3xl bg-[#1e2024]/80 backdrop-blur-md border border-white/5 p-8 shadow-xl">
              <h2 className="text-xl font-bold mb-6 text-white">
                Recent Sessions
              </h2>
              <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <SessionList sessions={typedSessions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for Steam Description Content */}
      <style>{`
        .game-description img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 1.5rem 0;
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .game-description a {
          color: #60a5fa;
          text-decoration: none;
          border-bottom: 1px solid rgba(96, 165, 250, 0.4);
          transition: all 0.2s;
        }
        .game-description a:hover {
          border-bottom-color: #60a5fa;
          color: #93c5fd;
        }
        .game-description h1, .game-description h2, .game-description h3 {
            color: #fff;
            font-weight: 700;
            margin-top: 2rem;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}
