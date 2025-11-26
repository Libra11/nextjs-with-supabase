/**
 * Author: Libra
 * Date: 2025-10-02 00:49:50
 * LastEditors: Libra
 * Description:
 */
/**
 * LeetCode Problem Detail Page
 */
import { getProblemById } from "@/lib/leetcode";
import { DifficultyBadge } from "@/components/leetcode/difficulty-badge";
import { AnimationLoader } from "@/components/leetcode/animations";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownContent from "@/components/markdown-content";
import {
  Clock,
  Zap,
  ArrowLeft,
  Code2,
  FileText,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProblemDetailPage({ params }: PageProps) {
  const { id } = await params;
  const problemId = parseInt(id);

  if (isNaN(problemId)) {
    notFound();
  }

  const problem = await getProblemById(problemId);

  if (!problem) {
    notFound();
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.08),_transparent_55%)]" />
      <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8 lg:py-10">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link href="/leetcode">
            <Button
              variant="ghost"
              className="group gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>返回题目列表</span>
            </Button>
          </Link>
        </div>

        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-3 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-600">
                LeetCode 题目
              </div>
              <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                {problem.leetcode_id ? (
                  <span className="mr-3 text-amber-600">#{problem.leetcode_id}</span>
                ) : null}
                {problem.title}
              </h1>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <DifficultyBadge difficulty={problem.difficulty} />
                {problem.tags &&
                  problem.tags.length > 0 &&
                  problem.tags.map((tag, idx) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="border-amber-600/20 bg-amber-600/10 hover:bg-amber-600/20"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      {tag}
                    </Badge>
                  ))}
              </div>

              {(problem.time_complexity || problem.space_complexity) && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground md:text-sm">
                  {problem.time_complexity && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>时间复杂度:</span>
                      <span className="font-medium text-foreground">
                        {problem.time_complexity}
                      </span>
                    </div>
                  )}
                  {problem.space_complexity && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" />
                      <span>空间复杂度:</span>
                      <span className="font-medium text-foreground">
                        {problem.space_complexity}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full max-w-xs lg:max-w-sm">
              <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-950/95 via-slate-950/80 to-amber-950/60 p-4 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-amber-300" />
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-100/80">
                      刷题进阶
                    </p>
                  </div>
                  <Badge className="border border-amber-500/40 bg-amber-500/20 text-amber-100">
                    {problem.leetcode_id ? `#${problem.leetcode_id}` : "LeetCode"}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-amber-200/70">
                      难度
                    </p>
                    <p className="text-sm font-semibold text-amber-100">
                      {problem.difficulty}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wide text-amber-200/70">
                      标签数
                    </p>
                    <p className="text-sm font-semibold text-amber-100">
                      {problem.tags?.length ?? 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-100/80">
                  <PlayCircle className="h-3.5 w-3.5" />
                  <span>
                    通过阅读题解与动画演示，系统梳理本题的思路与实现。
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-xl border bg-muted/60 p-1 backdrop-blur">
              <TabsTrigger
                value="description"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                <span>题目描述</span>
              </TabsTrigger>
              {problem.solution && (
                <TabsTrigger
                  value="solution"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>题解</span>
                </TabsTrigger>
              )}
              {problem.code && (
                <TabsTrigger
                  value="code"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <Code2 className="h-4 w-4" />
                  <span>代码</span>
                </TabsTrigger>
              )}
              {problem.animation_component && (
                <TabsTrigger
                  value="animation"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>算法动画演示</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 shadow-md backdrop-blur">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5" />
                <div className="relative z-10 p-6 md:p-8">
                  <MarkdownContent content={problem.description} />
                </div>
              </div>
            </TabsContent>

            {problem.solution && (
              <TabsContent value="solution" className="mt-6">
                <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 shadow-md backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5" />
                  <div className="relative z-10 p-6 md:p-8">
                    <MarkdownContent content={problem.solution} />
                  </div>
                </div>
              </TabsContent>
            )}

            {problem.code && (
              <TabsContent value="code" className="mt-6">
                <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 shadow-md backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5" />
                  <div className="relative z-10 p-6 md:p-8">
                    <MarkdownContent
                      content={`\`\`\`javascript\n${problem.code}\n\`\`\``}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {problem.animation_component && (
              <TabsContent value="animation" className="mt-6">
                <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-background/80 shadow-md backdrop-blur">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5" />
                  <div className="relative z-10 p-6 md:p-8">
                    <AnimationLoader name={problem.animation_component} />
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
