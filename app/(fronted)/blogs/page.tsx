/**
 * Author: Libra
 * Date: 2025-03-07 20:29:54
 * LastEditors: Libra
 * Description: 博客列表页面
 */
import { getBlogs } from "@/lib/blog";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function BlogsPage() {
  // 获取所有已发布的博客
  const blogs = await getBlogs();
  const publishedBlogs = blogs;

  // 提取内容摘要的辅助函数
  const getExcerpt = (content: string, maxLength = 150) => {
    // 移除可能的HTML标签
    const plainText = content.replace(/<[^>]+>/g, "");
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + "...";
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">我的博客</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          分享我的技术经验、思考和最新见解
        </p>
      </div>

      {publishedBlogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">暂无博客文章</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publishedBlogs.map((blog) => (
            <Link href={`/blogs/${blog.id}`} key={blog.id} className="group">
              <div className="bg-card border rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                {blog.cover_image ? (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={blog.cover_image}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">无封面图片</span>
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {blog.title}
                  </h2>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {formatDate(blog.created_at)}
                  </p>
                  <p className="text-sm mb-4">{getExcerpt(blog.content)}</p>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
