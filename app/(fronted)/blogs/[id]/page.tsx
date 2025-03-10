/**
 * Author: Libra
 * Date: 2025-03-07 21:15:30
 * LastEditors: Libra
 * Description: 博客详情页
 */
import { getBlogById } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BlogContent from "@/components/blog-content";
import { getSignedUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

const getCoverImage = async (cover_image: string) => {
  const url = await getSignedUrl(BUCKET_NAME, cover_image);
  return url?.signedUrl || "";
};

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;
  // 获取博客详情
  try {
    const blog = await getBlogById(parseInt(id));
    const coverImageUrl = await getCoverImage(blog.cover_image || "");

    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link href="/blogs">
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronLeft size={16} />
              返回博客列表
            </Button>
          </Link>
        </div>

        {/* 博客详情 */}
        <article className="bg-card border rounded-lg overflow-hidden shadow-md">
          {/* 封面图片 */}
          {blog.cover_image && (
            <div className="relative w-full h-64 sm:h-80 md:h-96">
              <Image
                src={coverImageUrl}
                alt={blog.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* 标题和元数据 */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {blog.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <time dateTime={blog.created_at}>
                  发布于 {formatDate(blog.created_at)}
                </time>
                {blog.updated_at !== blog.created_at && (
                  <time dateTime={blog.updated_at}>
                    更新于 {formatDate(blog.updated_at)}
                  </time>
                )}
              </div>
            </div>

            {/* 标签 */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blog.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* 内容 - 使用客户端博客内容组件 */}
            <BlogContent content={blog.content} />
          </div>
        </article>
      </div>
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return notFound();
  }
}
