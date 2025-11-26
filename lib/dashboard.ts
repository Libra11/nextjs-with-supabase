/*
 * @Author: Libra
 * @Date: 2025-04-09 02:34:12
 * @LastEditors: Libra
 * @Description: 仪表盘相关数据处理函数
 */

import { createClient as createClientServer } from "@/utils/supabase/server";
import { getBlogStats } from "./blog";
import { getSnippetStats } from "./snippet";

export interface DashboardStats {
  blogCount: number;
  tagCount: number;
  bucketCount: number;
  viewCount: number;
  dayCount: number;
  snippetCount: number;
}

/**
 * 获取存储桶数量 - 服务端版本
 */
export async function getBucketsCount(): Promise<number> {
  try {
    const supabase = await createClientServer();
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("获取存储桶列表失败:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("获取存储桶列表失败:", error);
    return 0;
  }
}

/**
 * 获取仪表盘所有统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // 获取博客统计
    const blogStats = await getBlogStats();

    // 获取片段统计
    const snippetStats = await getSnippetStats();

    // 获取存储桶数量（服务端方式）
    const bucketCount = await getBucketsCount();

    return {
      blogCount: blogStats.blogCount,
      tagCount: blogStats.tagCount,
      bucketCount: bucketCount,
      viewCount: blogStats.viewCount,
      dayCount: blogStats.dayCount,
      snippetCount: snippetStats.snippetCount,
    };
  } catch (error) {
    console.error("获取仪表盘统计数据失败:", error);
    return {
      blogCount: 0,
      tagCount: 0,
      bucketCount: 0,
      viewCount: 0,
      dayCount: 0,
      snippetCount: 0,
    };
  }
}

/**
 * 获取当前用户信息 - 必须在服务端组件中调用
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClientServer();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return data.user;
  } catch (error) {
    console.error("获取当前用户信息失败:", error);
    return null;
  }
}

/**
 * 获取所有仪表盘数据（一次性获取所有所需数据）
 * 注意：此函数必须在服务端组件中调用
 */
export async function getAllDashboardData() {
  try {
    const [stats, user] = await Promise.all([
      getDashboardStats(),
      getCurrentUser(),
    ]);

    return {
      stats,
      user,
    };
  } catch (error) {
    console.error("获取仪表盘所有数据失败:", error);
    return {
      stats: {
        blogCount: 0,
        tagCount: 0,
        bucketCount: 0,
        viewCount: 0,
        dayCount: 0,
        snippetCount: 0,
      },
      user: null,
    };
  }
}
