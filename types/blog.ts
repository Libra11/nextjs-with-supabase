export interface Blog {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published";
  cover_image?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface BlogWithTags extends Blog {
  tags: Tag[];
}

export interface CreateBlogInput {
  title: string;
  content: string;
  status: "draft" | "published";
  cover_image?: string;
  tags: number[]; // tag ids
}

export interface UpdateBlogInput extends Partial<CreateBlogInput> {
  id: number;
}
