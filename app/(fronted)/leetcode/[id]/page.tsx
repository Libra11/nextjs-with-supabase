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

        <div className="mb-10 lg:mb-14">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.tags &&
                problem.tags.length > 0 &&
                problem.tags.map((tag, idx) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-amber-500/10 bg-amber-500/5 text-amber-600/80 hover:bg-amber-500/10"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {tag}
                  </Badge>
                ))}
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {problem.leetcode_id ? (
                <span className="mr-4 font-mono text-muted-foreground/40">
                  #{problem.leetcode_id}
                </span>
              ) : null}
              <span className="bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                {problem.title}
              </span>
            </h1>

            {(problem.time_complexity || problem.space_complexity) && (
              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                {problem.time_complexity && (
                  <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-4 py-1.5 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-amber-500/80" />
                    <span>时间复杂度:</span>
                    <span className="font-medium text-foreground/80">
                      {problem.time_complexity}
                    </span>
                  </div>
                )}
                {problem.space_complexity && (
                  <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-4 py-1.5 backdrop-blur-sm">
                    <Zap className="h-4 w-4 text-amber-500/80" />
                    <span>空间复杂度:</span>
                    <span className="font-medium text-foreground/80">
                      {problem.space_complexity}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <Tabs defaultValue="description" className="w-full">
            <div className="border-b border-border/40 pb-px">
              <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
                <TabsTrigger
                  value="description"
                  className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-amber-500 data-[state=active]:text-amber-500 data-[state=active]:shadow-none"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>题目描述</span>
                  </div>
                </TabsTrigger>
                {problem.solution && (
                  <TabsTrigger
                    value="solution"
                    className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-amber-500 data-[state=active]:text-amber-500 data-[state=active]:shadow-none"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>题解</span>
                    </div>
                  </TabsTrigger>
                )}
                {problem.code && (
                  <TabsTrigger
                    value="code"
                    className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-amber-500 data-[state=active]:text-amber-500 data-[state=active]:shadow-none"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      <span>代码</span>
                    </div>
                  </TabsTrigger>
                )}
                {problem.animation_component && (
                  <TabsTrigger
                    value="animation"
                    className="relative rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-amber-500 data-[state=active]:text-amber-500 data-[state=active]:shadow-none"
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      <span>算法动画演示</span>
                    </div>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="description" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-sm md:p-8">
                <MarkdownContent content={problem.description} />
              </div>
            </TabsContent>

            {problem.solution && (
              <TabsContent value="solution" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-sm md:p-8">
                  <MarkdownContent content={problem.solution} />
                </div>
              </TabsContent>
            )}

            {problem.code && (
              <TabsContent value="code" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-sm md:p-8">
                  <MarkdownContent
                    content={`\`\`\`javascript\n${problem.code}\n\`\`\``}
                  />
                </div>
              </TabsContent>
            )}

            {problem.animation_component && (
              <TabsContent value="animation" className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-sm md:p-8">
                  <AnimationLoader name={problem.animation_component} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
