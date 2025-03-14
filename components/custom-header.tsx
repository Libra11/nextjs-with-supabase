/**
 * Author: Libra
 * Date: 2025-03-06 20:38:44
 * LastEditors: Libra
 * Description: 自定义头部
 */
"use client";

import { MenuBar } from "@/components/ui/glow-menu";
import { useState, useEffect } from "react";
import { Home as HomeIcon, Bell, Menu, User } from "lucide-react";
import { SearchBox } from "@/components/ui/search-box/index";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedLogo } from "@/components/ui/animated-logo";

const menuItems = [
  {
    icon: HomeIcon,
    label: "主页",
    href: "/home",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: Bell,
    label: "博客",
    href: "/blogs",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: Bell,
    label: "菜谱",
    href: "/recipes",
    gradient:
      "radial-gradient(circle, rgba(215,22,249,0.15) 0%, rgba(234,12,230,0.06) 50%, rgba(191,12,194,0) 100%)",
    iconColor: "text-purple-500",
  },
  {
    icon: Menu,
    label: "简历",
    href: "/resume",
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: User,
    label: "关于",
    href: "/about",
    gradient:
      "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
];

export function CustomHeader() {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<string>("主页");
  const router = useRouter();

  useEffect(() => {
    // 处理根路径特殊情况
    if (pathname === "/") {
      setActiveItem("主页");
      return;
    }

    // 使用startsWith而不是全等比较，这样子路径也能正确匹配
    // 先查找最长匹配，避免短路径误匹配
    const sortedItems = [...menuItems].sort(
      (a, b) => b.href.length - a.href.length
    );
    const currentMenuItem = sortedItems.find(
      (item) =>
        // 确保是路径开始部分匹配，且为完整路径段落匹配
        // 例如：/blogs 匹配 /blogs/123，但 /blo 不匹配 /blogs
        pathname.startsWith(item.href) &&
        (pathname === item.href || pathname.charAt(item.href.length) === "/")
    );

    if (currentMenuItem) {
      setActiveItem(currentMenuItem.label);
    }
  }, [pathname]);

  const handleItemClick = (label: string) => {
    setActiveItem(label);
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-full py-3 px-5 flex justify-between items-center">
      <AnimatedLogo href="/" className="ml-1" />
      <MenuBar
        items={menuItems}
        activeItem={activeItem}
        onItemClick={handleItemClick}
      />
      <div className="flex items-center gap-2">
        <SearchBox />
      </div>
    </div>
  );
}
