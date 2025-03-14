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

// 修改获取博客函数，支持分页
export async function getBlogs(
  page = 1,
  pageSize = 6,
  filters: { tagId?: number; status?: string } = {}
): Promise<{ blogs: BlogWithTags[]; count: number }> {
  let query = supabase.from("blogs").select(
    `
      *,
      tags (
        id,
        name,
        icon_name,
        color
      )
    `,
    { count: "exact" }
  );

  // 如果提供了标签 ID 进行筛选
  if (filters.tagId) {
    query = query.eq("tags.id", filters.tagId);
  }

  // 如果提供了状态进行筛选
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  // 计算分页的范围
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data: blogs,
    error,
    count,
  } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) {
    throw new Error("获取博客列表失败");
  }

  return { blogs: blogs || [], count: count || 0 };
}

export async function getBlogById(id: number): Promise<BlogWithTags> {
  const { data: blog, error } = await supabase
    .from("blogs")
    .select(
      `
      *,
      tags (
        id,
        name,
        icon_name,
        color
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
  const { title, description, content, status, cover_image, tags } = data;

  // 创建博客
  const { data: blog, error: blogError } = await supabase
    .from("blogs")
    .insert([
      {
        title,
        description,
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
  const { title, description, content, status, cover_image, tags } = data;

  // 更新博客
  const { data: blog, error: blogError } = await supabase
    .from("blogs")
    .update({
      title,
      description,
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

export async function createTag(
  name: string,
  color?: string,
  icon_name?: string
): Promise<Tag> {
  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const { data, error } = await supabase
    .from("tags")
    .insert([
      {
        name,
        color: color || "#6c757d", // 默认灰色
        icon_name: icon_name || "tag", // 默认图标
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error("创建标签失败");
  }

  return data;
}

export async function updateTag(
  id: number,
  name: string,
  color?: string,
  icon_name?: string
): Promise<Tag> {
  if (!id) {
    throw new Error("标签ID不能为空");
  }

  if (!name) {
    throw new Error("标签名称不能为空");
  }

  const { data, error } = await supabase
    .from("tags")
    .update({
      name,
      color: color || "#6c757d",
      icon_name: icon_name || "tag",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error("更新标签失败");
  }

  return data;
}

export async function deleteTag(id: number): Promise<void> {
  if (!id) {
    throw new Error("标签ID不能为空");
  }

  // 1. 首先检查标签是否被博客使用
  const { data: usedTags, error: checkError } = await supabase
    .from("blog_tags")
    .select("*")
    .eq("tag_id", id);

  if (checkError) {
    throw new Error("检查标签使用情况失败");
  }

  // 如果标签已被使用，先删除关联关系
  if (usedTags && usedTags.length > 0) {
    const { error: deleteRelError } = await supabase
      .from("blog_tags")
      .delete()
      .eq("tag_id", id);

    if (deleteRelError) {
      throw new Error("删除标签关联关系失败");
    }
  }

  // 2. 删除标签
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    throw new Error("删除标签失败");
  }
}

export async function incrementBlogViewCount(id: number) {
  const { data, error } = await supabase.rpc("increment_view_count_value", {
    row_id: id,
  }); // 调用函数，传入参数

  if (error) {
    console.error("更新失败:", error);
  } else {
    console.log("更新成功:", data);
  }
}

// 根据 id(tag_id) 获取最近的两篇博客，排除指定blogId
export async function getRecentBlogsByTagId(
  tagId: number,
  excludeBlogId?: number
): Promise<BlogWithTags[]> {
  // 先获取具有特定标签的博客ID
  const { data: blogTags, error: blogTagsError } = await supabase
    .from("blog_tags")
    .select("blog_id")
    .eq("tag_id", tagId);

  if (blogTagsError || !blogTags || blogTags.length === 0) {
    console.error("获取标签关联博客失败:", blogTagsError);
    return [];
  }

  // 获取博客ID数组
  const blogIds = blogTags.map((item) => item.blog_id);

  // 创建基础查询
  let query = supabase
    .from("blogs")
    .select(
      `
      *,
      tags (
        id,
        name,
        icon_name,
        color
      )
    `
    )
    .in("id", blogIds)
    .order("created_at", { ascending: false });

  // 如果有需要排除的博客ID，添加过滤条件
  if (excludeBlogId) {
    query = query.neq("id", excludeBlogId);
  }

  // 限制结果数量
  const { data: blogs, error } = await query.limit(2);

  if (error) {
    console.error("获取相关博客失败:", error);
    return [];
  }

  return blogs;
}
