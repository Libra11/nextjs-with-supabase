"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SteamSyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [steamId, setSteamId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    if (!steamId) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/games/sync-steam", {
        method: "POST",
        body: JSON.stringify({ steamIdInput: steamId }),
      });

      if (!res.ok) throw new Error("Sync failed");

      const data = await res.json();
      alert(`Synced ${data.count} games!`);
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      alert("Failed to sync steam games");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-[#171a21] px-3 py-2 text-sm font-bold text-white hover:bg-[#2a303c] transition-colors border border-white/10"
      >
        <RefreshCw size={16} />
        <span className="hidden sm:inline">Sync Steam</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
      <input
        type="text"
        value={steamId}
        onChange={(e) => setSteamId(e.target.value)}
        placeholder="Steam ID"
        className="bg-black/50 border border-white/20 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-24 sm:w-32 md:w-48 placeholder:text-xs"
      />
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="bg-blue-600 text-white px-2 md:px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Go"}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="text-gray-400 hover:text-white text-sm whitespace-nowrap"
      >
        <span className="hidden sm:inline">Cancel</span>
        <span className="sm:hidden">✕</span>
      </button>
    </div>
  );
}
