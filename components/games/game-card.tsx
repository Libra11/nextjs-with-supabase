"use client";

import { Game } from "@/types/games";
import { Clock, Gamepad2, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const hours = Math.round((game.total_playtime_minutes || 0) / 60);

  return (
    <Link href={`/games/${game.id}`} className="group relative block h-full">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#1e2024] shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/20 group-hover:ring-2 group-hover:ring-blue-500/50">
        {/* Game Cover Image */}
        {game.icon_url ? (
          <Image
            src={game.icon_url}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 p-4 text-center">
            <Gamepad2 size={48} className="mb-4 text-gray-600" />
            <span className="text-sm font-bold text-gray-400">{game.name}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
          <h3 className="text-lg font-bold text-white leading-tight mb-1 drop-shadow-md line-clamp-2">
            {game.name}
          </h3>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-300">
            <Clock size={12} />
            <span>{hours}h Played</span>
          </div>

          {/* "Play" indicator visual */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 scale-50 group-hover:scale-100">
            <div className="bg-blue-600/90 rounded-full p-4 backdrop-blur-sm shadow-xl">
              <Play size={24} className="fill-white text-white ml-1" />
            </div>
          </div>
        </div>

        {/* Platform Badge (Always visible but subtle) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {game.is_shared && (
            <div className="bg-purple-500/80 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/10 shadow-sm">
              SHARED
            </div>
          )}
          {game.platform === "steam" && (
            <div className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-400 border border-white/10">
              STEAM
            </div>
          )}
          {game.platform === "local" && (
            <div className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-bold text-green-400 border border-white/10">
              LOCAL
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
