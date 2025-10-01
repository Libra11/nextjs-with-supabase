/**
 * Difficulty Badge Component for LeetCode Problems
 */
import { Badge } from "@/components/ui/badge";
import { Difficulty } from "@/types/leetcode";
import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const difficultyConfig = {
  easy: {
    label: "简单",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  medium: {
    label: "中等",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  hard: {
    label: "困难",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
