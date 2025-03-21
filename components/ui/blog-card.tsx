/**
 * Author: Libra
 * Date: 2025-03-16
 * LastEditors: Libra
 * Description: 博客卡片组件
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye, Calendar, Pin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TagBadge } from "@/components/ui/tag-badge";
import { BlogWithTags } from "@/types/blog";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/magicui/magic-card";
import { useTheme } from "next-themes";

interface BlogCardProps {
  blog: BlogWithTags & { coverImageUrl: string };
  className?: string;
  hasGradient?: boolean;
}

export function BlogCard({
  blog,
  className = "",
  hasGradient = false,
}: BlogCardProps) {
  const { theme } = useTheme();
  const mainTag = blog.tags[0]; // 获取第一个标签作为主标签

  return (
    <Link href={`/blogs/${blog.id}`} className="block group">
      <MagicCard
        gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
        backgroundClassName={cn(
          hasGradient && "bg-gradient-to-r from-[#222222] to-[#0d0d0d]"
        )}
        className={cn("h-full w-full rounded-xl", className)}
      >
        <div className="flex flex-col p-3">
          <div className="relative w-full h-[180px]">
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
              fill
              className="object-cover rounded-lg"
            />
            {blog.is_top && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Pin className="w-3 h-3" />
                <span className="text-[10px]">置顶</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="px-1 py-2">
              <div className="flex items-center gap-2">
                {mainTag && (
                  <TagBadge
                    icon_name={mainTag.icon_name || ""}
                    color={mainTag.color || "#6c757d"}
                    iconOnly
                    className="shrink-0"
                  />
                )}
                <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                  {blog.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                {blog.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">{formatDate(blog.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">{blog.view_count} 次阅读</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MagicCard>
    </Link>
  );
}
