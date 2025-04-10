/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 代码片段瀑布流展示页面
 */
import { Metadata } from "next";
import { getSnippets } from "@/lib/snippet";
import { getTags } from "@/lib/blog";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import Link from "next/link";
import MarkdownContent from "@/components/markdown-content";
import { cn } from "@/lib/utils";
import {
  Tag as TagIcon,
  RefreshCw,
  Calendar,
  Clock,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagicCard } from "@/components/magicui/magic-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

export const metadata: Metadata = {
  title: "代码片段 | 个人博客",
  description: "代码片段和命令集合，帮助开发和学习",
};

export default async function SnippetsPage({
  searchParams,
}: {
  searchParams: { page?: string; tagId?: string };
}) {
  const { page: searchPage, tagId: searchTagId } = await searchParams;
  const page = searchPage ? parseInt(searchPage) : 1;
  const tagId = searchTagId ? parseInt(searchTagId) : undefined;

  // 获取所有片段和标签
  const { snippets, count } = await getSnippets(page, 30, {
    tagId: tagId,
  });
  const tags = await getTags();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">片段</h1>
        <p className="text-lg text-muted-foreground mb-8">
          收集的有用代码片段和命令，记录和分享
        </p>

        {/* 标签筛选 - 精美设计 */}
        <div className="mb-12">
          <div className="relative">
            <div className="rounded-xl overflow-hidden shadow-md transition-all duration-500 border border-primary/10 bg-background/80 backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-purple-400/5"></div>

              {/* 标签头部 */}
              <div className="pt-4 px-6 pb-3 relative z-10 border-b border-primary/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <TagIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium">按标签筛选</h3>
                      <p className="text-sm text-muted-foreground">
                        选择一个标签查看相关代码片段
                      </p>
                    </div>
                  </div>

                  {tagId && (
                    <Link href="/snippets">
                      <Button
                        variant="outline"
                        className="flex items-center gap-1.5 rounded-full px-4 border-primary/20 hover:bg-primary/10"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>查看全部</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* 标签网格 */}
              <div className="p-6 relative z-10">
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/snippets"
                    className={cn(
                      "relative group animate-float hover:animate-glow-pulse",
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                      "hover:shadow-md hover:scale-105",
                      !tagId
                        ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm shadow-purple-600/5"
                        : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                    )}
                    style={{ animationDelay: "0.1s" }}
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center gap-2">
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
                          "text-sm whitespace-nowrap transition-all duration-200",
                          !tagId && "text-primary font-medium"
                        )}
                      >
                        全部
                      </span>
                    </div>

                    {!tagId && (
                      <div className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"></div>
                    )}
                  </Link>

                  {tags.map((tag, idx) => (
                    <Link
                      key={tag.id}
                      href={`/snippets?tagId=${tag.id}`}
                      className={cn(
                        "relative group animate-float hover:animate-glow-pulse",
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                        "hover:shadow-md hover:scale-105",
                        tagId === tag.id
                          ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm shadow-purple-600/5"
                          : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                      )}
                      style={{
                        animationDelay: `${(idx % 5) * 0.2}s`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-md transition-opacity duration-300"></div>

                      <div className="relative z-10 flex items-center gap-2">
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
                            "text-sm whitespace-nowrap transition-all duration-200",
                            tagId === tag.id && "text-primary font-medium"
                          )}
                        >
                          {tag.name}
                        </span>
                      </div>

                      {/* Selected indicator */}
                      {tagId === tag.id && (
                        <div className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"></div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* 装饰性元素 */}
            <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-xl"></div>
            <div className="absolute -top-3 -left-3 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 blur-xl"></div>
          </div>
        </div>

        {/* 瀑布流显示 */}
        {snippets.length === 0 ? (
          <div className="text-center py-16 border rounded-lg">
            <p className="text-muted-foreground">暂无代码片段</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {snippets.map((snippet, idx) => (
              <div
                key={snippet.id}
                className="break-inside-avoid mb-6 overflow-hidden rounded-xl"
              >
                <MagicCard
                  className="w-full overflow-hidden"
                  gradientSize={250}
                  gradientFrom={snippet.tags[0]?.color || "#9E7AFF"}
                  gradientTo={snippet.tags[1]?.color || "#FE8BBB"}
                  gradientOpacity={0.15}
                  backgroundClassName="bg-card rounded-xl"
                >
                  <div className="p-5">
                    <div className="prose prose-sm max-w-none dark:prose-invert overflow-hidden">
                      <MarkdownContent content={snippet.content} />
                    </div>

                    {/* 查看全部按钮 */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 w-7 h-7 p-0 rounded-full opacity-70 hover:opacity-100 hover:bg-background/80 backdrop-blur-sm"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {snippet.tags.length > 0 &&
                              snippet.tags.map((tag) => (
                                <Link
                                  key={tag.id}
                                  href={`/snippets?tagId=${tag.id}`}
                                  className={cn(
                                    "relative group animate-float hover:animate-glow-pulse",
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                                    "hover:shadow-md hover:scale-105",
                                    tagId === tag.id
                                      ? "bg-gradient-to-br from-blue-600/15 to-purple-600/15 border border-purple-600/30 shadow-sm shadow-purple-600/5"
                                      : "bg-card hover:bg-accent/10 border border-transparent hover:border-purple-600/20"
                                  )}
                                  style={{
                                    animationDelay: `${(idx % 5) * 0.2}s`,
                                  }}
                                >
                                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                  {/* Glow effect on hover */}
                                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-600/10 to-purple-600/10 blur-md transition-opacity duration-300"></div>

                                  <div className="relative z-10 flex items-center gap-2">
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
                                        "text-sm whitespace-nowrap transition-all duration-200",
                                        tagId === tag.id &&
                                          "text-primary font-medium"
                                      )}
                                    >
                                      {tag.name}
                                    </span>
                                  </div>

                                  {/* Selected indicator */}
                                  {tagId === tag.id && (
                                    <div className="absolute inset-0 rounded-xl ring-2 ring-purple-600/30 ring-offset-1 ring-offset-background/10"></div>
                                  )}
                                </Link>
                              ))}
                          </DialogTitle>
                          <DialogDescription className="sr-only">
                            查看代码片段完整内容
                          </DialogDescription>
                        </DialogHeader>
                        <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
                          <MarkdownContent content={snippet.content} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-3 border-t">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                创建于{" "}
                                {new Date(
                                  snippet.created_at
                                ).toLocaleDateString("zh-CN")}
                              </span>
                            </div>
                            {snippet.updated_at &&
                              snippet.updated_at !== snippet.created_at && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    更新于{" "}
                                    {new Date(
                                      snippet.updated_at
                                    ).toLocaleDateString("zh-CN")}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* 将标签和日期信息整合在卡片底部 */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {snippet.tags.length > 0 &&
                          snippet.tags.map((tag) => (
                            <TagBadge
                              key={tag.id}
                              icon_name={tag.icon_name || "tag"}
                              color={tag.color || "#6c757d"}
                              iconOnly
                              className="w-4 h-4"
                            />
                          ))}
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div
                          className="flex items-center gap-1"
                          title="创建时间"
                        >
                          <Calendar className="w-3 h-3 opacity-70" />
                          <span className="text-[10px]">
                            {new Date(snippet.created_at).toLocaleDateString(
                              "zh-CN"
                            )}
                          </span>
                        </div>
                        {snippet.updated_at && (
                          <div
                            className="flex items-center gap-1"
                            title="更新时间"
                          >
                            <Clock className="w-3 h-3 opacity-70" />
                            <span className="text-[10px]">
                              {new Date(snippet.updated_at).toLocaleDateString(
                                "zh-CN"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </MagicCard>
              </div>
            ))}
          </div>
        )}

        {/* 分页控制 */}
        {count > 30 && (
          <div className="flex justify-center mt-12 space-x-2">
            {Array.from({ length: Math.ceil(count / 30) }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={`/snippets?page=${pageNum}${
                    tagId ? `&tagId=${tagId}` : ""
                  }`}
                >
                  <Badge
                    variant={pageNum === page ? "default" : "outline"}
                    className="cursor-pointer h-8 min-w-8 flex items-center justify-center"
                  >
                    {pageNum}
                  </Badge>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
