/**
 * Author: Libra
 * Date: 2025-10-02 00:59:31
 * LastEditors: Libra
 * Description:
 */
/**
 * LeetCode Problems List Page
 */
"use client";

import { useEffect, useState } from "react";
import { getProblems, getAllTags } from "@/lib/leetcode";
import { LeetCodeProblem, Difficulty } from "@/types/leetcode";
import { ProblemCard } from "@/components/leetcode/problem-card";
import { Badge } from "@/components/ui/badge";
import { Code2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const difficultyOptions = [
  { value: "all", label: "全部", color: "#6c757d" },
  { value: "easy", label: "简单", color: "#22c55e" },
  { value: "medium", label: "中等", color: "#eab308" },
  { value: "hard", label: "困难", color: "#ef4444" },
];

export default function LeetCodePage() {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadProblems();
    loadTags();
  }, [difficulty, selectedTags]);

  const loadTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (error) {
      console.error("加载标签失败:", error);
    }
  };

  const loadProblems = async () => {
    try {
      setLoading(true);
      const options = {
        page: 1,
        pageSize: 100,
        difficulty: difficulty !== "all" ? difficulty : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };
      const data = await getProblems(options);
      setProblems(data.problems);
      setTotalCount(data.count);
    } catch (error) {
      console.error("加载题目列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDifficulty("all");
    setSelectedTags([]);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters = difficulty !== "all" || selectedTags.length > 0;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.08),_transparent_55%)]" />
      <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-4 lg:mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-600">
                LeetCode 刷题
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-600">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                    算法刷题
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    共 {totalCount} 道题目，支持按难度与标签筛选
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-50">
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                {hasActiveFilters ? "已开启筛选" : "全部题目"}
              </span>
              <span className="text-[11px] text-amber-100/80">
                {hasActiveFilters
                  ? "仅展示符合条件的题目"
                  : "推荐先按目标难度集中刷题"}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Difficulty Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-2">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setDifficulty(option.value as Difficulty | "all")
                    }
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:text-sm transition-colors",
                      difficulty === option.value
                        ? "border-amber-500 bg-amber-500/10 text-amber-600"
                        : "border-transparent text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/5"
                    )}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>重置筛选</span>
              </Button>
            )}
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {allTags.map((tag, idx) => (
                <Badge
                  key={tag}
                  variant={
                    selectedTags.includes(tag) ? "default" : "outline"
                  }
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-amber-600 text-amber-50 hover:bg-amber-700"
                      : "hover:border-amber-600/40 hover:bg-amber-500/5"
                  )}
                  style={{ animationDelay: `${(idx % 10) * 0.1}s` }}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Problems Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-amber-600"></div>
          </div>
        ) : problems.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Code2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mb-2 text-xl text-muted-foreground">暂无题目</p>
            <p className="text-sm text-muted-foreground">请尝试调整筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
