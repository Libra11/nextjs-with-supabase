/**
 * Author: Libra
 * Date: 2025-10-02 01:04:08
 * LastEditTime: 2025-11-26 15:30:25
 * LastEditors: Libra
 * Description:
 */
/**
 * Problem Card Component for LeetCode Problems
 */
"use client";

import Link from "next/link";
import { LeetCodeProblem } from "@/types/leetcode";
import { DifficultyBadge } from "./difficulty-badge";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Zap,
  BookOpen,
  PlayCircle,
  FileText,
} from "lucide-react";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProblemCardProps {
  problem: LeetCodeProblem;
  className?: string;
}

export function ProblemCard({ problem, className = "" }: ProblemCardProps) {
  const { theme } = useTheme();

  // Difficulty-based color for the MagicCard gradient
  const difficultyColor =
    problem.difficulty === "easy"
      ? theme === "dark"
        ? "#10b981" // emerald-500
        : "#059669" // emerald-600
      : problem.difficulty === "medium"
        ? theme === "dark"
          ? "#f59e0b" // amber-500
          : "#d97706" // amber-600
        : theme === "dark"
          ? "#f43f5e" // rose-500
          : "#e11d48"; // rose-600

  return (
    <Link href={`/leetcode/${problem.id}`} className="block group h-full">
      <MagicCard
        gradientColor={difficultyColor}
        backgroundClassName="bg-card"
        className={cn(
          "h-full w-full rounded-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]",
          className
        )}
      >
        <div className="flex flex-col h-full min-h-[260px] p-5">
          {/* Top Row: ID & Difficulty */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground border border-border/50">
              #{problem.leetcode_id || problem.id}
            </span>
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {problem.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed mb-6 flex-1">
            {problem.description.replace(/[#*`\n]/g, " ").slice(0, 120)}...
          </p>

          {/* Footer: Stats & Tags */}
          <div className="pt-4 border-t border-border/50 space-y-3">
            {/* Complexity Stats */}
            {(problem.time_complexity || problem.space_complexity) && (
              <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                {problem.time_complexity && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{problem.time_complexity}</span>
                  </div>
                )}
                {problem.space_complexity && (
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{problem.space_complexity}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags & Icons Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 overflow-hidden h-6">
                {problem.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground border border-border/50 whitespace-nowrap">
                    {tag}
                  </span>
                ))}
                {problem.tags && problem.tags.length > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/50 text-secondary-foreground border border-border/50">
                    +{problem.tags.length - 2}
                  </span>
                )}
              </div>

              {/* Icons */}
              <div className="flex items-center gap-2 text-muted-foreground/50">
                {problem.solution && <BookOpen className="w-3.5 h-3.5" />}
                {problem.code && <FileText className="w-3.5 h-3.5" />}
                {problem.animation_component && <PlayCircle className="w-3.5 h-3.5 text-primary" />}
              </div>
            </div>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}
