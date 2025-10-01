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
import { Clock, Zap, ArrowLeft, Code2, FileText, BookOpen } from "lucide-react";
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
    <div className="container mx-auto px-0 py-0">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link href="/leetcode">
          <Button variant="ghost" className="mb-6 hover:bg-amber-600/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>

        {/* Header Card */}
        <div className="mb-8 relative">
          <div className="rounded-xl overflow-hidden shadow-lg border border-primary/10 bg-background/80 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>

            <div className="p-8 relative z-10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {problem.leetcode_id && (
                      <div className="px-3 py-1 rounded-full bg-amber-600/10 border border-amber-600/20">
                        <span className="text-sm font-medium text-amber-600">
                          #{problem.leetcode_id}
                        </span>
                      </div>
                    )}
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  <h1 className="text-4xl font-bold mb-4">{problem.title}</h1>

                  {/* Tags */}
                  {problem.tags && problem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {problem.tags.map((tag, idx) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="animate-float bg-amber-600/10 hover:bg-amber-600/20 border-amber-600/20"
                          style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Complexity Info */}
                  {(problem.time_complexity || problem.space_complexity) && (
                    <div className="flex gap-6 text-sm">
                      {problem.time_complexity && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/60 border border-border/50">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-muted-foreground">时间:</span>
                          <span className="font-medium">
                            {problem.time_complexity}
                          </span>
                        </div>
                      )}
                      {problem.space_complexity && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/60 border border-border/50">
                          <Zap className="h-4 w-4 text-amber-600" />
                          <span className="text-muted-foreground">空间:</span>
                          <span className="font-medium">
                            {problem.space_complexity}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-3 -right-3 w-32 h-32 rounded-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 blur-2xl"></div>
          <div className="absolute -top-3 -left-3 w-24 h-24 rounded-full bg-gradient-to-br from-orange-600/20 to-amber-600/20 blur-2xl"></div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Description & Solution */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-muted/50">
                <TabsTrigger
                  value="description"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>题目描述</span>
                </TabsTrigger>
                {problem.solution && (
                  <TabsTrigger
                    value="solution"
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>题解</span>
                  </TabsTrigger>
                )}
                {problem.code && (
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    <span>代码</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <div className="relative">
                  <div className="rounded-xl overflow-hidden shadow-md border border-primary/10 bg-background/80 backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>
                    <div className="p-6 relative z-10">
                      <MarkdownContent content={problem.description} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {problem.solution && (
                <TabsContent value="solution" className="mt-6">
                  <div className="relative">
                    <div className="rounded-xl overflow-hidden shadow-md border border-primary/10 bg-background/80 backdrop-blur-md">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>
                      <div className="p-6 relative z-10">
                        <MarkdownContent content={problem.solution} />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {problem.code && (
                <TabsContent value="code" className="mt-6">
                  <div className="relative">
                    <div className="rounded-xl overflow-hidden shadow-md border border-primary/10 bg-background/80 backdrop-blur-md">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>
                      <div className="p-6 relative z-10">
                        <MarkdownContent
                          content={`\`\`\`javascript\n${problem.code}\n\`\`\``}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Right: Animation */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="relative">
                <div className="rounded-xl overflow-hidden shadow-md border border-primary/10 bg-background/80 backdrop-blur-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>

                  <div className="p-4 border-b border-border/30 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold">算法动画演示</h2>
                    </div>
                  </div>

                  <div className="p-4 relative z-10">
                    <AnimationLoader name={problem.animation_component} />
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
