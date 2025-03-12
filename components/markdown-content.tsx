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
import "highlight.js/styles/atom-one-dark.css"; // 代码高亮样式
import { motion } from "framer-motion";
import rehypeHighlightCodeLines from "rehype-highlight-code-lines";
import "./markdown.css"; // 导入Markdown样式

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="markdown-content" // 添加特定类名
    >
      <ReactMarkdown
        rehypePlugins={[
          rehypeRaw,
          rehypeHighlight, // 首先进行代码高亮
          [rehypeHighlightCodeLines, { showLineNumbers: true }], // 然后添加行号
          rehypeSlug, // 最后添加锚点
        ]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </motion.div>
  );
}
