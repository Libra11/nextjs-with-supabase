/**
 * Author: Libra
 * Date: 2025-03-22 11:24:41
 * LastEditors: Libra
 * Description:
 */
"use client";

import { BookOpen, Tags, Eye, Clock } from "lucide-react";
import { StatCard } from "./stat-card";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  blogCount: number;
  tagCount: number;
  viewCount: number;
  dayCount: number;
  className?: string;
  title?: string;
}

export function StatsOverview({
  blogCount,
  tagCount,
  viewCount,
  dayCount,
  className,
  title = "博客统计",
}: StatsOverviewProps) {
  return (
    <div className={cn("", className)}>
      {title && (
        <h2 className="title-gradient text-xl md:text-2xl font-bold mb-4 md:mb-6">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          icon={BookOpen}
          value={blogCount}
          label="文章总数"
          colorScheme="primary"
          className="min-h-[100px]"
        />

        <StatCard
          icon={Tags}
          value={tagCount}
          label="标签总数"
          colorScheme="blue"
          className="min-h-[100px]"
        />

        <StatCard
          icon={Eye}
          value={viewCount}
          label="总阅读量"
          colorScheme="purple"
          className="min-h-[100px]"
        />

        <StatCard
          icon={Clock}
          value={dayCount}
          label="更新天数"
          colorScheme="amber"
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
