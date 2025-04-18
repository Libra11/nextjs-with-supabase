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
  BlogStats,
} from "@/types/blog";

const supabase = createClient();

// 搜索博客 - 通过关键词搜索标题和标签
export async function searchBlogs(keyword: string): Promise<BlogWithTags[]> {
  try {
    if (!keyword.trim()) {
      return [];
    }

    // 首先，按标题搜索
    const { data: blogsByTitle, error: titleError } = await supabase
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
      .ilike("title", `%${keyword}%`)
      .eq("status", "published")
      .order("is_top", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (titleError) {
      console.error("标题搜索失败:", titleError);
      return [];
    }

    // 然后，搜索标签
    const { data: tags, error: tagError } = await supabase
      .from("tags")
      .select("id, name")
      .ilike("name", `%${keyword}%`)
      .limit(10);

    if (tagError) {
      console.error("标签搜索失败:", tagError);
      return blogsByTitle || [];
    }

    // 如果没有匹配的标签，直接返回按标题搜索的结果
    if (!tags || tags.length === 0) {
      return blogsByTitle || [];
    }

    // 获取包含匹配标签的博客ID
    const tagIds = tags.map((tag) => tag.id);
    const { data: blogTags, error: blogTagsError } = await supabase
      .from("blog_tags")
      .select("blog_id")
      .in("tag_id", tagIds);

    if (blogTagsError || !blogTags || blogTags.length === 0) {
      return blogsByTitle || [];
    }

    // 提取博客ID并去重
    const blogIds = [...new Set(blogTags.map((item) => item.blog_id))];

    // 获取按标签匹配的博客
    const { data: blogsByTags, error: blogsError } = await supabase
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
      .eq("status", "published")
      .order("is_top", { ascending: false })
      .order("created_at", { ascending: false });

    if (blogsError) {
      console.error("获取标签相关博客失败:", blogsError);
      return blogsByTitle || [];
    }

    // 合并结果并去重
    const allBlogs = [...(blogsByTitle || []), ...(blogsByTags || [])];
    const uniqueBlogs = allBlogs.filter(
      (blog, index, self) => index === self.findIndex((b) => b.id === blog.id)
    );

    return uniqueBlogs;
  } catch (error) {
    console.error("搜索博客失败:", error);
    return [];
  }
}

// 获取博客统计数据：博客总数、标签总数、总阅读量、更新天数
export async function getBlogStats(): Promise<BlogStats> {
  try {
    // 获取博客总数
    const { count: blogCount, error: blogError } = await supabase
      .from("blogs")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    if (blogError) {
      console.error("获取博客总数失败:", blogError);
    }

    // 获取标签总数
    const { count: tagCount, error: tagError } = await supabase
      .from("tags")
      .select("*", { count: "exact", head: true });

    if (tagError) {
      console.error("获取标签总数失败:", tagError);
    }

    // 获取总阅读量
    const { data: viewData, error: viewError } = await supabase
      .from("blogs")
      .select("view_count")
      .eq("status", "published");

    if (viewError) {
      console.error("获取阅读量失败:", viewError);
    }

    const totalViews =
      viewData?.reduce((sum, blog) => sum + (blog.view_count || 0), 0) || 0;

    // 获取最早的博客创建日期，计算更新天数
    const { data: oldestBlog, error: dateError } = await supabase
      .from("blogs")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (dateError) {
      console.error("获取最早博客日期失败:", dateError);
    }

    let dayCount = 0;
    if (oldestBlog?.created_at) {
      const oldestDate = new Date(oldestBlog.created_at);
      const currentDate = new Date();
      dayCount =
        Math.floor(
          (currentDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
    }

    return {
      blogCount: blogCount || 0,
      tagCount: tagCount || 0,
      viewCount: totalViews,
      dayCount: dayCount,
    };
  } catch (error) {
    console.error("获取博客统计数据失败:", error);
    return {
      blogCount: 0,
      tagCount: 0,
      viewCount: 0,
      dayCount: 0,
    };
  }
}

// 修改获取博客函数，支持分页和多标签筛选
export async function getBlogs(
  page = 1,
  pageSize = 8,
  filters: {
    tagId?: number;
    tagIds?: number[];
    status?: string;
    title?: string;
  } = {}
): Promise<{ blogs: BlogWithTags[]; count: number }> {
  try {
    // 计算分页范围
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    // 构建基础查询
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

    // 处理标签筛选
    if (filters.tagId || (filters.tagIds && filters.tagIds.length > 0)) {
      const tagIds = filters.tagId ? [filters.tagId] : filters.tagIds || [];
      const { data: blogTags } = await supabase
        .from("blog_tags")
        .select("blog_id")
        .in("tag_id", tagIds);

      if (blogTags && blogTags.length > 0) {
        const blogIds = [...new Set(blogTags.map((item) => item.blog_id))];
        query = query.in("id", blogIds);
      } else {
        return { blogs: [], count: 0 };
      }
    }

    // 应用状态筛选
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // 应用标题筛选
    if (filters.title) {
      query = query.ilike("title", `%${filters.title}%`);
    }

    // 添加排序并执行查询
    const { data, count, error } = await query
      .order("is_top", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("获取博客列表失败:", error);
      return { blogs: [], count: 0 };
    }

    return {
      blogs: data || [],
      count: count || 0,
    };
  } catch (error) {
    console.error("getBlogs 函数出错:", error);
    return { blogs: [], count: 0 };
  }
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
  const { title, description, content, status, cover_image, tags, is_top } =
    data;

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
        is_top: is_top || false, // 默认不置顶
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
  const { title, description, content, status, cover_image, tags, is_top } =
    data;

  // 更新博客
  const { data: blog, error: blogError } = await supabase
    .from("blogs")
    .update({
      title,
      description,
      content,
      status,
      cover_image,
      is_top, // 更新置顶状态
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

// 后台管理系统使用的搜索博客功能
export async function searchBlogsAdmin(
  keyword: string,
  filters: {
    tagIds?: number[];
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{ blogs: BlogWithTags[]; count: number }> {
  try {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 构建基础查询
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

    // 应用关键词搜索 - 标题、描述或内容
    if (keyword && keyword.trim() !== "") {
      query = query.or(
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,content.ilike.%${keyword}%`
      );
    }

    // 处理标签筛选
    if (filters.tagIds && filters.tagIds.length > 0) {
      const { data: blogTags } = await supabase
        .from("blog_tags")
        .select("blog_id")
        .in("tag_id", filters.tagIds);

      if (blogTags && blogTags.length > 0) {
        const blogIds = [...new Set(blogTags.map((item) => item.blog_id))];
        query = query.in("id", blogIds);
      } else {
        return { blogs: [], count: 0 };
      }
    }

    // 应用状态筛选
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // 添加排序并执行查询
    const { data, count, error } = await query
      .order("is_top", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("搜索博客列表失败:", error);
      return { blogs: [], count: 0 };
    }

    return {
      blogs: data || [],
      count: count || 0,
    };
  } catch (error) {
    console.error("searchBlogsAdmin 函数出错:", error);
    return { blogs: [], count: 0 };
  }
}
