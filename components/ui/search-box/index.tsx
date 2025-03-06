/**
 * Author: Libra
 * Date: 2025-02-23 01:27:47
 * LastEditors: Libra
 * Description:
 */
"use client";

import "./index.css";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBox() {
  return (
    <div className="myInput shadow-lg">
      <Input
        type="text"
        placeholder="请输入搜索内容..."
        className="absolute top-[1px] left-[1px] w-[calc(100%-2px)] h-[calc(100%-2px)] bg-transparent outline-none z-40 p-5 px-9 rounded-2xl focus:outline-none focus-visible:ring-0"
      />
      <Search className="absolute top-[calc(50%-10px)] left-3 bg-transparent outline-none z-50 rounded-2xl text-muted-foreground w-5 h-5" />
    </div>
  );
}
