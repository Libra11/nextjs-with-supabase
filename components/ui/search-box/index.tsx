/**
 * Author: Libra
 * Date: 2025-02-23 01:27:47
 * LastEditors: Libra
 * Description:
 */
"use client";

import "./index.css";
import { Input } from "@/components/ui/input";
import { Search, Command } from "lucide-react";
import { openCommandSearch } from "@/components/ui/command-search";

export function SearchBox() {
  // 处理搜索框点击事件
  const handleSearchFocus = () => {
    // 调用全局搜索弹窗打开函数
    openCommandSearch();
  };

  return (
    <>
      {/* 桌面版搜索框 */}
      <div className="myInput shadow-lg relative " onClick={handleSearchFocus}>
        <Input
          type="text"
          placeholder="搜索文章和标签..."
          className="absolute top-[1px] left-[1px] w-[calc(100%-2px)] h-[calc(100%-2px)] bg-transparent outline-none z-40 p-5 px-9 rounded-2xl focus:outline-none focus-visible:ring-0 cursor-pointer"
          readOnly
          onFocus={handleSearchFocus}
        />
        <Search className="absolute top-[calc(50%-10px)] left-3 bg-transparent outline-none z-50 rounded-2xl text-muted-foreground w-5 h-5" />
        <div className="absolute right-3 top-[calc(50%-10px)] flex items-center gap-1 z-50 bg-muted/80 rounded px-1.5 py-0.5 text-xs text-muted-foreground">
          <Command className="h-3 w-3" />
          <span>K</span>
        </div>
      </div>
    </>
  );
}
