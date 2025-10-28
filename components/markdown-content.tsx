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
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  const { toast } = useToast();

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
        components={{
          code(props) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <div className="parent-container-of-pre group">
                <div className="code-header">
                  <div className="window-controls">
                    <span className="window-control close"></span>
                    <span className="window-control minimize"></span>
                    <span className="window-control maximize"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="code-language">{match[1]}</div>
                    <button
                      className="copy-button"
                      onClick={() => {
                        // 递归提取代码内容
                        const extractTextFromReactNode = (
                          node: any
                        ): string => {
                          if (typeof node === "string") return node;
                          if (Array.isArray(node))
                            return node.map(extractTextFromReactNode).join("");
                          if (node && node.props && node.props.children)
                            return extractTextFromReactNode(
                              node.props.children
                            );
                          return "";
                        };

                        const codeText = extractTextFromReactNode(children);
                        navigator.clipboard.writeText(codeText);

                        // 显示复制成功提示
                        toast({
                          title: "代码已复制",
                          description: "代码已成功复制到剪贴板",
                          duration: 1000,
                          className:
                            "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-xs">复制代码</span>
                    </button>
                  </div>
                </div>
                <div className="group-hover:animate-glow pb-6">
                  <code {...rest} className={className}>
                    {children}
                  </code>
                </div>
              </div>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </motion.div>
  );
}
