/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 代码片段列表组件
 */
"use client";

import { SnippetWithTags } from "@/types/snippet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import {
  Edit,
  Eye,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface SnippetListProps {
  snippets: SnippetWithTags[];
  currentPage: number;
  totalPages: number;
  tagId?: number;
}

export default function SnippetList({
  snippets,
  currentPage,
  totalPages,
  tagId,
}: SnippetListProps) {
  // 生成分页链接
  const getPageUrl = (page: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set("page", page.toString());
    if (tagId) {
      searchParams.set("tagId", tagId.toString());
    }
    return `/dashboard/snippets?${searchParams.toString()}`;
  };

  // 提取代码块内容的预览部分
  const getContentPreview = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  if (snippets.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <p className="text-muted-foreground">暂无代码片段</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {snippets.map((snippet) => (
          <Card key={snippet.id} className="overflow-hidden flex flex-col">
            <CardContent className="p-4 flex-1">
              <div className="h-[150px] overflow-hidden mb-4 bg-muted/50 rounded-md p-3">
                <pre className="text-xs overflow-hidden whitespace-pre-wrap break-words">
                  {getContentPreview(snippet.content)}
                </pre>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {snippet.tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    icon_name={tag.icon_name || "tag"}
                    color={tag.color || "#6c757d"}
                    name={tag.name}
                  />
                ))}
                {snippet.tags.length === 0 && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <TagIcon className="h-3 w-3 mr-1" />
                    无标签
                  </span>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t p-2 bg-muted/20 flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {new Date(snippet.created_at).toLocaleDateString("zh-CN")}
              </div>
              <div className="flex space-x-2">
                <Link href={`/dashboard/snippets/${snippet.id}`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/snippets/${snippet.id}/edit`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Link
            href={currentPage > 1 ? getPageUrl(currentPage - 1) : "#"}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          >
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一页
            </Button>
          </Link>
          <span className="flex items-center px-3 py-1 bg-muted rounded-md text-sm">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={currentPage < totalPages ? getPageUrl(currentPage + 1) : "#"}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          >
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
