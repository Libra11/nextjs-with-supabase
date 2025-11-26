/**
 * Author: Libra
 * Date: 2025-03-15
 * LastEditors: Libra
 * Description: 无限滚动加载组件
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollProps {
  // 是否有更多数据可以加载
  hasMore: boolean;
  // 加载更多数据的回调函数
  loadMore: () => Promise<void>;
  // 距离底部多远时触发加载更多 (默认200px)
  threshold?: number;
  // 加载中显示的文字
  loadingText?: string;
  // 无更多数据时显示的文字
  endMessage?: string;
  // 是否在初始化时就加载数据
  initialLoad?: boolean;
  // 数据加载中的状态
  isLoading?: boolean;
  // 加载器的样式类
  loaderClassName?: string;
  // 结束信息的样式类
  endMessageClassName?: string;
  // 初始化延迟毫秒数，用于避免在页面加载时立即触发
  initDelay?: number;
}

export function InfiniteScroll({
  hasMore,
  loadMore,
  threshold = 200,
  loadingText = "加载更多内容...",
  endMessage = "没有更多内容了",
  initialLoad = false,
  isLoading = false,
  loaderClassName = "flex justify-center items-center py-6 text-muted-foreground",
  endMessageClassName = "text-center py-6 text-muted-foreground",
  initDelay = 1000,
}: InfiniteScrollProps) {
  const [loading, setLoading] = useState(isLoading);
  const [initialized, setInitialized] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // 处理加载更多的逻辑
  const handleLoadMore = async () => {
    if (loading || !hasMore || !initialized) return;

    setLoading(true);
    try {
      await loadMore();
    } catch (error) {
      console.error("加载更多内容时出错:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化组件，添加一个延迟以避免在页面加载时立即触发
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialized(true);
    }, initDelay);

    return () => clearTimeout(timer);
  }, [initDelay]);

  // 初始加载数据
  useEffect(() => {
    if (initialLoad && hasMore && initialized) {
      handleLoadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoad, initialized]);

  // 监听滚动，使用 IntersectionObserver API
  useEffect(() => {
    if (loading || !initialized) return;

    const currentObserver = observer.current;
    const currentElement = loadingRef.current;

    if (currentElement) {
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            console.log("加载更多");
            handleLoadMore();
          }
        },
        {
          rootMargin: `0px 0px ${threshold}px 0px`,
          threshold: 0.1,
        }
      );

      observer.current.observe(currentElement);
    }

    return () => {
      if (currentObserver && currentElement) {
        currentObserver.unobserve(currentElement);
      }
    };
  }, [loading, hasMore, threshold, initialized]);

  return (
    <div className="min-h-1">
      <div ref={loadingRef}>
        {loading && (
          <div className={loaderClassName}>
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{loadingText}</span>
          </div>
        )}
        {!hasMore && !loading && initialized && (
          <div className={endMessageClassName}>{endMessage}</div>
        )}
      </div>
    </div>
  );
}
