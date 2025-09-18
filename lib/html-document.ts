/*
 * @Author: Libra
 * @Date: 2025-09-16
 * @LastEditors: Libra
 * @Description: HTML文档数据访问层
 */

import { createClient } from "@/utils/supabase/client";
import {
  HtmlDocument,
  HtmlDocumentWithCategory,
  HtmlCategory,
  CreateHtmlDocumentInput,
  UpdateHtmlDocumentInput,
  CreateHtmlCategoryInput,
  UpdateHtmlCategoryInput,
  HtmlDocumentFilters,
  HtmlDocumentStats,
} from "@/types/html-document";

const supabase = createClient();

// ====================== HTML文档 CRUD ======================

// 获取HTML文档列表（支持分页和筛选）
export async function getHtmlDocuments(
  page = 1,
  pageSize = 8,
  filters: HtmlDocumentFilters = {}
): Promise<{ documents: HtmlDocumentWithCategory[]; count: number }> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("html_documents")
      .select(
        `
        *,
        category:html_categories(*)
      `,
        { count: "exact" }
      );

    // 应用筛选条件
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.title) {
      query = query.ilike("title", `%${filters.title}%`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("获取HTML文档列表失败:", error);
      return { documents: [], count: 0 };
    }

    return {
      documents: data || [],
      count: count || 0,
    };
  } catch (error) {
    console.error("getHtmlDocuments 函数出错:", error);
    return { documents: [], count: 0 };
  }
}

// 根据ID获取HTML文档
export async function getHtmlDocumentById(id: number): Promise<HtmlDocumentWithCategory | null> {
  try {
    const { data, error } = await supabase
      .from("html_documents")
      .select(
        `
        *,
        category:html_categories(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("获取HTML文档详情失败:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("getHtmlDocumentById 函数出错:", error);
    return null;
  }
}

// 创建HTML文档
export async function createHtmlDocument(data: CreateHtmlDocumentInput): Promise<HtmlDocument | null> {
  try {
    const { data: document, error } = await supabase
      .from("html_documents")
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error("创建HTML文档失败:", error);
      return null;
    }

    return document;
  } catch (error) {
    console.error("createHtmlDocument 函数出错:", error);
    return null;
  }
}

// 更新HTML文档
export async function updateHtmlDocument(
  id: number,
  data: Omit<UpdateHtmlDocumentInput, "id">
): Promise<HtmlDocument | null> {
  try {
    const { data: document, error } = await supabase
      .from("html_documents")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("更新HTML文档失败:", error);
      return null;
    }

    return document;
  } catch (error) {
    console.error("updateHtmlDocument 函数出错:", error);
    return null;
  }
}

// 删除HTML文档
export async function deleteHtmlDocument(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("html_documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("删除HTML文档失败:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("deleteHtmlDocument 函数出错:", error);
    return false;
  }
}

// 增加HTML文档浏览量
export async function incrementHtmlDocumentViewCount(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("increment_html_document_view_count", {
      doc_id: id,
    });

    if (error) {
      console.error("更新HTML文档浏览量失败:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("incrementHtmlDocumentViewCount 函数出错:", error);
    return false;
  }
}

// 搜索HTML文档
export async function searchHtmlDocuments(keyword: string): Promise<HtmlDocumentWithCategory[]> {
  try {
    if (!keyword.trim()) {
      return [];
    }

    const { data, error } = await supabase
      .from("html_documents")
      .select(
        `
        *,
        category:html_categories(*)
      `
      )
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("搜索HTML文档失败:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("searchHtmlDocuments 函数出错:", error);
    return [];
  }
}

// ====================== HTML分类 CRUD ======================

// 获取所有HTML分类
export async function getHtmlCategories(): Promise<HtmlCategory[]> {
  try {
    const { data, error } = await supabase
      .from("html_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("获取HTML分类列表失败:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("getHtmlCategories 函数出错:", error);
    return [];
  }
}

// 根据ID获取HTML分类
export async function getHtmlCategoryById(id: number): Promise<HtmlCategory | null> {
  try {
    const { data, error } = await supabase
      .from("html_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("获取HTML分类详情失败:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("getHtmlCategoryById 函数出错:", error);
    return null;
  }
}

// 创建HTML分类
export async function createHtmlCategory(data: CreateHtmlCategoryInput): Promise<HtmlCategory | null> {
  try {
    const { data: category, error } = await supabase
      .from("html_categories")
      .insert([
        {
          ...data,
          color: data.color || "#6c757d",
          sort_order: data.sort_order || 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("创建HTML分类失败:", error);
      return null;
    }

    return category;
  } catch (error) {
    console.error("createHtmlCategory 函数出错:", error);
    return null;
  }
}

// 更新HTML分类
export async function updateHtmlCategory(
  id: number,
  data: Omit<UpdateHtmlCategoryInput, "id">
): Promise<HtmlCategory | null> {
  try {
    const { data: category, error } = await supabase
      .from("html_categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("更新HTML分类失败:", error);
      return null;
    }

    return category;
  } catch (error) {
    console.error("updateHtmlCategory 函数出错:", error);
    return null;
  }
}

// 删除HTML分类
export async function deleteHtmlCategory(id: number): Promise<boolean> {
  try {
    // 先检查是否有文档使用该分类
    const { data: documents, error: checkError } = await supabase
      .from("html_documents")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (checkError) {
      console.error("检查分类使用情况失败:", checkError);
      return false;
    }

    if (documents && documents.length > 0) {
      console.error("该分类正在被使用，无法删除");
      return false;
    }

    const { error } = await supabase
      .from("html_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("删除HTML分类失败:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("deleteHtmlCategory 函数出错:", error);
    return false;
  }
}

// ====================== 统计功能 ======================

// 获取HTML文档统计数据
export async function getHtmlDocumentStats(): Promise<HtmlDocumentStats> {
  try {
    // 获取文档总数
    const { count: documentCount, error: docError } = await supabase
      .from("html_documents")
      .select("*", { count: "exact", head: true });

    if (docError) {
      console.error("获取文档总数失败:", docError);
    }

    // 获取分类总数
    const { count: categoryCount, error: catError } = await supabase
      .from("html_categories")
      .select("*", { count: "exact", head: true });

    if (catError) {
      console.error("获取分类总数失败:", catError);
    }

    // 获取总浏览量
    const { data: viewData, error: viewError } = await supabase
      .from("html_documents")
      .select("view_count");

    if (viewError) {
      console.error("获取浏览量失败:", viewError);
    }

    const totalViews = viewData?.reduce((sum, doc) => sum + (doc.view_count || 0), 0) || 0;

    return {
      documentCount: documentCount || 0,
      categoryCount: categoryCount || 0,
      viewCount: totalViews,
    };
  } catch (error) {
    console.error("getHtmlDocumentStats 函数出错:", error);
    return {
      documentCount: 0,
      categoryCount: 0,
      viewCount: 0,
    };
  }
}