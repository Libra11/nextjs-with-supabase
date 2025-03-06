/**
 * Author: Libra
 * Date: 2025-03-06 20:38:44
 * LastEditors: Libra
 * Description: 自定义头部
 */
"use client";

import { MenuBar } from "@/components/ui/glow-menu";
import { useState } from "react";
import { Home as HomeIcon, Settings, Bell, User } from "lucide-react";
import { SearchBox } from "@/components/ui/search-box/index";
import Image from "next/image";

const menuItems = [
  {
    icon: HomeIcon,
    label: "主页",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
    iconColor: "text-blue-500",
  },
  {
    icon: Bell,
    label: "通知",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: Settings,
    label: "设置",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
  },
  {
    icon: User,
    label: "关于",
    href: "#",
    gradient:
      "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
  },
];

export function CustomHeader() {
  const [activeItem, setActiveItem] = useState<string>("Home");

  return (
    <div className="fixed top-0 left-0 z-50 w-full py-3 px-5 flex justify-between">
      <Image src="/assets/svgs/logo.svg" alt="logo" width={60} height={60} />
      <MenuBar
        items={menuItems}
        activeItem={activeItem}
        onItemClick={setActiveItem}
      />
      <SearchBox />
    </div>
  );
}
