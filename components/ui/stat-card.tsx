/**
 * Author: Libra
 * Date: 2025-03-22 11:24:26
 * LastEditors: Libra
 * Description:
 */
"use client";

import { LucideIcon } from "lucide-react";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Meteors } from "@/components/ui/meteors";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorScheme?: "primary" | "blue" | "purple" | "amber" | "green" | "red";
  className?: string;
}

// 颜色方案映射
const colorSchemeMap = {
  primary: {
    gradientFrom: "from-primary/5",
    gradientTo: "to-primary/10",
    hoverGradientFrom: "hover:from-primary/10",
    hoverGradientTo: "hover:to-primary/20",
    iconColor: "text-primary",
    iconHoverColor: "group-hover:text-primary/80",
    circleBg: "bg-primary/10",
    circleHoverBg: "group-hover:bg-primary/20",
    border: "border-primary/10",
    borderHover: "hover:border-primary/30",
  },
  blue: {
    gradientFrom: "from-blue-500/5",
    gradientTo: "to-blue-500/10",
    hoverGradientFrom: "hover:from-blue-500/10",
    hoverGradientTo: "hover:to-blue-500/20",
    iconColor: "text-blue-500",
    iconHoverColor: "group-hover:text-blue-500/80",
    circleBg: "bg-blue-500/10",
    circleHoverBg: "group-hover:bg-blue-500/20",
    border: "border-blue-500/10",
    borderHover: "hover:border-blue-500/30",
  },
  purple: {
    gradientFrom: "from-purple-500/5",
    gradientTo: "to-purple-500/10",
    hoverGradientFrom: "hover:from-purple-500/10",
    hoverGradientTo: "hover:to-purple-500/20",
    iconColor: "text-purple-500",
    iconHoverColor: "group-hover:text-purple-500/80",
    circleBg: "bg-purple-500/10",
    circleHoverBg: "group-hover:bg-purple-500/20",
    border: "border-purple-500/10",
    borderHover: "hover:border-purple-500/30",
  },
  amber: {
    gradientFrom: "from-amber-500/5",
    gradientTo: "to-amber-500/10",
    hoverGradientFrom: "hover:from-amber-500/10",
    hoverGradientTo: "hover:to-amber-500/20",
    iconColor: "text-amber-500",
    iconHoverColor: "group-hover:text-amber-500/80",
    circleBg: "bg-amber-500/10",
    circleHoverBg: "group-hover:bg-amber-500/20",
    border: "border-amber-500/10",
    borderHover: "hover:border-amber-500/30",
  },
  green: {
    gradientFrom: "from-green-500/5",
    gradientTo: "to-green-500/10",
    hoverGradientFrom: "hover:from-green-500/10",
    hoverGradientTo: "hover:to-green-500/20",
    iconColor: "text-green-500",
    iconHoverColor: "group-hover:text-green-500/80",
    circleBg: "bg-green-500/10",
    circleHoverBg: "group-hover:bg-green-500/20",
    border: "border-green-500/10",
    borderHover: "hover:border-green-500/30",
  },
  red: {
    gradientFrom: "from-red-500/5",
    gradientTo: "to-red-500/10",
    hoverGradientFrom: "hover:from-red-500/10",
    hoverGradientTo: "hover:to-red-500/20",
    iconColor: "text-red-500",
    iconHoverColor: "group-hover:text-red-500/80",
    circleBg: "bg-red-500/10",
    circleHoverBg: "group-hover:bg-red-500/20",
    border: "border-red-500/10",
    borderHover: "hover:border-red-500/30",
  },
};

export function StatCard({
  icon: Icon,
  value,
  label,
  colorScheme = "primary",
  className,
}: StatCardProps) {
  const colors = colorSchemeMap[colorScheme];
  const [isMounted, setIsMounted] = useState(false);

  // 确保 Meteors 组件只在客户端渲染
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-gradient-to-br",
        colors.gradientFrom,
        colors.gradientTo,
        colors.hoverGradientFrom,
        colors.hoverGradientTo,
        "rounded-lg shadow-sm transition-all duration-300 hover:shadow-md border",
        colors.border,
        colors.borderHover,
        className
      )}
    >
      <div
        className={cn(
          "absolute -right-6 -top-6 w-24 h-24 rounded-full",
          colors.circleBg,
          colors.circleHoverBg,
          "transition-all duration-500"
        )}
      ></div>
      <div className="p-6 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-card flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Icon
              className={cn("h-7 w-7", colors.iconColor, colors.iconHoverColor)}
            />
          </div>
          <div className="flex flex-col">
            <div className="text-4xl font-bold tracking-tight group-hover:translate-x-1 transition-transform">
              <NumberTicker value={value} />
            </div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">
              {label}
            </p>
          </div>
        </div>
      </div>

      {/* 只在客户端渲染 Meteors 组件 */}
      {isMounted && <Meteors number={10} />}
    </div>
  );
}
