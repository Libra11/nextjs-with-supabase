/*
 * @Author: Libra
 * @Date: 2025-03-07 17:52:02
 * @LastEditors: Libra
 * @Description: 博客类型
 */
export interface Blog {
  id: number;
  title: string;
  description: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published";
  cover_image?: string;
  view_count: number;
  is_top: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  icon_name?: string;
  created_at?: string;
}

export interface BlogWithTags extends Blog {
  tags: Tag[];
}

export interface CreateBlogInput {
  title: string;
  description: string;
  content: string;
  status: "draft" | "published";
  cover_image?: string;
  tags: number[]; // tag ids
  is_top?: boolean;
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: number;
}
