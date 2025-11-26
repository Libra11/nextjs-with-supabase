/*
 * @Author: Libra
 * @Date: 2025-09-16
 * @LastEditors: Libra
 * @Description: 知识卡片类型定义
 */

export interface HtmlCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HtmlDocument {
  id: number;
  title: string;
  content: string;
  category_id?: number;
  cover_image_url?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface HtmlDocumentWithCategory extends HtmlDocument {
  category?: HtmlCategory;
}

export interface CreateHtmlDocumentInput {
  title: string;
  content: string;
  category_id?: number;
  cover_image_url?: string;
}

export interface UpdateHtmlDocumentInput
  extends Partial<CreateHtmlDocumentInput> {
  id: number;
}

export interface CreateHtmlCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
}

export interface UpdateHtmlCategoryInput
  extends Partial<CreateHtmlCategoryInput> {
  id: number;
}

export interface HtmlDocumentFilters {
  category_id?: number;
  title?: string;
}

// 知识卡片统计数据类型
export interface HtmlDocumentStats {
  documentCount: number; // 卡片总数
  categoryCount: number; // 分类总数
  viewCount: number; // 总阅读量
}
