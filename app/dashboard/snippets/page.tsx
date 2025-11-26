/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 代码片段管理页面
 */
import { Metadata } from "next";
import { getSnippets, getSnippetStats } from "@/lib/snippet";
import { getTags } from "@/lib/blog";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileCode,
  Tag as TagIcon,
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import SnippetList from "@/components/dashboard/snippet-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "代码片段 | 管理控制台",
  description: "管理您的代码片段和命令集合",
};

export default async function SnippetsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tagId?: string }>;
}) {
  // 获取当前用户，确保已登录
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return redirect("/sign-in");
  }

  // 获取页码和标签过滤参数
  const { page: searchPage, tagId: searchTagId } = await searchParams;
  const page = searchPage ? parseInt(searchPage) : 1;
  const tagId = searchTagId ? parseInt(searchTagId) : undefined;

  // 获取片段和标签数据
  const { snippets, count } = await getSnippets(page, 12, {
    tagId: tagId,
  });
  const tags = await getTags();
  const snippetStats = await getSnippetStats();

  // 计算总页数
  const totalPages = Math.ceil(count / 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">代码片段管理</h1>
          <p className="text-muted-foreground">
            管理和组织您的代码片段和命令集合
          </p>
        </div>
        <Link href="/dashboard/snippets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> 新建片段
          </Button>
        </Link>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileCode className="h-4 w-4 mr-2 text-primary" />
              片段总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {snippetStats.snippetCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TagIcon className="h-4 w-4 mr-2 text-primary" />
              使用的标签
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snippetStats.tagCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签选择区域 - 精美设计 */}
      <div className="mb-8">
        <div className="relative">
          <div className="rounded-xl overflow-hidden shadow-md border border-primary/10 bg-background/80 backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-purple-400/5"></div>

            {/* 标签头部 */}
            <div className="pt-4 px-6 pb-3 relative z-10 border-b border-primary/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <TagIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">标签筛选</h3>
                    <p className="text-xs text-muted-foreground">
                      选择一个标签查看相关片段
                    </p>
                  </div>
                </div>

                {tagId && (
                  <Link href="/dashboard/snippets">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1.5 h-8 rounded-full border-primary/20 hover:bg-primary/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>重置筛选</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* 标签网格 */}
            <div className="p-4 relative z-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                <Link
                  href="/dashboard/snippets"
                  className={cn(
                    "relative group animate-float hover:animate-glow-pulse",
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:shadow-md hover:scale-105",
                    !tagId
                      ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm"
                      : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                  )}
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center gap-1.5">
                    <TagBadge
                      icon_name="tag"
                      color="#6c757d"
                      iconOnly
                      className={cn(
                        "w-5 h-5 border-0 bg-transparent transition-transform duration-300",
                        !tagId && "scale-110"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm whitespace-nowrap",
                        !tagId && "text-primary font-medium"
                      )}
                    >
                      全部片段
                    </span>
                  </div>

                  {!tagId && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"></div>
                  )}
                </Link>

                {tags.map((tag, idx) => (
                  <Link
                    key={tag.id}
                    href={`/dashboard/snippets?tagId=${tag.id}`}
                    className={cn(
                      "relative group animate-float hover:animate-glow-pulse",
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200",
                      "hover:shadow-md hover:scale-105",
                      tagId === tag.id
                        ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm"
                        : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                    )}
                    style={{
                      animationDelay: `${(idx % 5) * 0.2}s`,
                    }}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center gap-1.5">
                      <TagBadge
                        icon_name={tag.icon_name || "tag"}
                        color={tag.color || "#6c757d"}
                        iconOnly
                        className={cn(
                          "w-5 h-5 border-0 bg-transparent transition-transform duration-300",
                          tagId === tag.id && "scale-110"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]",
                          tagId === tag.id && "text-primary font-medium"
                        )}
                      >
                        {tag.name}
                      </span>
                    </div>

                    {tagId === tag.id && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"></div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 装饰性元素 */}
          <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-xl"></div>
          <div className="absolute -top-2 -left-2 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 blur-xl"></div>
        </div>
      </div>

      {/* 片段列表 */}
      <div className="bg-muted/30 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-600" />
            {tagId
              ? `${tags.find((t) => t.id === tagId)?.name || ""} 标签下的片段`
              : "全部代码片段"}
          </h2>
          <div className="text-sm text-muted-foreground">共 {count} 个片段</div>
        </div>

        <SnippetList
          snippets={snippets}
          currentPage={page}
          totalPages={totalPages}
          tagId={tagId}
        />
      </div>
    </div>
  );
}
