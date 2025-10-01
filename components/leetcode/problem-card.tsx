/**
 * Problem Card Component for LeetCode Problems
 */
"use client";

import Link from "next/link";
import { LeetCodeProblem } from "@/types/leetcode";
import { DifficultyBadge } from "./difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Code2 } from "lucide-react";
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

  return (
    <Link href={`/leetcode/${problem.id}`} className="block group">
      <MagicCard
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
        backgroundClassName="bg-card"
        className={cn("h-full w-full rounded-xl", className)}
      >
        <div className="flex flex-col p-3 h-full">
          {/* Icon Header */}
          <div className="relative w-full h-[120px] rounded-lg bg-gradient-to-br from-amber-600/10 via-orange-600/10 to-amber-400/10 flex items-center justify-center mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-orange-600/5 rounded-lg"></div>
            <Code2 className="w-16 h-16 text-amber-600 relative z-10" strokeWidth={1.5} />
            {problem.leetcode_id && (
              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                <span className="text-[10px] font-medium">#{problem.leetcode_id}</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-base my-1 font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {problem.title}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{problem.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                    {problem.description.replace(/[#*`\n]/g, " ").slice(0, 100)}...
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {problem.description.replace(/[#*`\n]/g, " ").slice(0, 200)}...
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Tags */}
            {problem.tags && problem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {problem.tags.slice(0, 2).map((tag, idx) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-2 py-0.5 h-5 font-medium",
                      "bg-gradient-to-r from-amber-600/15 to-orange-600/15",
                      "border border-amber-600/30",
                      "hover:from-amber-600/25 hover:to-orange-600/25",
                      "hover:border-amber-600/40 hover:scale-105",
                      "transition-all duration-200"
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
                {problem.tags.length > 2 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-2 py-0.5 h-5 font-medium",
                      "bg-gradient-to-r from-amber-600/15 to-orange-600/15",
                      "border border-amber-600/30"
                    )}
                  >
                    +{problem.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Complexity Info */}
            {(problem.time_complexity || problem.space_complexity) && (
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                {problem.time_complexity && (
                  <div className="flex items-center gap-1" title="时间复杂度">
                    <Clock className="w-3 h-3 opacity-70" />
                    <span className="text-[10px]">{problem.time_complexity}</span>
                  </div>
                )}
                {problem.space_complexity && (
                  <div className="flex items-center gap-1" title="空间复杂度">
                    <Zap className="w-3 h-3 opacity-70" />
                    <span className="text-[10px]">{problem.space_complexity}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}
