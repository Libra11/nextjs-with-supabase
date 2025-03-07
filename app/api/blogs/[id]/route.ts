import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

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
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!blog) {
      return NextResponse.json({ error: "博客不存在" }, { status: 404 });
    }

    return NextResponse.json(blog);
  } catch (error) {
    return NextResponse.json({ error: "获取博客详情失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { title, content, status, cover_image, tags } = await request.json();

    // 更新博客
    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .update({
        title,
        content,
        status,
        cover_image,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (blogError) {
      return NextResponse.json({ error: blogError.message }, { status: 500 });
    }

    // 删除原有的标签关联
    const { error: deleteError } = await supabase
      .from("blog_tags")
      .delete()
      .eq("blog_id", params.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
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
        return NextResponse.json({ error: tagError.message }, { status: 500 });
      }
    }

    return NextResponse.json(blog);
  } catch (error) {
    return NextResponse.json({ error: "更新博客失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 删除博客标签关联
    const { error: tagError } = await supabase
      .from("blog_tags")
      .delete()
      .eq("blog_id", params.id);

    if (tagError) {
      return NextResponse.json({ error: tagError.message }, { status: 500 });
    }

    // 删除博客
    const { error: blogError } = await supabase
      .from("blogs")
      .delete()
      .eq("id", params.id);

    if (blogError) {
      return NextResponse.json({ error: blogError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "博客删除成功" });
  } catch (error) {
    return NextResponse.json({ error: "删除博客失败" }, { status: 500 });
  }
}
