/**
 * Author: Libra
 * Date: 2025-10-02 01:04:08
 * LastEditTime: 2025-10-09 14:26:45
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

type HeaderStyle = {
  displayText: string;
  subText?: string;
};

// Color palette with HSL values for dynamic styling
const COLOR_PALETTE = [
  { name: "sky", h: 200, s: 80, l: 50 },
  { name: "blue", h: 217, s: 85, l: 55 },
  { name: "indigo", h: 239, s: 70, l: 58 },
  { name: "violet", h: 258, s: 75, l: 60 },
  { name: "purple", h: 276, s: 70, l: 58 },
  { name: "fuchsia", h: 292, s: 85, l: 60 },
  { name: "pink", h: 330, s: 80, l: 65 },
  { name: "rose", h: 351, s: 85, l: 60 },
  { name: "red", h: 0, s: 80, l: 55 },
  { name: "orange", h: 24, s: 90, l: 55 },
  { name: "amber", h: 38, s: 92, l: 50 },
  { name: "yellow", h: 48, s: 96, l: 55 },
  { name: "lime", h: 84, s: 85, l: 55 },
  { name: "green", h: 142, s: 70, l: 45 },
  { name: "emerald", h: 160, s: 80, l: 45 },
  { name: "teal", h: 173, s: 80, l: 45 },
  { name: "cyan", h: 189, s: 85, l: 50 },
];

// Generate a deterministic hash from string
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Extract the first character or number from title for display
const getDisplayChar = (title: string): string => {
  // Try to find first meaningful character (letter or number)
  const match = title.match(/[A-Z0-9]/i);
  return match ? match[0].toUpperCase() : "#";
};

// Generate unique header style based on problem ID and title
const generateUniqueHeaderStyle = (problem: LeetCodeProblem): HeaderStyle & {
  colors: {
    primary: { h: number; s: number; l: number };
    secondary: { h: number; s: number; l: number };
  };
  gradientDirection: string;
} => {
  // Combine ID and title for uniqueness
  const seed = `${problem.id}-${problem.title}`;
  const hash = hashString(seed);

  // Select two colors for gradient
  const colorIndex1 = hash % COLOR_PALETTE.length;
  const colorIndex2 = (hash + 7) % COLOR_PALETTE.length; // Use different offset for variety
  const primaryColor = COLOR_PALETTE[colorIndex1];
  const secondaryColor = COLOR_PALETTE[colorIndex2];

  // Select gradient direction
  const directions = ["135deg", "225deg", "45deg", "315deg"]; // br, bl, tr, tl
  const directionIndex = (hash >> 8) % directions.length;
  const gradientDirection = directions[directionIndex];

  // Use leetcode ID or first character of title
  const displayText = problem.leetcode_id
    ? `#${problem.leetcode_id}`
    : getDisplayChar(problem.title);

  // Use first tag as subtext
  const subText = problem.tags[0];

  return {
    displayText,
    subText,
    colors: {
      primary: { h: primaryColor.h, s: primaryColor.s, l: primaryColor.l },
      secondary: { h: secondaryColor.h, s: secondaryColor.s, l: secondaryColor.l },
    },
    gradientDirection,
  };
};

export function ProblemCard({ problem, className = "" }: ProblemCardProps) {
  const { theme } = useTheme();
  const headerStyle = generateUniqueHeaderStyle(problem);
  const { primary, secondary } = headerStyle.colors;

  // Helper function to create HSL color strings
  const hsl = (color: { h: number; s: number; l: number }, alpha?: number) => {
    return alpha !== undefined
      ? `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`
      : `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  };

  return (
    <Link href={`/leetcode/${problem.id}`} className="block group">
      <MagicCard
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
        backgroundClassName="bg-card"
        className={cn("h-full w-full rounded-xl", className)}
      >
        <div className="flex flex-col p-3 h-full">
          {/* Header */}
          <div
            className="relative w-full h-[140px] rounded-lg overflow-hidden flex items-center justify-center mb-3 transition-transform duration-300"
            style={{
              background: theme === "dark"
                ? `linear-gradient(${headerStyle.gradientDirection}, ${hsl(primary, 0.15)}, ${hsl(secondary, 0.1)}, transparent)`
                : `linear-gradient(${headerStyle.gradientDirection}, ${hsl(primary, 0.20)}, ${hsl(secondary, 0.1)}, transparent)`,
            }}
          >
            <div className="absolute inset-0 rounded-lg border border-border/40"></div>
            <div
              className="absolute -top-16 -right-10 h-32 w-32 rounded-full blur-3xl opacity-70"
              style={{
                backgroundColor: hsl(primary, 0.25),
              }}
            ></div>
            <div
              className="absolute -bottom-14 -left-12 h-28 w-28 rounded-full blur-3xl opacity-60"
              style={{
                backgroundColor: hsl(secondary, 0.25),
              }}
            ></div>
            <div className="relative z-10 flex flex-col items-center gap-3 px-3 w-full">
              {/* LeetCode Icon */}
              <div
                className="flex items-center justify-center w-14 h-14 rounded-lg backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-105 border"
                style={{
                  borderColor: hsl({ ...primary, l: primary.l - 10 }, 0.3),
                  backgroundColor: hsl(primary, 0.15),
                }}
              >
                <Code2
                  className="w-7 h-7"
                  strokeWidth={2}
                  style={{
                    color: theme === "dark"
                      ? hsl({ ...primary, l: 80 })
                      : hsl({ ...primary, l: 35 }),
                  }}
                />
              </div>
              {/* ID + Title in one line */}
              <h3
                className="text-sm font-bold text-center line-clamp-2 leading-tight px-2"
                style={{
                  color: theme === "dark"
                    ? hsl({ ...primary, l: 85 })
                    : hsl({ ...primary, l: 30 }),
                }}
              >
                <span
                  className="mr-2"
                  style={{
                    color: theme === "dark"
                      ? hsl({ ...primary, l: 75 })
                      : hsl({ ...primary, l: 40 }),
                  }}
                >
                  {headerStyle.displayText}
                </span>
                {problem.title}
              </h3>
            </div>
            <div className="absolute top-2 right-2">
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {problem.description.replace(/[#*`\n]/g, " ").slice(0, 150)}
                    ...
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {problem.description.replace(/[#*`\n]/g, " ").slice(0, 300)}
                    ...
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Tags */}
            {problem.tags && problem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {problem.tags.slice(0, 2).map((tag) => (
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
                    <span className="text-[10px]">
                      {problem.time_complexity}
                    </span>
                  </div>
                )}
                {problem.space_complexity && (
                  <div className="flex items-center gap-1" title="空间复杂度">
                    <Zap className="w-3 h-3 opacity-70" />
                    <span className="text-[10px]">
                      {problem.space_complexity}
                    </span>
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
