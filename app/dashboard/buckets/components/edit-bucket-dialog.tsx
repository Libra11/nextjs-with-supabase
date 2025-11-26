/**
 * Author: Libra
 * Date: 2025-03-27
 * LastEditors: Libra
 * Description: 编辑存储桶对话框
 */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateBucket, getBucket } from "@/lib/bucket";

interface EditBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucketId: string;
  onSuccess?: () => void;
}

interface BucketData {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number | null;
  allowed_mime_types?: string[] | null;
}

export default function EditBucketDialog({
  open,
  onOpenChange,
  bucketId,
  onSuccess,
}: EditBucketDialogProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [fileSizeLimit, setFileSizeLimit] = useState<string>("");
  const [mimeTypes, setMimeTypes] = useState<string>("");
  const [bucketName, setBucketName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (open && bucketId) {
      fetchBucketDetails();
    }
  }, [open, bucketId]);

  const fetchBucketDetails = async () => {
    if (!bucketId) return;

    try {
      setIsFetching(true);
      const data = await getBucket(bucketId);

      if (data) {
        setBucketName(data.name);
        setIsPublic(data.public);
        setFileSizeLimit(data.file_size_limit?.toString() || "");
        setMimeTypes(
          data.allowed_mime_types ? data.allowed_mime_types.join(", ") : ""
        );
      }
    } catch (error) {
      console.error("获取存储桶详情失败:", error);
      toast.error("获取存储桶详情失败");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!bucketId) return;

    setIsLoading(true);
    try {
      // 解析MIME类型
      const parsedMimeTypes = mimeTypes
        ? mimeTypes
            .split(",")
            .map((type) => type.trim())
            .filter(Boolean)
        : null;

      // 解析文件大小限制
      const parsedSizeLimit = fileSizeLimit
        ? parseInt(fileSizeLimit, 10)
        : null;

      await updateBucket(bucketId, {
        public: isPublic,
        allowedMimeTypes: parsedMimeTypes,
        fileSizeLimit: parsedSizeLimit,
      });

      toast.success("存储桶更新成功");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("更新存储桶失败:", error);
      toast.error(`更新存储桶失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑存储桶</DialogTitle>
          <DialogDescription>更新存储桶的属性和权限设置</DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bucket-name">存储桶名称</Label>
              <Input
                id="bucket-name"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                disabled
                placeholder="存储桶名称不可修改"
              />
              <p className="text-sm text-gray-500">存储桶名称创建后不可修改</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-size-limit">文件大小限制 (字节)</Label>
              <Input
                id="file-size-limit"
                type="number"
                placeholder="例如: 5242880 (5MB)"
                value={fileSizeLimit}
                onChange={(e) => setFileSizeLimit(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                单个文件的最大大小，以字节为单位。不填则不限制。
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mime-types">允许的MIME类型</Label>
              <Input
                id="mime-types"
                placeholder="例如: image/png, image/jpeg, application/pdf"
                value={mimeTypes}
                onChange={(e) => setMimeTypes(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                以逗号分隔的MIME类型列表，不填则允许所有类型。
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public">公开访问</Label>
                <p className="text-sm text-gray-500">
                  公开存储桶中的文件可以被任何人访问
                </p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isFetching}>
            {isLoading ? "保存中..." : "保存更改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
