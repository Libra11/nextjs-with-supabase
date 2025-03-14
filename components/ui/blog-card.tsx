/**
 * Author: Libra
 * Date: 2025-03-16
 * LastEditors: Libra
 * Description: 博客卡片组件
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { TagBadge } from "@/components/ui/tag-badge";
import { BlogWithTags } from "@/types/blog";

interface BlogCardProps {
  blog: BlogWithTags & { coverImageUrl: string };
  className?: string;
}

export function BlogCard({ blog, className = "" }: BlogCardProps) {
  return (
    <Link href={`/blogs/${blog.id}`} className={`group ${className}`}>
      <div className="bg-card border rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md h-full flex flex-col">
        {blog.coverImageUrl ? (
          <div className="relative w-full h-48 overflow-hidden">
            <Image
              src={blog.coverImageUrl}
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
        <div className="p-6 flex-grow flex flex-col">
          <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {blog.title}
          </h2>
          <div className="flex items-center gap-3 text-muted-foreground mb-4 text-sm">
            <span>{formatDate(blog.created_at)}</span>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{blog.view_count}</span>
            </div>
          </div>
          <p className="text-sm mb-4 flex-grow">{blog.description}</p>
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                icon_name={tag.icon_name || ""}
                color={tag.color || ""}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
