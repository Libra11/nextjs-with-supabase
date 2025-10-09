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
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Zap,
  Code2,
  LayoutGrid,
  Hash,
  Type,
  Sigma,
  Grid3x3,
  GitBranch,
  Network,
  TrendingUp,
  Search,
  Sparkles,
  Brain,
  Flame,
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

type HeaderStyle = {
  icon: LucideIcon;
  label: string;
  background: string;
  glow: string;
  iconWrapper: string;
  iconColor: string;
  labelClass: string;
};

const CATEGORY_STYLES: Record<string, HeaderStyle> = {
  array: {
    icon: LayoutGrid,
    label: "数组",
    background:
      "bg-gradient-to-br from-sky-500/20 via-sky-400/10 to-transparent dark:from-sky-500/15 dark:via-sky-400/10 dark:to-transparent",
    glow: "bg-sky-500/25",
    iconWrapper: "border border-sky-400/30 bg-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-200",
    labelClass: "text-sky-600 dark:text-sky-200",
  },
  hash: {
    icon: Hash,
    label: "哈希表",
    background:
      "bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent dark:from-emerald-500/15 dark:via-emerald-400/10 dark:to-transparent",
    glow: "bg-emerald-500/25",
    iconWrapper: "border border-emerald-400/30 bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-200",
    labelClass: "text-emerald-600 dark:text-emerald-200",
  },
  string: {
    icon: Type,
    label: "字符串",
    background:
      "bg-gradient-to-br from-fuchsia-500/20 via-fuchsia-400/10 to-transparent dark:from-fuchsia-500/15 dark:via-fuchsia-400/10 dark:to-transparent",
    glow: "bg-fuchsia-500/25",
    iconWrapper: "border border-fuchsia-400/30 bg-fuchsia-500/15",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-200",
    labelClass: "text-fuchsia-600 dark:text-fuchsia-200",
  },
  math: {
    icon: Sigma,
    label: "数学",
    background:
      "bg-gradient-to-br from-amber-500/25 via-amber-400/15 to-transparent dark:from-amber-500/20 dark:via-amber-400/10 dark:to-transparent",
    glow: "bg-amber-500/25",
    iconWrapper: "border border-amber-400/30 bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-200",
    labelClass: "text-amber-600 dark:text-amber-200",
  },
  dp: {
    icon: Grid3x3,
    label: "动态规划",
    background:
      "bg-gradient-to-br from-indigo-500/20 via-indigo-400/10 to-transparent dark:from-indigo-500/15 dark:via-indigo-400/10 dark:to-transparent",
    glow: "bg-indigo-500/25",
    iconWrapper: "border border-indigo-400/30 bg-indigo-500/15",
    iconColor: "text-indigo-500 dark:text-indigo-200",
    labelClass: "text-indigo-500 dark:text-indigo-200",
  },
  tree: {
    icon: GitBranch,
    label: "树",
    background:
      "bg-gradient-to-br from-lime-500/20 via-lime-400/10 to-transparent dark:from-lime-500/15 dark:via-lime-400/10 dark:to-transparent",
    glow: "bg-lime-500/25",
    iconWrapper: "border border-lime-400/30 bg-lime-500/15",
    iconColor: "text-lime-600 dark:text-lime-200",
    labelClass: "text-lime-600 dark:text-lime-200",
  },
  graph: {
    icon: Network,
    label: "图论",
    background:
      "bg-gradient-to-br from-cyan-500/20 via-cyan-400/10 to-transparent dark:from-cyan-500/15 dark:via-cyan-400/10 dark:to-transparent",
    glow: "bg-cyan-500/25",
    iconWrapper: "border border-cyan-400/30 bg-cyan-500/15",
    iconColor: "text-cyan-600 dark:text-cyan-200",
    labelClass: "text-cyan-600 dark:text-cyan-200",
  },
  greedy: {
    icon: TrendingUp,
    label: "贪心",
    background:
      "bg-gradient-to-br from-orange-500/25 via-orange-400/10 to-transparent dark:from-orange-500/20 dark:via-orange-400/10 dark:to-transparent",
    glow: "bg-orange-500/25",
    iconWrapper: "border border-orange-400/30 bg-orange-500/15",
    iconColor: "text-orange-500 dark:text-orange-200",
    labelClass: "text-orange-500 dark:text-orange-200",
  },
  search: {
    icon: Search,
    label: "搜索",
    background:
      "bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent dark:from-purple-500/15 dark:via-purple-400/10 dark:to-transparent",
    glow: "bg-purple-500/25",
    iconWrapper: "border border-purple-400/30 bg-purple-500/15",
    iconColor: "text-purple-500 dark:text-purple-200",
    labelClass: "text-purple-500 dark:text-purple-200",
  },
};

const DIFFICULTY_STYLES: Record<LeetCodeProblem["difficulty"], HeaderStyle> = {
  easy: {
    icon: Sparkles,
    label: "简单",
    background:
      "bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent dark:from-emerald-500/15 dark:via-emerald-400/10 dark:to-transparent",
    glow: "bg-emerald-500/25",
    iconWrapper: "border border-emerald-400/30 bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-200",
    labelClass: "text-emerald-600 dark:text-emerald-200",
  },
  medium: {
    icon: Brain,
    label: "中等",
    background:
      "bg-gradient-to-br from-sky-500/20 via-sky-400/10 to-transparent dark:from-sky-500/15 dark:via-sky-400/10 dark:to-transparent",
    glow: "bg-sky-500/25",
    iconWrapper: "border border-sky-400/30 bg-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-200",
    labelClass: "text-sky-600 dark:text-sky-200",
  },
  hard: {
    icon: Flame,
    label: "困难",
    background:
      "bg-gradient-to-br from-rose-500/20 via-rose-400/10 to-transparent dark:from-rose-500/15 dark:via-rose-400/10 dark:to-transparent",
    glow: "bg-rose-500/25",
    iconWrapper: "border border-rose-400/30 bg-rose-500/15",
    iconColor: "text-rose-600 dark:text-rose-200",
    labelClass: "text-rose-500 dark:text-rose-200",
  },
};

const DEFAULT_HEADER_STYLE: HeaderStyle = {
  icon: Code2,
  label: "算法",
  background:
    "bg-gradient-to-br from-amber-500/20 via-orange-400/10 to-transparent dark:from-amber-500/15 dark:via-orange-400/10 dark:to-transparent",
  glow: "bg-amber-500/25",
  iconWrapper: "border border-amber-400/30 bg-amber-500/15",
  iconColor: "text-amber-600 dark:text-amber-200",
  labelClass: "text-amber-600 dark:text-amber-200",
};

const CATEGORY_KEYWORDS: Array<{
  category: keyof typeof CATEGORY_STYLES;
  keywords: string[];
}> = [
  {
    category: "array",
    keywords: ["array", "matrix", "two pointers", "sliding window", "数组", "矩阵", "双指针", "滑动窗口"],
  },
  {
    category: "hash",
    keywords: ["hash", "map", "dictionary", "set", "哈希", "哈希表", "字典", "集合"],
  },
  {
    category: "string",
    keywords: ["string", "palindrome", "anagram", "字符串", "回文", "异位词", "子串"],
  },
  {
    category: "math",
    keywords: ["math", "number", "bit", "geometry", "数学", "数字", "位运算", "几何"],
  },
  {
    category: "dp",
    keywords: ["dp", "dynamic", "memorization", "memoization", "动态规划", "记忆化"],
  },
  {
    category: "tree",
    keywords: ["tree", "binary", "bst", "树", "二叉", "二叉树", "二叉搜索树"],
  },
  {
    category: "graph",
    keywords: ["graph", "bfs", "dfs", "topological", "图", "图论", "广度优先", "深度优先", "拓扑"],
  },
  {
    category: "greedy",
    keywords: ["greedy", "interval", "sweep", "贪心", "区间", "扫描线"],
  },
  {
    category: "search",
    keywords: ["search", "backtracking", "combination", "搜索", "回溯", "组合", "枚举"],
  },
];

const getHeaderStyle = (problem: LeetCodeProblem): HeaderStyle => {
  const tags = problem.tags.map((tag) => tag.toLowerCase());

  for (const matcher of CATEGORY_KEYWORDS) {
    if (
      tags.some((tag) =>
        matcher.keywords.some((keyword) => tag.includes(keyword))
      )
    ) {
      const style = CATEGORY_STYLES[matcher.category];
      if (style) {
        return style;
      }
    }
  }

  return DIFFICULTY_STYLES[problem.difficulty] ?? DEFAULT_HEADER_STYLE;
};

export function ProblemCard({ problem, className = "" }: ProblemCardProps) {
  const { theme } = useTheme();
  const headerStyle = getHeaderStyle(problem);
  const Icon = headerStyle.icon;
  const fallbackDifficultyLabel =
    DIFFICULTY_STYLES[problem.difficulty]?.label ?? DEFAULT_HEADER_STYLE.label;
  const headerLabel = headerStyle.label || problem.tags[0] || fallbackDifficultyLabel;

  return (
    <Link href={`/leetcode/${problem.id}`} className="block group">
      <MagicCard
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
        backgroundClassName="bg-card"
        className={cn("h-full w-full rounded-xl", className)}
      >
        <div className="flex flex-col p-3 h-full">
          {/* Icon Header */}
          <div
            className={cn(
              "relative w-full h-[120px] rounded-lg overflow-hidden flex items-center justify-center mb-3 transition-transform duration-300",
              headerStyle.background
            )}
          >
            <div className="absolute inset-0 rounded-lg border border-border/40"></div>
            <div
              className={cn(
                "absolute -top-16 -right-10 h-32 w-32 rounded-full blur-3xl opacity-70",
                headerStyle.glow
              )}
            ></div>
            <div
              className={cn(
                "absolute -bottom-14 -left-12 h-28 w-28 rounded-full blur-3xl opacity-60",
                headerStyle.glow
              )}
            ></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={cn(
                  "p-4 rounded-full backdrop-blur-md shadow-sm transition-transform duration-300 group-hover:scale-105",
                  headerStyle.iconWrapper
                )}
              >
                <Icon
                  className={cn("w-10 h-10", headerStyle.iconColor)}
                  strokeWidth={1.5}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-[0.2em]",
                  headerStyle.labelClass
                )}
              >
                {headerLabel}
              </span>
            </div>
            {problem.leetcode_id && (
              <div className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm border border-border/40 text-xs px-2 py-0.5 rounded-md">
                <span className="text-[10px] font-medium text-foreground">
                  #{problem.leetcode_id}
                </span>
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
                    {problem.description.replace(/[#*`\n]/g, " ").slice(0, 100)}
                    ...
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {problem.description.replace(/[#*`\n]/g, " ").slice(0, 200)}
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
