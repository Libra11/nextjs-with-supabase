/**
 * Author: Libra
 * Date: 2025-03-06 21:30:00
 * LastEditors: Libra
 * Description: 移动端抽屉组件
 */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface DrawerItem {
  icon: React.ElementType;
  label: string;
  href: string;
  gradient?: string;
  iconColor?: string;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: DrawerItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
  logoComponent?: React.ReactNode;
  position?: "left" | "right";
  width?: string;
  showBackdrop?: boolean;
}

export function MobileDrawer({
  isOpen,
  onClose,
  items,
  activeItem,
  onItemClick,
  logoComponent,
  position = "right",
  width = "w-72",
  showBackdrop = true,
}: MobileDrawerProps) {
  // 点击菜单项
  const handleItemClick = (label: string) => {
    onItemClick?.(label);
    onClose();
  };

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const drawerVariants = {
    hidden: {
      x: position === "right" ? "100%" : "-100%",
      opacity: 0.5,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
    exit: {
      x: position === "right" ? "100%" : "-100%",
      opacity: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 400,
      },
    },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      transition: { delay: 0.1, duration: 0.2 },
    },
  };

  // 列表项动画
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: position === "right" ? 20 : -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* 背景蒙层 */}
          {showBackdrop && (
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={onClose}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={backdropVariants}
            />
          )}

          {/* 抽屉内容 */}
          <motion.div
            className={cn(
              "absolute top-0 h-full bg-gradient-to-b from-background/90 to-background/70 backdrop-blur-xl border-l border-border/40 p-5 overflow-y-auto z-[110]",
              width,
              position === "right" ? "right-0" : "left-0",
              position === "left"
                ? "border-r border-l-0"
                : "border-l border-r-0"
            )}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
          >
            {/* 顶部区域 */}
            <div className="flex items-center justify-between mb-8">
              {/* Logo或自定义组件 */}
              <div className="flex-1">{logoComponent}</div>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-lg border border-border/40 transition-colors duration-200"
                aria-label="关闭菜单"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* 菜单项列表 */}
            <motion.nav
              className="space-y-2 mt-2"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeItem;
                const iconColor = item.iconColor || "text-primary";
                const gradient =
                  item.gradient ||
                  "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)";

                return (
                  <motion.div key={item.label} variants={itemVariants}>
                    <Link
                      href={item.href}
                      onClick={() => handleItemClick(item.label)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl relative transition-all duration-200 overflow-hidden",
                        isActive
                          ? `${iconColor} font-medium`
                          : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      )}
                    >
                      {/* 选中背景效果 */}
                      {isActive && (
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            background: `linear-gradient(135deg, ${getColorFromClass(iconColor)} 0%, transparent 80%)`,
                          }}
                        />
                      )}
                      <div
                        className={cn(
                          "relative p-2 rounded-lg",
                          isActive ? iconColor : "text-muted-foreground"
                        )}
                        style={{
                          background: isActive ? gradient : "transparent",
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>

            {/* 底部区域 - 可选内容 */}
            <div className="absolute bottom-8 left-0 right-0 px-5">
              <div className="text-sm text-muted-foreground text-center">
                <div className="flex items-center justify-center mt-6 space-x-4">
                  <div className="h-[1px] flex-1 bg-border/50"></div>
                  <span>Libra的博客</span>
                  <div className="h-[1px] flex-1 bg-border/50"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function getColorFromClass(colorClass: string): string {
  // 根据Tailwind的颜色类名提取颜色
  const colorMap = {
    "text-blue-500": "rgb(59, 130, 246)",
    "text-red-500": "rgb(239, 68, 68)",
    "text-green-500": "rgb(34, 197, 94)",
    "text-yellow-500": "rgb(234, 179, 8)",
    "text-purple-500": "rgb(168, 85, 247)",
    "text-pink-500": "rgb(236, 72, 153)",
    "text-indigo-500": "rgb(99, 102, 241)",
    "text-orange-500": "rgb(249, 115, 22)",
    "text-primary": "var(--primary)",
  };

  return colorMap[colorClass] || colorMap["text-primary"];
}
