"use client";

import { Game } from "@/types/games";
import { Clock, Monitor, Gamepad2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { format, parseISO } from "date-fns";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const hours = Math.round((game.total_playtime_minutes || 0) / 60);

  return (
    <Link href={`/games/${game.id}`}>
      <div className="group relative h-full overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-black/60">
        <div className="aspect-video w-full bg-gradient-to-br from-gray-800 to-gray-900 relative">
          {game.icon_url ? (
            <Image
              src={game.icon_url}
              alt={game.name}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20">
              <Gamepad2 size={48} />
            </div>
          )}

          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                game.platform === "steam"
                  ? "bg-[#171a21] text-blue-400"
                  : "bg-emerald-900 text-emerald-400"
              }`}
            >
              {game.platform}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="truncate text-lg font-bold text-white group-hover:text-primary transition-colors">
            {game.name}
          </h3>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{hours}h Played</span>
            </div>
            <div className="text-xs text-gray-600">
              {format(parseISO(game.updated_at), "yyyy/MM/dd")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
