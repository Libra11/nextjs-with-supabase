/**
 * Author: Libra
 * Date: 2025-03-27
 * LastEditors: Libra
 * Description: 创建存储桶对话框
 */
"use client";

import { useState } from "react";
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
import { createBucket } from "@/lib/bucket";

interface CreateBucketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBucketDialog({
  open,
  onOpenChange,
}: CreateBucketDialogProps) {
  const [bucketId, setBucketId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!bucketId) {
      toast.error("请输入存储桶ID");
      return;
    }

    setIsLoading(true);
    try {
      await createBucket(bucketId, {
        public: isPublic,
        allowedMimeTypes: null,
        fileSizeLimit: null,
      });
      toast.success(`存储桶 ${bucketId} 创建成功`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(`创建存储桶失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBucketId("");
    setIsPublic(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新存储桶</DialogTitle>
          <DialogDescription>
            创建一个新的存储桶来存储文件和媒体。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bucket-id">存储桶 ID</Label>
            <Input
              id="bucket-id"
              placeholder="my-bucket"
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              存储桶 ID 只能包含小写字母、数字和连字符(-)
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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !bucketId}>
            {isLoading ? "创建中..." : "创建存储桶"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
