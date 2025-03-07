/**
 * Author: Libra
 * Date: 2025-03-07 20:40:47
 * LastEditors: Libra
 * Description: 
*/
"use client";

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css"; // 代码高亮样式

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeSlug]}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}
