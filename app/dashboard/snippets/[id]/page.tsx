/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 代码片段详情页面
 */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSnippetById } from "@/lib/snippet";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/ui/tag-badge";
import MarkdownContent from "@/components/markdown-content";
import DeleteButton from "./delete-button";

export const metadata: Metadata = {
  title: "代码片段详情 | 管理控制台",
  description: "查看代码片段详情",
};

export default async function SnippetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 获取当前用户，确保已登录
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return redirect("/sign-in");
  }

  const { id } = await params;

  const snippet = await getSnippetById(parseInt(id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/snippets">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">代码片段详情</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/snippets/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </Link>
          <DeleteButton id={id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 侧边信息 */}
        <div className="md:col-span-1 space-y-4">
          <div className="border rounded-lg p-4 bg-card">
            <h2 className="text-sm font-medium mb-2">创建时间</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(snippet.created_at).toLocaleString("zh-CN")}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h2 className="text-sm font-medium mb-2">最后更新</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(snippet.updated_at).toLocaleString("zh-CN")}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <h2 className="text-sm font-medium mb-2">标签</h2>
            <div className="flex flex-wrap gap-2">
              {snippet.tags.length > 0 ? (
                snippet.tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    icon_name={tag.icon_name || "tag"}
                    color={tag.color || "#6c757d"}
                    name={tag.name}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">暂无标签</p>
              )}
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="md:col-span-3">
          <div className="border rounded-lg p-6 bg-card h-full">
            <MarkdownContent content={snippet.content} />
          </div>
        </div>
      </div>
    </div>
  );
}
