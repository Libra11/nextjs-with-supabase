/**
 * Author: Libra
 * Date: 2025-03-07 17:53:19
 * LastEditors: Libra
 * Description:
 */
"use client";

import { BlogForm } from "@/components/blog-form";
import { CreateBlogInput, UpdateBlogInput } from "@/types/blog";
import { createBlog } from "@/lib/blog";
import { useRouter } from "next/navigation";
import { BlogNav } from "@/components/blog-nav";

export default function NewBlogPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateBlogInput | UpdateBlogInput) => {
    try {
      await createBlog(data as CreateBlogInput);
      router.push("/dashboard/blogs");
    } catch (error) {
      console.error("创建博客失败:", error);
    }
  };

  return (
    <div className="space-y-6">
      <BlogNav />
      <h1 className="text-2xl font-bold">新建博客</h1>
      <BlogForm onSubmit={handleSubmit} />
    </div>
  );
}
