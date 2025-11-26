/**
 * Author: Libra
 * Date: 2025-10-02 00:59:31
 * LastEditors: Libra
 * Description: Premium LeetCode Problems Page
 */
"use client";

import { useEffect, useState, useMemo } from "react";
import { getProblems, getAllTags } from "@/lib/leetcode";
import { LeetCodeProblem, Difficulty } from "@/types/leetcode";
import { ProblemCard } from "@/components/leetcode/problem-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Code2, 
  RefreshCw, 
  Search, 
  Sparkles, 
  Layers, 
  Filter,
  Trophy,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Meteors } from "@/components/ui/meteors";

const difficultyOptions = [
  { value: "all", label: "全部", color: "bg-slate-500" },
  { value: "easy", label: "简单", color: "bg-emerald-500" },
  { value: "medium", label: "中等", color: "bg-amber-500" },
  { value: "hard", label: "困难", color: "bg-rose-500" },
];

export default function LeetCodePage() {
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

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
    setSearchQuery("");
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredProblems = useMemo(() => {
    if (!searchQuery) return problems;
    return problems.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.leetcode_id?.toString().includes(searchQuery) ?? false)
    );
  }, [problems, searchQuery]);

  const hasActiveFilters = difficulty !== "all" || selectedTags.length > 0 || searchQuery;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background selection:bg-amber-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-amber-500/20 opacity-20 blur-[100px]"></div>
      </div>
      
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Hero Section */}
        <div className="relative mb-12 flex flex-col items-center text-center md:mb-16">
          <Meteors number={20} className="absolute -top-10" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 backdrop-blur-sm dark:text-amber-400"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span className="tracking-wider uppercase">Algorithm Mastery</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl"
          >
            LeetCode <span className="text-amber-500">Hub</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 max-w-2xl text-muted-foreground md:text-lg"
          >
            精选算法题目集，助你掌握编程核心思维。
            <br className="hidden sm:block" />
            当前已收录 <span className="font-bold text-foreground"><NumberTicker value={totalCount} /></span> 道经典题目
          </motion.p>
        </div>

        {/* Controls Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="sticky top-4 z-40 mb-8 space-y-4 rounded-2xl border border-border/50 bg-background/80 p-4 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left: Search & Difficulty */}
            <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="搜索题目..." 
                  className="h-10 rounded-xl border-border/50 bg-muted/50 pl-9 pr-4 transition-all focus:bg-background focus:ring-amber-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
                {difficultyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDifficulty(option.value as Difficulty | "all")}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                      difficulty === option.value
                        ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {option.value !== 'all' && (
                      <span className={cn("h-1.5 w-1.5 rounded-full", option.color)} />
                    )}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Stats & Reset */}
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>{filteredProblems.length} 题</span>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span>{selectedTags.length} 标签</span>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  重置
                </Button>
              )}
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-2 pb-2 text-xs font-medium text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>按标签筛选</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn(
                      "cursor-pointer rounded-md px-2.5 py-1 text-xs transition-all hover:scale-105 active:scale-95",
                      selectedTags.includes(tag)
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-border/50 bg-background hover:border-amber-500/30 hover:bg-amber-500/5"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Problems Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-64 w-full flex-col items-center justify-center gap-4"
            >
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-amber-500"></div>
              <p className="text-sm text-muted-foreground animate-pulse">正在加载题目...</p>
            </motion.div>
          ) : filteredProblems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/50 bg-muted/10"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
                <Layers className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium">未找到相关题目</h3>
                <p className="text-sm text-muted-foreground">尝试调整筛选条件或搜索关键词</p>
              </div>
              <Button variant="outline" onClick={handleReset}>清除所有筛选</Button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredProblems.map((problem, index) => (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layoutId={problem.id.toString()}
                >
                  <ProblemCard problem={problem} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

