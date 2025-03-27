/*
 * @Author: Libra
 * @Date: 2025-03-10 15:42:26
 * @LastEditors: Libra
 * @Description:
 */

import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

// 存储桶操作
export async function createBucket(
  id: string,
  options?: {
    public: boolean;
    allowedMimeTypes?: string[] | null;
    fileSizeLimit?: number | string | null;
  }
) {
  try {
    const { data, error } = await supabase.storage.createBucket(id, options);
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("创建存储桶失败:", error);
    throw new Error("创建存储桶失败");
  }
}

export async function getBucket(id: string) {
  try {
    const { data, error } = await supabase.storage.getBucket(id);
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("获取存储桶失败:", error);
    throw new Error("获取存储桶失败");
  }
}

export async function listBuckets() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("获取存储桶列表失败:", error);
    throw new Error("获取存储桶列表失败");
  }
}

export async function updateBucket(
  id: string,
  options: {
    public: boolean;
    allowedMimeTypes?: string[] | null;
    fileSizeLimit?: number | string | null;
  }
) {
  try {
    const { data, error } = await supabase.storage.updateBucket(id, options);
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("更新存储桶失败:", error);
    throw new Error("更新存储桶失败");
  }
}

export async function deleteBucket(id: string) {
  try {
    const { data, error } = await supabase.storage.deleteBucket(id);
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("删除存储桶失败:", error);
    throw new Error("删除存储桶失败");
  }
}

export async function emptyBucket(id: string) {
  try {
    const { data, error } = await supabase.storage.emptyBucket(id);
    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("清空存储桶失败:", error);
    throw new Error("清空存储桶失败");
  }
}

// 文件操作
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    upsert?: boolean;
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options?.cacheControl || "3600",
        upsert: options?.upsert || false,
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("文件上传失败:", error);
    throw new Error("文件上传失败");
  }
}

export async function downloadFile(
  bucket: string,
  path: string,
  options?: {
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "origin";
      resize?: "cover" | "contain" | "fill";
    };
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path, options);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("文件下载失败:", error);
    throw new Error("文件下载失败");
  }
}

export async function listFiles(
  bucket: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: {
      column: string;
      order: "asc" | "desc";
    };
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, options);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("列出文件失败:", error);
    throw new Error("列出文件失败");
  }
}

export async function updateFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    upsert?: boolean;
  }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .update(path, file, options);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("更新文件失败:", error);
    throw new Error("更新文件失败");
  }
}

export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("移动文件失败:", error);
    throw new Error("移动文件失败");
  }
}

export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("复制文件失败:", error);
    throw new Error("复制文件失败");
  }
}

export async function deleteFile(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("文件删除失败:", error);
    throw new Error("文件删除失败");
  }
}

export async function deleteFiles(bucket: string, paths: string[]) {
  try {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("批量删除文件失败:", error);
    throw new Error("批量删除文件失败");
  }
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 60
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("获取签名URL失败:", error);
    throw new Error("获取签名URL失败");
  }
}

export async function getSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn: number = 60
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("获取签名URL列表失败:", error);
    throw new Error("获取签名URL列表失败");
  }
}

export async function createSignedUploadUrl(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("创建签名上传URL失败:", error);
    throw new Error("创建签名上传URL失败");
  }
}

export async function uploadToSignedUrl(
  bucket: string,
  path: string,
  token: string,
  file: File
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("上传到签名URL失败:", error);
    throw new Error("上传到签名URL失败");
  }
}

export async function getPublicUrl(
  bucket: string,
  path: string,
  options?: {
    download?: boolean | string;
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "origin";
      resize?: "cover" | "contain" | "fill";
    };
  }
) {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path, options);
    return data.publicUrl;
  } catch (error) {
    console.error("获取公共URL失败:", error);
    throw new Error("获取公共URL失败");
  }
}
