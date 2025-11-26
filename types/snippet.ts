/*
 * @Author: Libra
 * @Date: 2025-04-09 18:19:33
 * @LastEditors: Libra
 * @Description:
 */
/*
 * @Author: Libra
 * @Date: 2025-04-09
 * @LastEditors: Libra
 * @Description: 代码片段类型
 */
import { Tag } from "./blog";

export interface Snippet {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SnippetWithTags extends Snippet {
  tags: Tag[];
}

export interface CreateSnippetInput {
  content: string;
  tags?: number[]; // tag ids
}

export interface UpdateSnippetInput {
  id: number;
  content?: string;
  tags?: number[];
}

export interface SnippetStats {
  snippetCount: number; // 片段总数
  tagCount: number; // 使用的标签数
}
