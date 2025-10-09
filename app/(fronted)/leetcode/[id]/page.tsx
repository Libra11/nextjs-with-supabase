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
    <div className="container mx-auto px-0 py-0">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link href="/leetcode">
          <Button variant="ghost" className="mb-6 hover:bg-amber-600/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {problem.leetcode_id ? (
              <span className="text-amber-600 mr-3">#{problem.leetcode_id}</span>
            ) : null}
            {problem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.tags &&
              problem.tags.length > 0 &&
              problem.tags.map((tag, idx) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-amber-600/10 hover:bg-amber-600/20 border-amber-600/20"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {tag}
                </Badge>
              ))}
          </div>

          {(problem.time_complexity || problem.space_complexity) && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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

        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="flex-wrap justify-start gap-2 h-auto">
              <TabsTrigger
                value="description"
                className="flex items-center gap-2 px-4 py-2"
              >
                <FileText className="h-4 w-4" />
                <span>题目描述</span>
              </TabsTrigger>
              {problem.solution && (
                <TabsTrigger
                  value="solution"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>题解</span>
                </TabsTrigger>
              )}
              {problem.code && (
                <TabsTrigger
                  value="code"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Code2 className="h-4 w-4" />
                  <span>代码</span>
                </TabsTrigger>
              )}
              {problem.animation_component && (
                <TabsTrigger
                  value="animation"
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>算法动画演示</span>
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

            {problem.animation_component && (
              <TabsContent value="animation" className="mt-6">
                <div className="relative">
                  <div className="rounded-xl overflow-hidden shadow-md border border-primary/10 bg-background/80 backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-orange-600/5 to-amber-400/5"></div>
                    <div className="p-6 relative z-10">
                      <AnimationLoader name={problem.animation_component} />
                    </div>
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
