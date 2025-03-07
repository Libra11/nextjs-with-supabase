/**
 * Author: Libra
 * Date: 2025-03-07 20:44:35
 * LastEditors: Libra
 * Description: 
*/
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// 动态导入 Markdown 渲染组件，在客户端组件中使用
const MarkdownContent = dynamic(() => import("@/components/markdown-content"), {
  ssr: false,
  loading: () => <p className="text-muted-foreground">加载内容中...</p>,
});

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const [mounted, setMounted] = useState(false);

  // 确保只在客户端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <p className="text-muted-foreground">加载内容中...</p>;
  }

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
      <MarkdownContent content={content} />
    </div>
  );
}
