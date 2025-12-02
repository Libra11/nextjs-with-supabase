/**
 * Author: Libra
 * Date: 2025-12-02 10:19:44
 * LastEditTime: 2025-12-02 10:30:22
 * LastEditors: Libra
 * Description:
 */
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Game } from "@/types/games";
import { GameCard } from "@/components/games/game-card";
import {
  Search,
  SortAsc,
  Clock,
  Calendar,
  Monitor,
  Gamepad2,
  Loader2,
} from "lucide-react";

interface GameLibraryProps {
  initialGames: Game[];
}

type SortOption = "recent" | "playtime" | "name";
type FilterPlatform = "all" | "steam" | "local";

const ITEMS_PER_PAGE = 24;

export function GameLibrary({ initialGames }: GameLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all");

  // Pagination State
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

  const filteredAndSortedGames = useMemo(() => {
    let result = [...initialGames];

    // 1. Filter by Platform
    if (filterPlatform !== "all") {
      result = result.filter((game) => game.platform === filterPlatform);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((game) => game.name.toLowerCase().includes(query));
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "playtime":
          return b.total_playtime_minutes - a.total_playtime_minutes;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [initialGames, searchQuery, sortBy, filterPlatform]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [searchQuery, sortBy, filterPlatform]);

  // Infinite Scroll Handler
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting) {
      setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, []);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px", // Load 200px before reaching bottom
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver, filteredAndSortedGames.length]); // Re-bind if list changes significantly? Actually just handleObserver is enough.

  const visibleGames = filteredAndSortedGames.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedGames.length;

  return (
    <div className="space-y-8 w-full">
      {/* Toolbar */}
      <div className="sticky top-24 z-30 w-full rounded-2xl border border-white/10 bg-[#1e2024]/80 backdrop-blur-xl p-4 shadow-2xl transition-all">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-blue-500/50 focus:bg-black/60 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filters & Sort */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {/* Platform Filter */}
            <div className="flex items-center rounded-lg bg-black/40 p-1 border border-white/5">
              <button
                onClick={() => setFilterPlatform("all")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                  filterPlatform === "all"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                ALL
              </button>
              <button
                onClick={() => setFilterPlatform("steam")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterPlatform === "steam"
                    ? "bg-[#171a21] text-blue-400 shadow-sm ring-1 ring-white/5"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Gamepad2 size={12} /> STEAM
              </button>
              <button
                onClick={() => setFilterPlatform("local")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterPlatform === "local"
                    ? "bg-emerald-900/30 text-emerald-400 shadow-sm ring-1 ring-white/5"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Monitor size={12} /> LOCAL
              </button>
            </div>

            <div className="h-8 w-px bg-white/10" />

            {/* Sort Dropdown (simplified as buttons for now for better touch targets) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase hidden md:block">
                Sort By:
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSortBy("recent")}
                  className={`p-2 rounded-lg border transition-all ${sortBy === "recent" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-black/40 border-white/5 text-gray-500 hover:bg-white/5 hover:text-white"}`}
                  title="Recent"
                >
                  <Calendar size={18} />
                </button>
                <button
                  onClick={() => setSortBy("playtime")}
                  className={`p-2 rounded-lg border transition-all ${sortBy === "playtime" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-black/40 border-white/5 text-gray-500 hover:bg-white/5 hover:text-white"}`}
                  title="Playtime"
                >
                  <Clock size={18} />
                </button>
                <button
                  onClick={() => setSortBy("name")}
                  className={`p-2 rounded-lg border transition-all ${sortBy === "name" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-black/40 border-white/5 text-gray-500 hover:bg-white/5 hover:text-white"}`}
                  title="Name"
                >
                  <SortAsc size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between px-2 text-sm text-gray-500">
        <div>
          Showing{" "}
          <span className="text-white font-bold">{visibleGames.length}</span> of{" "}
          {filteredAndSortedGames.length} games
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6">
        {visibleGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Infinite Scroll Sentinel & Loader */}
      {hasMore && (
        <div ref={observerTarget} className="w-full flex justify-center py-8">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      )}

      {filteredAndSortedGames.length === 0 && (
        <div className="mt-20 text-center text-gray-500 py-20 rounded-3xl border border-dashed border-white/10 bg-white/5">
          <Search size={48} className="mx-auto mb-4 text-white/10" />
          <p className="text-lg font-medium text-white/40">
            No games found matching your search.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterPlatform("all");
            }}
            className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-bold uppercase tracking-wider"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
