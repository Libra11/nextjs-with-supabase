/*
 * @Author: Libra
 * @Date: 2025-03-07 18:29:17
 * @LastEditors: Libra
 * @Description:
 */
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: "获取博客列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { title, content, status, cover_image, tags } = await request.json();

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
      return NextResponse.json({ error: blogError.message }, { status: 500 });
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
        return NextResponse.json({ error: tagError.message }, { status: 500 });
      }
    }

    return NextResponse.json(blog);
  } catch (error) {
    return NextResponse.json({ error: "创建博客失败" }, { status: 500 });
  }
}
