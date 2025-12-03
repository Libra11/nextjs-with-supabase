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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BlogCardProps {
  blog: BlogWithTags & { coverImageUrl: string };
  className?: string;
  bgClassName?: string;
}

export function BlogCard({
  blog,
  className = "",
  bgClassName = "",
}: BlogCardProps) {
  const { resolvedTheme, theme } = useTheme();
  const mainTag = blog.tags[0]; // 获取第一个标签作为主标签
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  const cardBaseClasses = isDark
    ? "bg-slate-950/60 shadow-[inset_0_0_25px_12px_rgba(12,12,18,0.65)]"
    : "bg-white/90 shadow-[0_25px_45px_-30px_rgba(15,23,42,0.2)]";

  const pinnedBadgeClasses = isDark
    ? "bg-white/10 text-white"
    : "bg-slate-900/70 text-slate-50";

  return (
    <Link href={`/blogs/${blog.id}`} className="block group">
      <MagicCard
        backgroundClassName={cn(
          "backdrop-blur-xl transition-all duration-300",
          cardBaseClasses,
          bgClassName
        )}
        className={cn(
          "h-full w-full rounded-xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5",
          className
        )}
      >
        <div className="flex flex-col p-3">
          <div className="relative w-full h-[180px] rounded-lg overflow-hidden">
            {blog.coverImageUrl ? (
              <Image
                src={blog.coverImageUrl}
                alt={blog.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-800/80"></div>
            )}
            {blog.is_top && (
              <div
                className={cn(
                  "absolute top-2 right-2 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm",
                  pinnedBadgeClasses
                )}
              >
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-base my-1 font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {blog.title}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{blog.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 h-8">
                      {blog.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{blog.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
