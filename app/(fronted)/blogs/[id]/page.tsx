/**
 * Author: Libra
 * Date: 2025-03-07 21:15:30
 * LastEditors: Libra
 * Description: 博客详情页
 */
import { getBlogById, incrementBlogViewCount } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Eye,
  Calendar,
  RefreshCw,
  Tag as TagIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BlogContent from "@/components/blog-content";
import { getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { TagBadge } from "@/components/ui/tag-badge";

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

const getCoverImage = async (cover_image: string) => {
  const url = await getPublicUrl(BUCKET_NAME, cover_image);
  return url || "";
};

// 技能图标列表，用于处理不存在的图标
const SKILL_ICONS = [
  "prisma",
  "supabase",
  "nextjs",
  "tailwindcss",
  "typescript",
  "webpack",
  "React",
  "Vue",
  "docker",
  "electron",
  "git",
  "http",
  "javascript",
  "nestjs",
  "Nodejs",
  "PostgreSQL",
  "CSS",
  "Figma",
  "HTML",
];

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;

  try {
    const blog = await getBlogById(parseInt(id));
    const coverImageUrl = blog.cover_image
      ? await getCoverImage(blog.cover_image)
      : "";

    // 增加博客观看次数
    await incrementBlogViewCount(parseInt(id));

    return (
      <div className="min-h-screen w-[1200px] mx-auto">
        {/* 顶部内容 */}
        <h1 className="mb-4 drop-shadow-lg">{blog.title}</h1>
        <div className="flex justify-between items-center mb-8">
          {/* 元数据显示 */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center text-sm text-muted-foreground bg-primary/5 rounded-full px-4 py-2">
              <Calendar className="mr-2 h-4 w-4" />
              <time dateTime={blog.created_at}>
                发布于 {formatDate(blog.created_at)}
              </time>
            </div>

            <div className="flex items-center text-sm text-muted-foreground bg-primary/5 rounded-full px-4 py-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              <time dateTime={blog.updated_at}>
                更新于 {formatDate(blog.updated_at)}
              </time>
            </div>

            <div className="flex items-center text-sm text-muted-foreground bg-primary/5 rounded-full px-4 py-2">
              <Eye className="mr-2 h-4 w-4" />
              <span>阅读 {blog.view_count}</span>
            </div>
          </div>
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {blog.tags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  icon_name={tag.icon_name || ""}
                  color={tag.color || ""}
                />
              ))}
            </div>
          )}
        </div>
        <div className="w-full">
          {/* 封面图作为背景 */}
          {coverImageUrl && (
            <div className="w-full">
              <Image
                src={coverImageUrl}
                alt={blog.title}
                width={1200}
                height={600}
                priority
              />
              <div className="bg-gradient-to-r from-primary/40 to-secondary/40 mix-blend-multiply"></div>
            </div>
          )}
        </div>

        {/* 主内容区域 */}
        <div className="mt-6">
          {/* 返回按钮 - 悬浮在左上角 */}
          <div className="absolute -top-16 left-4 z-40">
            <Link href="/blogs">
              <Button
                variant="secondary"
                size="sm"
                className="group rounded-full shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300"
              >
                <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                返回
              </Button>
            </Link>
          </div>

          {/* 博客卡片 */}
          <article className="overflow-hidden">
            <div>
              {/* 博客内容 */}
              <div className="mt-8">
                <BlogContent content={blog.content} />
              </div>

              {/* 博客底部 */}
              <div className="mt-16 pt-6 border-t border-primary/10">
                {/* 作者信息卡片 */}
                <div className="bg-primary/5 rounded-2xl p-6 mb-8 transition-transform duration-300 hover:scale-[1.01] hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-gradient-to-br from-primary to-secondary h-16 w-16 flex items-center justify-center text-white text-xl font-bold">
                      {"L"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Libra</h3>
                      <p className="text-sm text-muted-foreground">博客作者</p>
                    </div>
                  </div>
                  <p className="mt-4 text-muted-foreground">
                    感谢您阅读我的文章。如果您喜欢这篇文章，请考虑分享或关注我的更多内容。
                  </p>
                </div>

                {/* 相关推荐 */}
                <h3 className="text-2xl font-bold mb-4">您可能还喜欢</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="group p-4 rounded-xl border border-primary/10 bg-card/50 hover:bg-primary/5 transition-all duration-300 hover:shadow-md"
                    >
                      <h4 className="font-semibold group-hover:text-primary transition-colors">
                        相关文章标题 {i}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        这是相关文章的简短描述...
                      </p>
                    </div>
                  ))}
                </div>

                {/* 回到列表 */}
                <div className="text-center">
                  <Link href="/blogs">
                    <Button
                      variant="default"
                      className="rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 px-8"
                    >
                      浏览更多文章
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return notFound();
  }
}
