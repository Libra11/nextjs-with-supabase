/**
 * Author: Libra
 * Date: 2025-09-18 15:29:29
 * LastEditors: Libra
 * Description:
 */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  HtmlCategory,
  UpdateHtmlDocumentInput,
  HtmlDocumentWithCategory,
} from "@/types/html-document";
import {
  getHtmlCategories,
  updateHtmlDocument,
  getHtmlDocumentById,
} from "@/lib/html-document";
import { uploadToOSS } from "@/lib/oss-upload";
import Image from "next/image";
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

// HTML预览组件，支持script执行
const HtmlPreview = ({ html }: { html: string }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
                body { 
                  margin: 0; 
                  padding: 16px; 
                  font-family: system-ui, -apple-system, sans-serif;
                  background: #0f0f0f;
                }
              </style>
            </head>
            <body>
              ${html}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full min-h-[400px] border rounded-md bg-white"
      sandbox="allow-scripts allow-same-origin allow-forms"
      title="HTML预览"
    />
  );
};

export default function EditHtmlDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = parseInt(params.id as string);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [categories, setCategories] = useState<HtmlCategory[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [document, setDocument] = useState<HtmlDocumentWithCategory | null>(
    null
  );
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadedIcons, setLoadedIcons] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState<UpdateHtmlDocumentInput>({
    id: documentId,
    title: "",
    content: "",
    category_id: undefined,
    cover_image_url: "",
  });

  // 加载卡片数据
  const loadDocument = async () => {
    setPageLoading(true);
    try {
      const doc = await getHtmlDocumentById(documentId);
      if (!doc) {
        toast.error("卡片不存在");
        router.push("/dashboard/html-documents");
        return;
      }

      setDocument(doc);
      setFormData({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category_id: doc.category_id || undefined,
        cover_image_url: doc.cover_image_url || "",
      });

      // 设置预览URL
      if (doc.cover_image_url) {
        setPreviewUrl(doc.cover_image_url);
      }
    } catch (error) {
      console.error("加载卡片失败:", error);
      toast.error("加载卡片失败");
      router.push("/dashboard/html-documents");
    } finally {
      setPageLoading(false);
    }
  };

  // 加载分类
  const loadCategories = async () => {
    try {
      const categoriesData = await getHtmlCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("加载分类失败:", error);
      toast.error("加载分类失败");
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      toast.error("请输入标题");
      return;
    }

    if (!formData.content?.trim()) {
      toast.error("请输入内容");
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id || undefined,
        cover_image_url: formData.cover_image_url || undefined,
      };

      const result = await updateHtmlDocument(documentId, submitData);

      if (result) {
        toast.success("知识卡片更新成功");
        router.push("/dashboard/html-documents");
      } else {
        toast.error("更新失败");
      }
    } catch (error) {
      console.error("更新失败:", error);
      toast.error("更新失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新表单数据
  const updateFormData = (field: keyof UpdateHtmlDocumentInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      const { url } = await uploadToOSS(file, { folder: "html-covers" });
      setPreviewUrl(url);
      updateFormData("cover_image_url", url);
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("图片上传失败");
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      loadDocument();
      loadCategories();
      // 加载自定义图标
      Promise.all(
        Object.entries(icons).map(async ([name, importFn]: any) => {
          const icon = await importFn();
          return [name, icon.default] as const;
        })
      ).then((loadedPairs) => {
        setLoadedIcons(Object.fromEntries(loadedPairs));
      });
    }
  }, [documentId]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">卡片不存在</p>
        <Link href="/dashboard/html-documents">
          <Button className="mt-4">返回列表</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/html-documents">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">编辑知识卡片</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? "编辑模式" : "预览模式"}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "保存中..." : "保存更改"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要内容区 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>卡片内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  placeholder="请输入卡片标题"
                  value={formData.title || ""}
                  onChange={(e) => updateFormData("title", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="content">HTML内容 *</Label>
                {previewMode ? (
                  <HtmlPreview html={formData.content || ""} />
                ) : (
                  <Textarea
                    id="content"
                    placeholder="请输入HTML内容"
                    value={formData.content || ""}
                    onChange={(e) => updateFormData("content", e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 基本设置 */}
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category_id?.toString() || "none"}
                  onValueChange={(value) =>
                    updateFormData(
                      "category_id",
                      value === "none" ? undefined : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <DynamicIcon
                            name={category.icon}
                            size={14}
                            loadedIcons={loadedIcons}
                          />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cover_image">封面图片</Label>
                <div className="space-y-4">
                  <Input
                    id="cover_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadLoading}
                  />
                  <Input
                    placeholder="或直接输入图片URL"
                    value={formData.cover_image_url || ""}
                    onChange={(e) => {
                      const url = e.target.value;
                      updateFormData("cover_image_url", url);
                      setPreviewUrl(url);
                    }}
                  />
                  {previewUrl && (
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border">
                      <Image
                        src={previewUrl}
                        alt="封面预览"
                        fill
                        className="object-cover"
                        onError={() => setPreviewUrl("")}
                      />
                    </div>
                  )}
                  {uploadLoading && (
                    <div className="text-sm text-muted-foreground">
                      上传中...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 卡片信息 */}
          <Card>
            <CardHeader>
              <CardTitle>卡片信息</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span>{document.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">浏览量:</span>
                <span>{document.view_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间:</span>
                <span>
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">更新时间:</span>
                <span>
                  {new Date(document.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 操作提示 */}
          <Card>
            <CardHeader>
              <CardTitle>操作提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 标题和内容为必填项</p>
              <p>• 可以输入完整的HTML代码</p>
              <p>• 使用预览模式查看渲染效果</p>
              <p>• 封面图将显示在卡片列表中</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
