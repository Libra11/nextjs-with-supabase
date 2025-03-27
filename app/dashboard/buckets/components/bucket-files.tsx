/**
 * Author: Libra
 * Date: 2025-03-27
 * LastEditors: Libra
 * Description: 存储桶文件管理组件
 */
"use client";

import { useEffect, useState } from "react";
import {
  listFiles,
  uploadFile as uploadFileToStorage,
  getPublicUrl,
  deleteFile,
  moveFile,
  copyFile,
  deleteFiles,
} from "@/lib/bucket";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Download,
  Trash,
  Upload,
  FolderPlus,
  Copy,
  FileSymlink,
  Image as ImageIcon,
  File as FileIcon,
  ArrowLeft,
  Folder,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";

interface BucketFilesProps {
  bucketId: string;
}

interface FileObject {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export default function BucketFiles({ bucketId }: BucketFilesProps) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] =
    useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [moveDestination, setMoveDestination] = useState("");
  const [copyDestination, setCopyDestination] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // 定义isFolder函数，确保在loadFiles之前可用
  const isFolder = (file: FileObject) => {
    // 文件夹通常没有metadata.mimetype属性，或metadata本身可能为空
    const hasFileMetadata = !!file.metadata && !!file.metadata?.mimetype;
    return !hasFileMetadata;
  };

  useEffect(() => {
    if (bucketId) {
      loadFiles();
    }
  }, [bucketId, currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const data = await listFiles(bucketId, currentPath);
      // 确保数据存在
      const filesData = data || [];

      // 对文件进行排序：先文件夹，后文件
      // 使用isFolder函数而不是直接根据文件名判断
      const sortedData = [...filesData].sort((a, b) => {
        // 使用isFolder函数判断，而不是只看文件名
        const aIsFolder = isFolder(a);
        const bIsFolder = isFolder(b);
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(sortedData);
    } catch (error) {
      toast.error("加载文件失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload) return;

    try {
      const path = currentPath
        ? `${currentPath}/${fileToUpload.name}`
        : fileToUpload.name;
      await uploadFileToStorage(bucketId, path, fileToUpload, { upsert: true });
      toast.success("文件上传成功");
      loadFiles();
      setIsUploadDialogOpen(false);
      setFileToUpload(null);
    } catch (error) {
      toast.error("文件上传失败");
      console.error(error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    try {
      // 创建文件夹路径，确保以斜杠结尾
      const folderPath = currentPath
        ? `${currentPath}/${newFolderName}/`
        : `${newFolderName}/`;

      // 方法1: 创建一个空文件作为文件夹标记
      const emptyFile = new File([""], ".keep", {
        type: "text/plain",
      });

      // 上传.keep文件到文件夹中
      await uploadFileToStorage(bucketId, `${folderPath}.keep`, emptyFile);

      // 方法2: 尝试创建以斜杠结尾的路径（针对某些支持直接创建文件夹的存储系统）
      try {
        // 创建一个空字节数组，模拟"文件夹"本身
        const emptyFolder = new File([], folderPath, {
          type: "application/x-directory",
        });
        await uploadFileToStorage(bucketId, folderPath, emptyFolder, {
          upsert: true,
        });
      } catch (error) {
        // 忽略此错误，因为某些存储系统不支持直接创建文件夹
        console.log("直接创建文件夹失败，将依赖.keep文件作为标记");
      }

      toast.success("文件夹创建成功");
      loadFiles();
      setIsNewFolderDialogOpen(false);
      setNewFolderName("");
    } catch (error) {
      toast.error("文件夹创建失败");
      console.error(error);
    }
  };

  const handleDeleteFile = async () => {
    if (!selectedFile) return;

    try {
      const path = currentPath
        ? `${currentPath}/${selectedFile.name}`
        : selectedFile.name;

      await deleteFile(bucketId, path);
      toast.success("文件删除成功");
      loadFiles();
    } catch (error) {
      toast.error("文件删除失败");
      console.error(error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      setLoading(true);
      const path = currentPath
        ? `${currentPath}/${folderToDelete}/`
        : `${folderToDelete}/`;

      // 先列出文件夹中的所有文件
      const folderFiles = await listFiles(bucketId, path);

      if (folderFiles && folderFiles.length > 0) {
        // 构建所有文件的路径
        const filePaths = folderFiles.map((file) => `${path}${file.name}`);

        // 批量删除文件
        await deleteFiles(bucketId, filePaths);
      }

      // 删除文件夹标记文件（如果存在）
      try {
        await deleteFile(bucketId, `${path}.keep`);
      } catch (error) {
        // 忽略标记文件不存在的错误
        console.log("标记文件不存在或删除失败，继续操作");
      }

      toast.success("文件夹删除成功");
      loadFiles();
    } catch (error) {
      toast.error("文件夹删除失败");
      console.error(error);
    } finally {
      setIsDeleteFolderDialogOpen(false);
      setFolderToDelete("");
      setLoading(false);
    }
  };

  const handleMoveFile = async () => {
    if (!selectedFile || !moveDestination) return;

    try {
      const fromPath = currentPath
        ? `${currentPath}/${selectedFile.name}`
        : selectedFile.name;

      const toPath = moveDestination.startsWith("/")
        ? moveDestination.substring(1) + "/" + selectedFile.name
        : moveDestination + "/" + selectedFile.name;

      await moveFile(bucketId, fromPath, toPath);
      toast.success("文件移动成功");
      loadFiles();
    } catch (error) {
      toast.error("文件移动失败");
      console.error(error);
    } finally {
      setIsMoveDialogOpen(false);
      setMoveDestination("");
      setSelectedFile(null);
    }
  };

  const handleCopyFile = async () => {
    if (!selectedFile || !copyDestination) return;

    try {
      const fromPath = currentPath
        ? `${currentPath}/${selectedFile.name}`
        : selectedFile.name;

      const toPath = copyDestination.startsWith("/")
        ? copyDestination.substring(1) + "/" + selectedFile.name
        : copyDestination + "/" + selectedFile.name;

      await copyFile(bucketId, fromPath, toPath);
      toast.success("文件复制成功");
      loadFiles();
    } catch (error) {
      toast.error("文件复制失败");
      console.error(error);
    } finally {
      setIsCopyDialogOpen(false);
      setCopyDestination("");
      setSelectedFile(null);
    }
  };

  const downloadFile = async (file: FileObject) => {
    try {
      const path = currentPath ? `${currentPath}/${file.name}` : file.name;

      const url = await getPublicUrl(bucketId, path);

      // 创建一个临时链接并点击它来下载文件
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error("文件下载失败");
      console.error(error);
    }
  };

  const navigateToFolder = (folderName: string) => {
    if (folderName === "..") {
      // 向上导航
      const pathParts = currentPath.split("/");
      pathParts.pop();
      setCurrentPath(pathParts.join("/"));
    } else {
      // 向下导航
      setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
    }
  };

  const getFileIcon = (file: FileObject) => {
    if (isFolder(file)) {
      return <Folder className="h-4 w-4 mr-2 text-blue-500" />;
    }

    if (file.metadata?.mimetype?.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4 mr-2 text-green-500" />;
    }

    return <FileIcon className="h-4 w-4 mr-2 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "N/A";

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getFileName = (file: FileObject) => {
    return file.name;
  };

  const renderBreadcrumbs = () => {
    const pathParts = currentPath ? currentPath.split("/").filter(Boolean) : [];

    return (
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={() => setCurrentPath("")}
          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center"
        >
          <Folder className="h-3 w-3 mr-1 text-blue-500" />
          根目录
        </button>

        {pathParts.map((part, index) => (
          <div key={index} className="flex items-center">
            <span className="mx-1">/</span>
            <button
              onClick={() =>
                setCurrentPath(pathParts.slice(0, index + 1).join("/"))
              }
              className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center"
            >
              <Folder className="h-3 w-3 mr-1 text-blue-500" />
              {part}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {currentPath && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateToFolder("..")}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {renderBreadcrumbs()}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsNewFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            新建文件夹
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            上传文件
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">此文件夹为空</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            上传文件或创建新文件夹
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>修改时间</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell
                  className={`flex items-center ${
                    isFolder(file) ? "cursor-pointer hover:underline" : ""
                  }`}
                  onClick={() =>
                    isFolder(file) && navigateToFolder(getFileName(file))
                  }
                >
                  {getFileIcon(file)}
                  {getFileName(file)}
                </TableCell>
                <TableCell>
                  {isFolder(file)
                    ? "文件夹"
                    : file.metadata?.mimetype || "未知"}
                </TableCell>
                <TableCell>
                  {isFolder(file)
                    ? "-"
                    : formatFileSize(file.metadata?.size || 0)}
                </TableCell>
                <TableCell>
                  {new Date(
                    file.updated_at || file.created_at
                  ).toLocaleString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isFolder(file) && (
                        <DropdownMenuItem onClick={() => downloadFile(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          <span>下载</span>
                        </DropdownMenuItem>
                      )}

                      {!isFolder(file) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedFile(file);
                              setIsMoveDialogOpen(true);
                            }}
                          >
                            <FileSymlink className="mr-2 h-4 w-4" />
                            <span>移动</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedFile(file);
                              setIsCopyDialogOpen(true);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            <span>复制</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      <DropdownMenuSeparator />

                      {isFolder(file) ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setFolderToDelete(getFileName(file));
                            setIsDeleteFolderDialogOpen(true);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>删除文件夹</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedFile(file);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>删除</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 上传文件对话框 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
            <DialogDescription>选择要上传到当前目录的文件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">文件</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-sm text-gray-500">
              当前目录: {currentPath || "根目录"}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setFileToUpload(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleFileUpload} disabled={!fileToUpload}>
              上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建文件夹对话框 */}
      <Dialog
        open={isNewFolderDialogOpen}
        onOpenChange={setIsNewFolderDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>输入新文件夹的名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">文件夹名称</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="new-folder"
              />
            </div>
            <p className="text-sm text-gray-500">
              当前目录: {currentPath || "根目录"}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewFolderDialogOpen(false);
                setNewFolderName("");
              }}
            >
              取消
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移动文件对话框 */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移动文件</DialogTitle>
            <DialogDescription>
              输入目标文件夹路径，例如 "images" 或 "folder/subfolder"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="moveDestination">目标路径</Label>
              <Input
                id="moveDestination"
                value={moveDestination}
                onChange={(e) => setMoveDestination(e.target.value)}
                placeholder="目标文件夹路径"
              />
            </div>
            <p className="text-sm text-gray-500">
              当前文件: {selectedFile?.name}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMoveDialogOpen(false);
                setMoveDestination("");
                setSelectedFile(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleMoveFile} disabled={!moveDestination}>
              移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 复制文件对话框 */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>复制文件</DialogTitle>
            <DialogDescription>
              输入目标文件夹路径，例如 "images" 或 "folder/subfolder"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="copyDestination">目标路径</Label>
              <Input
                id="copyDestination"
                value={copyDestination}
                onChange={(e) => setCopyDestination(e.target.value)}
                placeholder="目标文件夹路径"
              />
            </div>
            <p className="text-sm text-gray-500">
              当前文件: {selectedFile?.name}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCopyDialogOpen(false);
                setCopyDestination("");
                setSelectedFile(null);
              }}
            >
              取消
            </Button>
            <Button onClick={handleCopyFile} disabled={!copyDestination}>
              复制
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除文件对话框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文件</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该文件。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedFile(null);
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除文件夹对话框 */}
      <AlertDialog
        open={isDeleteFolderDialogOpen}
        onOpenChange={setIsDeleteFolderDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文件夹</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除该文件夹及其中的所有文件。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setFolderToDelete("");
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground"
            >
              删除文件夹
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
