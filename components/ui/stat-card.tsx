/**
 * Author: Libra
 * Date: 2025-03-22 11:24:26
 * LastEditors: Libra
 * Description: Vibrant Glass StatCard
 */
"use client";

import { LucideIcon } from "lucide-react";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  colorScheme?: "primary" | "blue" | "purple" | "amber" | "green" | "red";
  className?: string;
}

const colorStyles = {
  primary: {
    bg: "bg-primary/20",
    text: "text-primary",
    glow: "shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]",
    border: "group-hover:border-primary/50",
    gradient: "from-primary/80 to-primary/40",
  },
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-500",
    glow: "shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]",
    border: "group-hover:border-blue-500/50",
    gradient: "from-blue-500/80 to-blue-400/40",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-500",
    glow: "shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)]",
    border: "group-hover:border-purple-500/50",
    gradient: "from-purple-500/80 to-purple-400/40",
  },
  amber: {
    bg: "bg-amber-500/20",
    text: "text-amber-500",
    glow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)]",
    border: "group-hover:border-amber-500/50",
    gradient: "from-amber-500/80 to-amber-400/40",
  },
  green: {
    bg: "bg-green-500/20",
    text: "text-green-500",
    glow: "shadow-[0_0_30px_-10px_rgba(34,197,94,0.5)]",
    border: "group-hover:border-green-500/50",
    gradient: "from-green-500/80 to-green-400/40",
  },
  red: {
    bg: "bg-red-500/20",
    text: "text-red-500",
    glow: "shadow-[0_0_30px_-10px_rgba(239,68,68,0.5)]",
    border: "group-hover:border-red-500/50",
    gradient: "from-red-500/80 to-red-400/40",
  },
};

export function StatCard({
  icon: Icon,
  value,
  label,
  colorScheme = "primary",
  className,
}: StatCardProps) {
  const styles = colorStyles[colorScheme];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[14px] border border-white/10 bg-white/5 p-6 transition-all duration-500 hover:bg-white/10 hover:-translate-y-1",
        styles.border,
        styles.glow,
        className
      )}
    >
      {/* Ambient Background Glow */}
      <div
        className={cn(
          "absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-40",
          styles.bg
        )}
      />

      {/* Glass Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-4xl font-bold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
            <NumberTicker value={value} />
          </span>
          <span className="text-sm font-medium text-muted-foreground/80 mt-1 group-hover:text-muted-foreground transition-colors">
            {label}
          </span>
        </div>

        {/* Vibrant Icon Container */}
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
            "bg-gradient-to-br text-white",
            styles.gradient
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
