"use client";

import { PlaySession } from "@/types/games";
import { format, parseISO } from "date-fns";
import { Gamepad, Monitor } from "lucide-react";

interface SessionListProps {
  sessions: PlaySession[];
}

export function SessionList({ sessions }: SessionListProps) {
  if (sessions.length === 0) {
    return <div className="text-gray-500">No sessions recorded.</div>;
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${session.source === "steam_api" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}
            >
              {session.source === "steam_api" ? (
                <Gamepad size={16} />
              ) : (
                <Monitor size={16} />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-white">
                {format(parseISO(session.start_time), "PPP")}
              </div>
              <div className="text-xs text-gray-500">
                {format(parseISO(session.start_time), "p")} -{" "}
                {format(parseISO(session.end_time), "p")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white">
              {(session.duration_seconds / 3600).toFixed(1)}h
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {session.source.replace("_", " ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
