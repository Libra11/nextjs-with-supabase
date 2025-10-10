/**
 * Animation Loader for LeetCode Problems
 */
"use client";

import { Suspense, lazy, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Animation component registry
const AnimationMap: Record<string, ComponentType<any>> = {
  "two-sum": lazy(() => import("./TwoSumAnimation")),
  "group-anagrams": lazy(() => import("./GroupAnagramsAnimation")),
  // Add more animations here as you create them
  // "reverse-linked-list": lazy(() => import("./ReverseLinkedListAnimation")),
  // "binary-search": lazy(() => import("./BinarySearchAnimation")),
};

interface AnimationLoaderProps {
  name: string | null;
  className?: string;
}

export function AnimationLoader({ name, className }: AnimationLoaderProps) {
  // If no animation name is provided
  if (!name) {
    return (
      <div className={`flex items-center justify-center min-h-[520px] bg-muted/20 rounded-lg ${className || ""}`}>
        <p className="text-muted-foreground">暂无动画演示</p>
      </div>
    );
  }

  // If animation component doesn't exist
  const Component = AnimationMap[name];
  if (!Component) {
    return (
      <div className={`flex items-center justify-center min-h-[520px] bg-muted/20 rounded-lg ${className || ""}`}>
        <p className="text-muted-foreground">动画组件 &ldquo;{name}&rdquo; 未找到</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className={`min-h-[520px] space-y-4 ${className || ""}`}>
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}
