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
import { useEffect, useState } from "react";
import { BlogNav } from "@/components/blog-nav";

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);

  useEffect(() => {
    loadBlog();
  }, []);

  const loadBlog = async () => {
    try {
      const data = await getBlogById(parseInt(params.id));
      setBlog(data);
    } catch (error) {
      console.error("加载博客失败:", error);
      router.push("/dashboard/blogs");
    }
  };

  const handleSubmit = async (data: Omit<UpdateBlogInput, "id">) => {
    try {
      await updateBlog(parseInt(params.id), data);
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
      <BlogNav />
      <h1 className="text-2xl font-bold">编辑博客</h1>
      <BlogForm initialData={blog} onSubmit={handleSubmit} />
    </div>
  );
}
