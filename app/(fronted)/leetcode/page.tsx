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
    <div className="container mx-auto px-0 py-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="relative inline-block">
            <h2 className="title-gradient">算法刷题</h2>
          </div>
          <p className="text-lg text-muted-foreground">
            共 {totalCount} 道题目，配有算法动画演示
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12">
          <div className="relative">
            <div className="rounded-xl overflow-hidden shadow-md transition-all duration-500 border border-primary/10 bg-background/80 backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>

              <div className="pt-4 px-6 pb-3 relative z-10 border-b border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">筛选题目</h3>
                      <p className="text-sm text-muted-foreground">
                        选择难度和标签筛选题目
                      </p>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="flex items-center gap-1.5 rounded-full px-4 border-primary/20 hover:bg-primary/10"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>重置</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-6 relative z-10 space-y-6">
                {/* Difficulty Filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">难度</label>
                  <div className="flex flex-wrap gap-3">
                    {difficultyOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setDifficulty(option.value as Difficulty | "all")
                        }
                        className={cn(
                          "relative group animate-float",
                          "flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer transition-all duration-200",
                          "hover:shadow-md hover:scale-105",
                          difficulty === option.value
                            ? "bg-gradient-to-br from-amber-600/15 to-orange-600/15 border border-amber-600/30 shadow-sm shadow-amber-600/5"
                            : "bg-card hover:bg-accent/10 border border-transparent hover:border-amber-600/20"
                        )}
                      >
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div
                          className="w-3 h-3 rounded-full relative z-10"
                          style={{ backgroundColor: option.color }}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium relative z-10",
                            difficulty === option.value && "text-primary"
                          )}
                        >
                          {option.label}
                        </span>
                        {difficulty === option.value && (
                          <div className="absolute inset-0 rounded-xl ring-2 ring-amber-600/30 ring-offset-1 ring-offset-background/10"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                {allTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-3 block">
                      标签（可多选）
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag, idx) => (
                        <Badge
                          key={tag}
                          variant={
                            selectedTags.includes(tag) ? "default" : "outline"
                          }
                          className={cn(
                            "cursor-pointer transition-all duration-200 hover:scale-105 animate-float",
                            selectedTags.includes(tag)
                              ? "bg-amber-600 hover:bg-amber-700"
                              : "hover:bg-accent/10 hover:border-amber-600/20"
                          )}
                          style={{ animationDelay: `${(idx % 10) * 0.1}s` }}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 blur-xl"></div>
            <div className="absolute -top-3 -left-3 w-20 h-20 rounded-full bg-gradient-to-br from-orange-600/20 to-amber-600/20 blur-xl"></div>
          </div>
        </div>

        {/* Problems Grid */}
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        ) : problems.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Code2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xl text-muted-foreground mb-2">暂无题目</p>
            <p className="text-sm text-muted-foreground">请尝试调整筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {problems.map((problem, idx) => (
              <div
                key={problem.id}
                className="animate-float"
                style={{ animationDelay: `${(idx % 9) * 0.1}s` }}
              >
                <ProblemCard problem={problem} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
