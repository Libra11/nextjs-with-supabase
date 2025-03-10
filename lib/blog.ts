/*
 * @Author: Libra
 * @Date: 2025-03-07 17:52:24
 * @LastEditors: Libra
 * @Description:
 */
import { createClient } from "@/utils/supabase/client";
import {
  BlogWithTags,
  CreateBlogInput,
  Tag,
  UpdateBlogInput,
} from "@/types/blog";

const supabase = createClient();

export async function getBlogs(): Promise<BlogWithTags[]> {
  const { data: blogs, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      tags (
        id,
        name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("获取博客列表失败");
  }

  return blogs;
}

export async function getBlogById(id: number): Promise<BlogWithTags> {
  const { data: blog, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      tags (
        id,
        name
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("获取博客详情失败");
  }

  return blog;
}

export async function createBlog(data: CreateBlogInput): Promise<BlogWithTags> {
  const { title, content, status, cover_image, tags } = data;

  // 创建博客
  const { data: blog, error: blogError } = await supabase
    .from("blogs")
    .insert([
      {
        title,
        content,
        status,
        cover_image,
      },
    ])
    .select()
    .single();

  if (blogError) {
    console.log(blogError);
    throw new Error("创建博客失败");
  }

  // 如果有标签，创建博客标签关联
  if (tags && tags.length > 0) {
    const blogTags = tags.map((tagId: number) => ({
      blog_id: blog.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("blog_tags")
      .insert(blogTags);

    if (tagError) {
      throw new Error("创建博客标签关联失败");
    }
  }

  return blog;
}

export async function updateBlog(
  id: number,
  data: Omit<UpdateBlogInput, "id">
): Promise<BlogWithTags> {
  const { title, content, status, cover_image, tags } = data;

  // 更新博客
  const { data: blog, error: blogError } = await supabase
    .from("blogs")
    .update({
      title,
      content,
      status,
      cover_image,
    })
    .eq("id", id)
    .select()
    .single();

  if (blogError) {
    throw new Error("更新博客失败");
  }

  // 删除原有的标签关联
  const { error: deleteError } = await supabase
    .from("blog_tags")
    .delete()
    .eq("blog_id", id);

  if (deleteError) {
    throw new Error("删除原有标签关联失败");
  }

  // 创建新的标签关联
  if (tags && tags.length > 0) {
    const blogTags = tags.map((tagId: number) => ({
      blog_id: blog.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("blog_tags")
      .insert(blogTags);

    if (tagError) {
      throw new Error("创建新标签关联失败");
    }
  }

  return blog;
}

export async function deleteBlog(id: number): Promise<void> {
  // 删除博客标签关联
  const { error: tagError } = await supabase
    .from("blog_tags")
    .delete()
    .eq("blog_id", id);

  if (tagError) {
    throw new Error("删除博客标签关联失败");
  }

  // 删除博客
  const { error: blogError } = await supabase
    .from("blogs")
    .delete()
    .eq("id", id);

  if (blogError) {
    throw new Error("删除博客失败");
  }
}

export async function getTags(): Promise<Tag[]> {
  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("获取标签列表失败");
  }

  return tags;
}

export async function createTag(name: string): Promise<Tag> {
  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const { data, error } = await supabase
    .from("tags")
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    throw new Error("创建标签失败");
  }

  return data;
}
