/*
 * @Author: Libra
 * @Date: 2025-04-09
 * @LastEditors: Libra
 * @Description: 代码片段管理
 */
import { createClient } from "@/utils/supabase/client";
import {
  Snippet,
  SnippetWithTags,
  CreateSnippetInput,
  UpdateSnippetInput,
  SnippetStats,
} from "@/types/snippet";
import { Tag } from "@/types/blog";

const supabase = createClient();

// 获取所有代码片段（支持分页和标签筛选）
export async function getSnippets(
  page = 1,
  pageSize = 20,
  filters: { tagId?: number; tagIds?: number[] } = {}
): Promise<{ snippets: SnippetWithTags[]; count: number }> {
  try {
    // 计算分页范围
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 构建基础查询
    let query = supabase.from("snippets").select(
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
      const { data: snippetTags } = await supabase
        .from("snippet_tags")
        .select("snippet_id")
        .in("tag_id", tagIds);

      if (snippetTags && snippetTags.length > 0) {
        const snippetIds = [
          ...new Set(snippetTags.map((item) => item.snippet_id)),
        ];
        query = query.in("id", snippetIds);
      } else {
        return { snippets: [], count: 0 };
      }
    }

    // 添加排序并执行查询
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("获取代码片段列表失败:", error);
      return { snippets: [], count: 0 };
    }

    return {
      snippets: data || [],
      count: count || 0,
    };
  } catch (error) {
    console.error("getSnippets 函数出错:", error);
    return { snippets: [], count: 0 };
  }
}

// 获取单个代码片段
export async function getSnippetById(id: number): Promise<SnippetWithTags> {
  const { data: snippet, error } = await supabase
    .from("snippets")
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
    throw new Error("获取代码片段详情失败");
  }

  return snippet;
}

// 创建代码片段
export async function createSnippet(
  data: CreateSnippetInput
): Promise<SnippetWithTags> {
  const { content, tags } = data;

  // 创建代码片段
  const { data: snippet, error: snippetError } = await supabase
    .from("snippets")
    .insert([
      {
        content,
      },
    ])
    .select()
    .single();

  if (snippetError) {
    console.log(snippetError);
    throw new Error("创建代码片段失败");
  }

  // 如果有标签，创建片段标签关联
  if (tags && tags.length > 0) {
    const snippetTags = tags.map((tagId: number) => ({
      snippet_id: snippet.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("snippet_tags")
      .insert(snippetTags);

    if (tagError) {
      throw new Error("创建片段标签关联失败");
    }
  }

  return snippet;
}

// 更新代码片段
export async function updateSnippet(
  id: number,
  data: Omit<UpdateSnippetInput, "id">
): Promise<SnippetWithTags> {
  const { content, tags } = data;

  // 更新代码片段
  const { data: snippet, error: snippetError } = await supabase
    .from("snippets")
    .update({
      content,
    })
    .eq("id", id)
    .select()
    .single();

  if (snippetError) {
    throw new Error("更新代码片段失败");
  }

  // 如果提供了标签信息，则更新标签关联
  if (tags !== undefined) {
    // 删除原有的标签关联
    const { error: deleteError } = await supabase
      .from("snippet_tags")
      .delete()
      .eq("snippet_id", id);

    if (deleteError) {
      throw new Error("删除原有标签关联失败");
    }

    // 创建新的标签关联
    if (tags && tags.length > 0) {
      const snippetTags = tags.map((tagId: number) => ({
        snippet_id: snippet.id,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("snippet_tags")
        .insert(snippetTags);

      if (tagError) {
        throw new Error("创建新标签关联失败");
      }
    }
  }

  return snippet;
}

// 删除代码片段
export async function deleteSnippet(id: number): Promise<void> {
  // 删除片段标签关联
  const { error: tagError } = await supabase
    .from("snippet_tags")
    .delete()
    .eq("snippet_id", id);

  if (tagError) {
    throw new Error("删除片段标签关联失败");
  }

  // 删除片段
  const { error: snippetError } = await supabase
    .from("snippets")
    .delete()
    .eq("id", id);

  if (snippetError) {
    throw new Error("删除代码片段失败");
  }
}

// 获取代码片段统计数据
export async function getSnippetStats(): Promise<SnippetStats> {
  try {
    // 获取片段总数
    const { count: snippetCount, error: snippetError } = await supabase
      .from("snippets")
      .select("*", { count: "exact", head: true });

    if (snippetError) {
      console.error("获取片段总数失败:", snippetError);
    }

    // 获取使用了片段的标签数量
    const { data: snippetTags, error: tagError } = await supabase
      .from("snippet_tags")
      .select("tag_id");

    if (tagError) {
      console.error("获取片段标签数量失败:", tagError);
    }

    // 计算使用的标签数量（去重）
    const uniqueTagIds = new Set(snippetTags?.map((item) => item.tag_id) || []);

    return {
      snippetCount: snippetCount || 0,
      tagCount: uniqueTagIds.size,
    };
  } catch (error) {
    console.error("获取片段统计数据失败:", error);
    return {
      snippetCount: 0,
      tagCount: 0,
    };
  }
}

// 通过标签ID获取相关代码片段
export async function getSnippetsByTagId(
  tagId: number
): Promise<SnippetWithTags[]> {
  try {
    // 获取包含该标签的代码片段ID
    const { data: snippetTags, error: snippetTagError } = await supabase
      .from("snippet_tags")
      .select("snippet_id")
      .eq("tag_id", tagId);

    if (snippetTagError || !snippetTags || snippetTags.length === 0) {
      return [];
    }

    const snippetIds = snippetTags.map((item) => item.snippet_id);

    // 获取这些代码片段的详细信息
    const { data: snippets, error: snippetsError } = await supabase
      .from("snippets")
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
      .in("id", snippetIds)
      .order("created_at", { ascending: false });

    if (snippetsError) {
      console.error("获取标签相关代码片段失败:", snippetsError);
      return [];
    }

    return snippets || [];
  } catch (error) {
    console.error("getSnippetsByTagId 函数出错:", error);
    return [];
  }
}
