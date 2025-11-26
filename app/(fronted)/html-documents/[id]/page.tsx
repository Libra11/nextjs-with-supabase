/**
 * Author: Libra
 * Date: 2025-09-16 17:06:55
 * LastEditors: Libra
 * Description:
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { HtmlDocumentWithCategory } from "@/types/html-document";
import {
  getHtmlDocumentById,
  incrementHtmlDocumentViewCount,
} from "@/lib/html-document";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Globe,
  Maximize,
  Minimize,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { icons } from "@/icons.config";

// 动态图标组件
const DynamicIcon = ({
  name,
  size = 16,
  className = "",
  loadedIcons,
}: {
  name?: string;
  size?: number;
  className?: string;
  loadedIcons?: Record<string, any>;
}) => {
  if (!name || !loadedIcons || !loadedIcons[name]) return null;

  const IconComponent = loadedIcons[name];
  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <IconComponent
        style={{
          width: "100%",
          height: "100%",
          maxWidth: size,
          maxHeight: size,
        }}
      />
    </div>
  );
};

// HTML渲染组件 - 支持script执行和自适应高度
const HtmlRenderer = ({
  html,
  isFullscreen,
}: {
  html: string;
  isFullscreen: boolean;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(600); // 默认高度

  const adjustIframeHeight = useCallback(() => {
    if (iframeRef.current && !isFullscreen) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        // 等待内容完全加载
        const waitForContent = () => {
          return new Promise<void>((resolve) => {
            const checkContent = () => {
              if (doc.body && doc.body.children.length > 0) {
                resolve();
              } else {
                setTimeout(checkContent, 50);
              }
            };
            checkContent();
          });
        };

        waitForContent().then(() => {
          // 临时移除所有可能影响高度的样式
          const originalStyles = {
            htmlOverflow: doc.documentElement.style.overflow,
            htmlHeight: doc.documentElement.style.height,
            htmlMinHeight: doc.documentElement.style.minHeight,
            bodyOverflow: doc.body?.style.overflow,
            bodyHeight: doc.body?.style.height,
            bodyMinHeight: doc.body?.style.minHeight,
          };

          // 设置为可见状态以获取真实高度
          if (doc.documentElement) {
            doc.documentElement.style.overflow = "visible";
            doc.documentElement.style.height = "auto";
            doc.documentElement.style.minHeight = "auto";
          }
          if (doc.body) {
            doc.body.style.overflow = "visible";
            doc.body.style.height = "auto";
            doc.body.style.minHeight = "auto";
          }

          // 强制重新布局并计算高度
          iframe.contentWindow?.requestAnimationFrame(() => {
            iframe.contentWindow?.requestAnimationFrame(() => {
              const body = doc.body;
              const html = doc.documentElement;

              if (body && html) {
                // 使用多种方法获取最准确的高度
                let height = 0;

                // 方法1: 获取所有子元素的边界框
                const children = Array.from(body.children);
                if (children.length > 0) {
                  let maxBottom = 0;
                  children.forEach((child) => {
                    const rect = child.getBoundingClientRect();
                    const childBottom = rect.bottom;
                    if (childBottom > maxBottom) {
                      maxBottom = childBottom;
                    }
                  });
                  if (maxBottom > 0) {
                    height = Math.max(height, maxBottom + 40); // 加上padding
                  }
                }

                // 方法2: 使用scroll和offset高度
                height = Math.max(
                  height,
                  body.scrollHeight,
                  body.offsetHeight,
                  html.scrollHeight,
                  html.offsetHeight
                );

                // 方法3: 使用getBoundingClientRect
                const bodyRect = body.getBoundingClientRect();
                const htmlRect = html.getBoundingClientRect();
                height = Math.max(
                  height,
                  Math.ceil(bodyRect.height),
                  Math.ceil(htmlRect.height)
                );

                // 设置最小高度和足够的缓冲区
                const minHeight = 300;
                const buffer = 80; // 增加缓冲区
                const finalHeight = Math.max(height + buffer, minHeight);

                setIframeHeight(finalHeight);

                // 恢复原始样式
                setTimeout(() => {
                  if (doc.documentElement) {
                    doc.documentElement.style.overflow =
                      originalStyles.htmlOverflow || "hidden";
                    doc.documentElement.style.height =
                      originalStyles.htmlHeight || "";
                    doc.documentElement.style.minHeight =
                      originalStyles.htmlMinHeight || "";
                  }
                  if (doc.body) {
                    doc.body.style.overflow =
                      originalStyles.bodyOverflow || "hidden";
                    doc.body.style.height = originalStyles.bodyHeight || "";
                    doc.body.style.minHeight =
                      originalStyles.bodyMinHeight || "";
                  }
                }, 100);
              }
            });
          });
        });
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                html, body { 
                  margin: 0; 
                  padding: 0;
                  font-family: system-ui, -apple-system, sans-serif;
                  background: #0f0f0f;
                  line-height: 1.6;
                  overflow: visible; /* 允许内容完全显示 */
                  height: auto !important;
                  min-height: auto !important;
                }
                * {
                  box-sizing: border-box;
                }
              </style>
            </head>
            <body>
              ${html}
            </body>
          </html>
        `);
        doc.close();

        // 监听iframe加载完成事件
        iframe.onload = () => {
          // 等待内容完全加载后调整高度
          setTimeout(() => {
            adjustIframeHeight();
          }, 200);

          // 再次确保在内容渲染完成后调整
          setTimeout(() => {
            adjustIframeHeight();
          }, 500);
        };

        // 监听内容变化
        const resizeObserver = new ResizeObserver(() => {
          setTimeout(() => {
            adjustIframeHeight();
          }, 50);
        });

        if (doc.body) {
          resizeObserver.observe(doc.body);
        }

        // 监听window resize事件
        const handleResize = () => {
          setTimeout(() => {
            adjustIframeHeight();
          }, 100);
        };
        window.addEventListener("resize", handleResize);

        // 初始调整（立即执行一次）
        setTimeout(() => {
          adjustIframeHeight();
        }, 100);

        // 清理函数
        return () => {
          resizeObserver.disconnect();
          window.removeEventListener("resize", handleResize);
        };
      }
    }
  }, [html, adjustIframeHeight]);

  // 当全屏状态改变时，重新调整高度
  useEffect(() => {
    if (!isFullscreen) {
      setTimeout(() => {
        adjustIframeHeight();
      }, 100);
    }
  }, [isFullscreen, adjustIframeHeight]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full border-0"
      style={{
        height: isFullscreen ? "100%" : `${iframeHeight}px`,
        overflow: "hidden", // 确保没有滚动条
        border: "none",
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      title="知识卡片预览"
    />
  );
};

// 加载骨架屏
const DocumentSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-10 w-20 bg-muted rounded animate-pulse" />
      <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
    </div>

    <div className="space-y-4">
      <div className="h-12 bg-muted rounded animate-pulse" />
      <div className="flex gap-4">
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        <div className="h-6 bg-muted rounded w-32 animate-pulse" />
      </div>
    </div>

    <div className="h-96 bg-muted rounded animate-pulse" />
  </div>
);

export default function HtmlDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = parseInt(params.id as string);

  const [document, setDocument] = useState<HtmlDocumentWithCategory | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  // 加载卡片数据
  const loadDocument = async () => {
    if (!documentId) {
      router.push("/html-documents");
      return;
    }

    try {
      setLoading(true);
      const doc = await getHtmlDocumentById(documentId);

      if (!doc) {
        toast.error("卡片不存在");
        router.push("/html-documents");
        return;
      }

      setDocument(doc);

      // 增加浏览量
      incrementHtmlDocumentViewCount(documentId).catch(console.error);
    } catch (error) {
      console.error("加载卡片失败:", error);
      toast.error("加载卡片失败");
      router.push("/html-documents");
    } finally {
      setLoading(false);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    loadDocument();
    // 加载自定义图标
    Promise.all(
      Object.entries(icons).map(async ([name, importFn]: any) => {
        const icon = await importFn();
        return [name, icon.default] as const;
      })
    ).then((loadedPairs) => {
      setLoadedIcons(Object.fromEntries(loadedPairs));
    });
  }, [documentId]);

  if (loading) {
    return <DocumentSkeleton />;
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">卡片不存在</h3>
        <p className="text-muted-foreground mb-4">
          您访问的知识卡片不存在或已被删除
        </p>
        <Link href="/html-documents">
          <Button>返回卡片列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 导航栏 */}
      <div className="flex items-center justify-between">
        <Link href="/html-documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>

        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <>
              <Minimize className="mr-2 h-4 w-4" />
              退出全屏
            </>
          ) : (
            <>
              <Maximize className="mr-2 h-4 w-4" />
              全屏查看
            </>
          )}
        </Button>
      </div>

      {/* 卡片信息 */}
      <div className="space-y-4">
        <div>
          <div className="relative inline-block">
            <h2 className="title-gradient">{document.title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* 分类 */}
            {document.category && (
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: document.category.color + "20",
                  color: document.category.color,
                  borderColor: document.category.color + "40",
                }}
              >
                <DynamicIcon
                  name={document.category.icon}
                  size={14}
                  className="mr-1"
                  loadedIcons={loadedIcons}
                />
                {document.category.name}
              </Badge>
            )}

            {/* 浏览量 */}
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{document.view_count} 次浏览</span>
            </div>

            {/* 创建时间 */}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(document.created_at), "yyyy年MM月dd日", {
                  locale: zhCN,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HTML预览区域 */}
      <div className="h-auto">
        <Card
          className={`${isFullscreen ? "fixed inset-0 z-50 rounded-none" : "border-none"}`}
        >
          <CardContent className={`p-0 ${isFullscreen ? "h-screen" : ""}`}>
            {isFullscreen && (
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  <Minimize className="mr-2 h-4 w-4" />
                  退出全屏
                </Button>
              </div>
            )}

            <HtmlRenderer html={document.content} isFullscreen={isFullscreen} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
