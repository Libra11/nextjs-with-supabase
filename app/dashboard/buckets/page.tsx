/**
 * Author: Libra
 * Date: 2025-03-27 10:29:40
 * LastEditors: Libra
 * Description: 存储桶管理页面
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BucketsList from "./components/buckets-list";
import BucketFiles from "./components/bucket-files";
import CreateBucketDialog from "./components/create-bucket-dialog";
import { Toaster } from "sonner";

export default function BucketsPage() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="py-6 space-y-6">
      <Toaster position="top-right" />

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">存储桶管理</h1>
          <p className="text-muted-foreground mt-1">
            管理 Supabase 存储桶和文件
          </p>
        </div>
        <div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            创建存储桶
          </Button>
        </div>
      </div>

      <Tabs defaultValue="buckets" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="buckets">存储桶</TabsTrigger>
          {selectedBucket && <TabsTrigger value="files">文件管理</TabsTrigger>}
        </TabsList>
        <TabsContent value="buckets">
          <BucketsList
            onSelectBucket={setSelectedBucket}
            selectedBucket={selectedBucket}
          />
        </TabsContent>
        {selectedBucket && (
          <TabsContent value="files">
            <BucketFiles bucketId={selectedBucket} />
          </TabsContent>
        )}
      </Tabs>

      <CreateBucketDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
