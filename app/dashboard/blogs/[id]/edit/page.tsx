/**
 * Author: Libra
 * Date: 2025-03-07 17:53:30
 * LastEditors: Libra
 * Description:
 */
"use client";

import { BlogForm } from "@/components/blog-form";
import { getBlogById, updateBlog } from "@/lib/blog";
import { UpdateBlogInput } from "@/types/blog";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);

  useEffect(() => {
    loadBlog();
  }, []);

  const loadBlog = async () => {
    try {
      const data = await getBlogById(parseInt(id));
      setBlog(data);
    } catch (error) {
      console.error("加载博客失败:", error);
      router.push("/dashboard/blogs");
    }
  };

  const handleSubmit = async (data: Omit<UpdateBlogInput, "id">) => {
    try {
      await updateBlog(parseInt(id), data);
      router.push("/dashboard/blogs");
    } catch (error) {
      console.error("更新博客失败:", error);
    }
  };

  if (!blog) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">编辑博客</h1>
      <BlogForm initialData={blog} onSubmit={handleSubmit} />
    </div>
  );
}
