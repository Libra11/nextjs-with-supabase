/**
 * Animation Loader for LeetCode Problems
 */
"use client";

import { Suspense, lazy, ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Animation component registry
const AnimationMap: Record<string, ComponentType<any>> = {
  "two-sum": lazy(() => import("./TwoSumAnimation")),
  "add-two-numbers": lazy(() => import("./AddTwoNumbersAnimation")),
  "group-anagrams": lazy(() => import("./GroupAnagramsAnimation")),
  "longest-consecutive": lazy(() => import("./LongestConsecutiveAnimation")),
  "longest-substring": lazy(() => import("./LongestSubstringAnimation")),
  "find-anagrams": lazy(() => import("./FindAnagramsAnimation")),
  "subarray-sum": lazy(() => import("./SubarraySumAnimation")),
  "sliding-window-max": lazy(() => import("./SlidingWindowMaxAnimation")),
  "move-zeroes": lazy(() => import("./MoveZeroesAnimation")),
  "max-water": lazy(() => import("./MaxWaterAnimation")),
  "minimum-window-substring": lazy(
    () => import("./MinimumWindowSubstringAnimation"),
  ),
  "max-subarray": lazy(() => import("./MaxSubarrayAnimation")),
  "rotate-array": lazy(() => import("./RotateArrayAnimation")),
  "merge-intervals": lazy(() => import("./MergeIntervalsAnimation")),
  "merge-two-sorted-lists": lazy(
    () => import("./MergeTwoSortedListsAnimation"),
  ),
  "product-except-self": lazy(() => import("./ProductExceptSelfAnimation")),
  "first-missing-positive": lazy(
    () => import("./FirstMissingPositiveAnimation"),
  ),
  "set-zeroes": lazy(() => import("./SetZeroesAnimation")),
  "spiral-order": lazy(() => import("./SpiralOrderAnimation")),
  "rotate-image": lazy(() => import("./RotateImageAnimation")),
  "three-sum": lazy(() => import("./ThreeSumAnimation")),
  "trap-rain-water": lazy(() => import("./TrappingRainWaterAnimation")),
  "search-matrix-ii": lazy(() => import("./SearchMatrixIIAnimation")),
  "intersection-linked-list": lazy(
    () => import("./IntersectionLinkedListAnimation"),
  ),
  "linked-list-cycle": lazy(() => import("./LinkedListCycleAnimation")),
  "linked-list-cycle-ii": lazy(() => import("./LinkedListCycleIIAnimation")),
  "reverse-linked-list": lazy(() => import("./ReverseLinkedListAnimation")),
  "palindrome-linked-list": lazy(
    () => import("./PalindromeLinkedListAnimation"),
  ),
  "swap-nodes-in-pairs": lazy(
    () => import("./SwapPairsAnimation"),
  ),
  "remove-nth-node-from-end-of-list": lazy(
    () => import("./RemoveNthFromEndAnimation"),
  ),
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
      <div
        className={`flex items-center justify-center min-h-[520px] bg-muted/20 rounded-lg ${className || ""}`}
      >
        <p className="text-muted-foreground">暂无动画演示</p>
      </div>
    );
  }

  // If animation component doesn't exist
  const Component = AnimationMap[name];
  if (!Component) {
    return (
      <div
        className={`flex items-center justify-center min-h-[520px] bg-muted/20 rounded-lg ${className || ""}`}
      >
        <p className="text-muted-foreground">
          动画组件 &ldquo;{name}&rdquo; 未找到
        </p>
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
