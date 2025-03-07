/*
 * @Author: Libra
 * @Date: 2025-03-07 17:52:24
 * @LastEditors: Libra
 * @Description:
 */
import {
  BlogWithTags,
  CreateBlogInput,
  Tag,
  UpdateBlogInput,
} from "@/types/blog";

export async function getBlogs(): Promise<BlogWithTags[]> {
  const response = await fetch("/api/blogs");
  if (!response.ok) {
    throw new Error("获取博客列表失败");
  }
  return response.json();
}

export async function getBlogById(id: number): Promise<BlogWithTags> {
  const response = await fetch(`/api/blogs/${id}`);
  if (!response.ok) {
    throw new Error("获取博客详情失败");
  }
  return response.json();
}

export async function createBlog(data: CreateBlogInput): Promise<BlogWithTags> {
  const response = await fetch("/api/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("创建博客失败");
  }
  return response.json();
}

export async function updateBlog(
  id: number,
  data: Omit<UpdateBlogInput, "id">
): Promise<BlogWithTags> {
  const response = await fetch(`/api/blogs/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("更新博客失败");
  }
  return response.json();
}

export async function deleteBlog(id: number): Promise<void> {
  const response = await fetch(`/api/blogs/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("删除博客失败");
  }
}

export async function getTags(): Promise<Tag[]> {
  const response = await fetch("/api/tags");
  if (!response.ok) {
    throw new Error("获取标签列表失败");
  }
  return response.json();
}

export async function createTag(name: string): Promise<Tag> {
  const response = await fetch("/api/tags", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("创建标签失败");
  }
  return response.json();
}
