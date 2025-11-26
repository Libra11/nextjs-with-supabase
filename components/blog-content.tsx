/**
 * Author: Libra
 * Date: 2025-03-07 20:44:35
 * LastEditors: Libra
 * Description:
 */
"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Loading from "@/app/(fronted)/loading";

// 动态导入 Markdown 渲染组件，在客户端组件中使用
const MarkdownContent = dynamic(() => import("@/components/markdown-content"), {
  ssr: false,
  loading: () => <Loading />,
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
    return <Loading />;
  }

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
      <MarkdownContent content={content} />
    </div>
  );
}
