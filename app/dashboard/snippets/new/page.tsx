/**
 * Author: Libra
 * Date: 2025-04-09
 * LastEditors: Libra
 * Description: 新建代码片段页面
 */
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTags } from "@/lib/blog";
import SnippetForm from "@/components/dashboard/snippet-form";

export const metadata: Metadata = {
  title: "新建代码片段 | 管理控制台",
  description: "创建新的代码或命令片段",
};

export default async function NewSnippetPage() {
  // 获取当前用户，确保已登录
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return redirect("/sign-in");
  }

  // 获取标签列表
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新建代码片段</h1>
        <p className="text-muted-foreground">
          创建新的代码或命令片段，支持 Markdown 格式
        </p>
      </div>

      <SnippetForm tags={tags} />
    </div>
  );
}
