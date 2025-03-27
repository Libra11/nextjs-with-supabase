/**
 * Author: Libra
 * Date: 2025-03-27
 * LastEditors: Libra
 * Description: 存储桶列表组件
 */
"use client";

import { useEffect, useState } from "react";
import {
  listBuckets,
  deleteBucket,
  updateBucket,
  emptyBucket,
} from "@/lib/bucket";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash,
  Lock,
  Unlock,
  RefreshCw,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditBucketDialog from "./edit-bucket-dialog";

interface BucketsListProps {
  onSelectBucket: (bucketId: string) => void;
  selectedBucket: string | null;
}

interface Bucket {
  id: string;
  name: string;
  public: boolean;
  created_at: string;
  owner: string;
}

export default function BucketsList({
  onSelectBucket,
  selectedBucket,
}: BucketsListProps) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBucket, setActionBucket] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmptyDialogOpen, setIsEmptyDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      setLoading(true);
      const data = await listBuckets();
      console.log(data);
      setBuckets(data || []);
    } catch (error) {
      toast.error("加载存储桶失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!actionBucket) return;

    try {
      await deleteBucket(actionBucket);
      toast.success("存储桶已删除");
      loadBuckets();
      if (selectedBucket === actionBucket) {
        onSelectBucket("");
      }
    } catch (error) {
      toast.error("删除存储桶失败，请确保存储桶为空");
      console.error(error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEmpty = async () => {
    if (!actionBucket) return;

    try {
      await emptyBucket(actionBucket);
      toast.success("存储桶已清空");
    } catch (error) {
      toast.error("清空存储桶失败");
      console.error(error);
    } finally {
      setIsEmptyDialogOpen(false);
    }
  };

  const togglePublic = async (bucket: Bucket) => {
    try {
      await updateBucket(bucket.id, {
        public: !bucket.public,
        allowedMimeTypes: null,
        fileSizeLimit: null,
      });
      toast.success(`存储桶已${!bucket.public ? "设为公开" : "设为私有"}`);
      loadBuckets();
    } catch (error) {
      toast.error("更新存储桶失败");
      console.error(error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {loading ? (
        <div className="col-span-full flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : buckets.length === 0 ? (
        <div className="col-span-full text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">暂无存储桶</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            点击"创建存储桶"按钮创建一个新的存储桶
          </p>
        </div>
      ) : (
        buckets.map((bucket) => (
          <Card
            key={bucket.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedBucket === bucket.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => onSelectBucket(bucket.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">{bucket.name}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  创建于 {new Date(bucket.created_at).toLocaleString()}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionBucket(bucket.id);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>编辑</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePublic(bucket);
                    }}
                  >
                    {bucket.public ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        <span>设为私有</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" />
                        <span>设为公开</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionBucket(bucket.id);
                      setIsEmptyDialogOpen(true);
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>清空存储桶</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionBucket(bucket.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>删除</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={bucket.public ? "default" : "outline"}>
                  {bucket.public ? "公开" : "私有"}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="pt-1">
              <p className="text-xs text-gray-500">ID: {bucket.id}</p>
            </CardFooter>
          </Card>
        ))
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除存储桶</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该存储桶及其所有设置。
              <br />
              <br />
              <strong className="font-semibold">注意：</strong>{" "}
              您需要先清空存储桶才能删除它。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空存储桶</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该存储桶中的所有文件。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmpty}
              className="bg-destructive text-destructive-foreground"
            >
              清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {actionBucket && (
        <EditBucketDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          bucketId={actionBucket}
          onSuccess={loadBuckets}
        />
      )}
    </div>
  );
}
