/*
 * @Author: Libra
 * @Date: 2025-03-07 18:29:01
 * @LastEditors: Libra
 * @Description:
 */
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json({ error: "获取标签失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tags")
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}
