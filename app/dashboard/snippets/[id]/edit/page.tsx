/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 编辑代码片段页面
 */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTags } from "@/lib/blog";
import { getSnippetById } from "@/lib/snippet";
import SnippetForm from "@/components/dashboard/snippet-form";

export const metadata: Metadata = {
  title: "编辑代码片段 | 管理控制台",
  description: "编辑现有的代码或命令片段",
};

export default async function EditSnippetPage({
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

  // 获取标签列表和当前片段
  const [tags, snippet] = await Promise.all([
    getTags(),
    getSnippetById(parseInt(id)),
  ]);

  // 提取当前片段的标签ID
  const currentTagIds = snippet.tags.map((tag) => tag.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">编辑代码片段</h1>
        <p className="text-muted-foreground">
          编辑现有的代码或命令片段，支持 Markdown 格式
        </p>
      </div>

      <SnippetForm
        tags={tags}
        snippet={snippet}
        selectedTags={currentTagIds}
        isEditing={true}
      />
    </div>
  );
}
