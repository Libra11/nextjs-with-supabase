/**
 * Author: Libra
 * Date: 2025-03-07 21:15:30
 * LastEditors: Libra
 * Description: 博客详情页
 */
import {
  getBlogById,
  getRecentBlogsByTagId,
  incrementBlogViewCount,
} from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Eye,
  Calendar,
  RefreshCw,
  Clock,
  BookOpenText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BlogContent from "@/components/blog-content";
import { getPublicUrl } from "@/lib/bucket";
import { BUCKET_NAME } from "@/const";
import { TagBadge } from "@/components/ui/tag-badge";
import readingTime from "reading-time";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

const getCoverImage = async (cover_image: string) => {
  const url = await getPublicUrl(BUCKET_NAME, cover_image);
  return url || "";
};

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params;
  let readTime = "";
  let wordCount = 0;
  let coverImageUrl = "";

  try {
    const blog = await getBlogById(parseInt(id));
    const recentBlogs = await getRecentBlogsByTagId(
      blog.tags[0].id,
      parseInt(id)
    );
    coverImageUrl = blog.cover_image
      ? await getCoverImage(blog.cover_image)
      : "";
    const stats = readingTime(blog.content);
    readTime = stats.text;
    wordCount = stats.words;

    // 增加博客观看次数
    await incrementBlogViewCount(parseInt(id));

    return (
      <div>
        {/* 顶部内容 */}
        <h1 className="relative mb-4 w-fit group">
          <span className="relative z-10 inline-block px-6 py-3 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:scale-110">
            {blog.title}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm group-hover:blur-md transition-all duration-300"></span>
          <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          <span className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </h1>
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
            <div className="flex items-center text-sm text-muted-foreground bg-primary/5 rounded-full px-4 py-2">
              <Clock className="mr-2 h-4 w-4" />
              <span> {readTime}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground bg-primary/5 rounded-full px-4 py-2">
              <BookOpenText className="mr-2 h-4 w-4" />
              <span>字数 {wordCount}</span>
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
          <div className="w-full rounded-md overflow-hidden h-[500px] relative">
            <Image
              src={coverImageUrl}
              alt={blog.title}
              fill
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAL/xAAeEAABBAIDAQAAAAAAAAAAAAABAAIDBBESMTNBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGBEBAQADAAAAAAAAAAAAAAAAAAECERL/2gAMAwEAAhEDEQA/AJVx9rI6nBBEIcXOOxnurWdKwbC5T//Z"
              sizes="full"
              className="object-cover"
            />
            <div className="bg-gradient-to-r from-primary/40 to-secondary/40 mix-blend-multiply"></div>
          </div>
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
                <div className="relative overflow-hidden p-8 rounded-2xl backdrop-blur-sm mb-12 group transition-all duration-500 border border-transparent hover:border-blue-500/30">
                  {/* 背景渐变 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                  {/* 装饰性圆环 */}
                  <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border border-blue-500/10"></div>
                  <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full border border-purple-500/20"></div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative">
                      <Link href="#" className="block relative group">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-all duration-500">
                          {/* 请将 src 替换为实际的头像图片路径 */}
                          <Image
                            src="https://api.penlibra.xin/storage/v1/object/public/libra-bucket/covers/z0rzlcz3q5w4.jpg"
                            alt="作者头像"
                            fill
                            sizes="100px"
                            className="object-cover relative z-10"
                          />
                          {/* 渐变叠加层 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 mix-blend-overlay"></div>
                        </div>
                        <div className="absolute -inset-1.5 rounded-full blur-md bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 animate-pulse"></div>
                      </Link>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                        Libra
                      </h3>
                      <p className="text-md mb-4 text-muted-foreground">
                        热爱技术，分享生活
                      </p>
                      <p className="text-muted-foreground italic relative">
                        感谢您阅读我的文章。如果您喜欢这篇文章，请考虑分享或关注我的更多内容。
                        <span className="absolute -left-2 top-0 text-4xl font-serif opacity-10 text-blue-500">
                          "
                        </span>
                        <span className="absolute -right-2 bottom-0 text-4xl font-serif text-purple-500">
                          "
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 相关推荐 */}
                <h3 className="text-2xl font-bold mb-8 relative w-fit">
                  <span className="relative z-10 inline-block px-6 py-3 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                    您可能还喜欢
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-sm"></span>
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-purple-500"></span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {recentBlogs.map((blog) => (
                    <Link href={`/blogs/${blog.id}`} key={blog.id}>
                      <div className="group relative overflow-hidden p-6 rounded-xl backdrop-blur-sm transition-all duration-300 border border-transparent hover:border-blue-500/20 hover:shadow-md">
                        {/* 简化的背景渐变 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>

                        <div className="relative z-10">
                          <h4 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-500/90 to-purple-500/90 truncate">
                            {blog.title}
                          </h4>

                          <p className="text-muted-foreground mb-3 text-sm line-clamp-2 min-h-[40px]">
                            {blog.description}
                          </p>

                          {blog.tags && blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {blog.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${tag.color || "#6c757d"}10`,
                                    color: tag.color || "#6c757d",
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* 简化的阅读提示 */}
                          <div className="mt-4 flex justify-end">
                            <span className="inline-flex items-center text-sm font-medium text-blue-500 group-hover:translate-x-1 transition-transform duration-300">
                              阅读文章
                              <svg
                                className="w-4 h-4 ml-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                ></path>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
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
