"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Search } from "lucide-react";
import Link from "next/link";

export default function AddGamePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    exe_name: "",
    steam_appid_input: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/games/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add game");
      }

      router.push("/games");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0c10] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link
            href="/games"
            className="text-gray-400 hover:text-white flex items-center gap-2 mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Library
          </Link>
          <h1 className="text-3xl font-bold">Add Local Game</h1>
          <p className="text-gray-400 mt-2">
            Manually add a non-Steam game to your library.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm"
        >
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Game Name *
            </label>
            <input
              required
              type="text"
              placeholder="e.g. League of Legends"
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* EXE Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Process Name (.exe) *
            </label>
            <div className="relative">
              <input
                required
                type="text"
                placeholder="e.g. LeagueClient.exe"
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                value={formData.exe_name}
                onChange={(e) =>
                  setFormData({ ...formData, exe_name: e.target.value })
                }
              />
              <div className="absolute right-3 top-3 text-xs text-gray-500 pointer-events-none">
                For auto-tracking
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Used by the client to automatically track playtime.
            </p>
          </div>

          <div className="h-px bg-white/10 my-6" />

          {/* Steam Metadata */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-300 flex items-center gap-2">
              <Search size={14} />
              Fetch Metadata from Steam (Optional)
            </label>
            <input
              type="text"
              placeholder="Steam AppID or Store URL"
              className="w-full bg-blue-900/20 border border-blue-500/30 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-blue-500/30 text-blue-100"
              value={formData.steam_appid_input}
              onChange={(e) =>
                setFormData({ ...formData, steam_appid_input: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              If provided, we'll automatically fetch the cover art, description,
              and details from Steam Store.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Add to Library
          </button>
        </form>
      </div>
    </div>
  );
}
