/**
 * Author: Libra
 * Date: 2025-03-10 17:32:16
 * LastEditors: Libra
 * Description: 可展开的操作按钮组
 */
"use client";
import { TvMinimal, ChevronUp, Plus, Sun, Moon, Laptop } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type ThemeOption = "light" | "dark" | "system";

export function ToDashboard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // 找到可滚动容器
  useEffect(() => {
    // 尝试获取主要滚动容器，这里假设是一个有特定 ID 或类名的元素
    // 可以根据您的实际 DOM 结构调整选择器
    const container = document.querySelector(".main-container");

    if (container) {
      scrollContainerRef.current = container as HTMLElement;

      // 监听容器的滚动事件
      const handleScroll = () => {
        if (scrollContainerRef.current) {
          setShowScrollTop(scrollContainerRef.current.scrollTop > 300);
        }
      };

      scrollContainerRef.current.addEventListener("scroll", handleScroll);
      handleScroll(); // 初始检查

      return () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener(
            "scroll",
            handleScroll
          );
        }
      };
    } else {
      // 如果找不到特定容器，回退到 window 滚动
      const handleWindowScroll = () => {
        setShowScrollTop(window.scrollY > 300);
      };

      window.addEventListener("scroll", handleWindowScroll);
      handleWindowScroll(); // 初始检查

      return () => window.removeEventListener("scroll", handleWindowScroll);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 回到顶部功能
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const preference = (theme as ThemeOption) ?? "system";
  const currentTheme: ThemeOption = theme
    ? preference
    : ("system" as ThemeOption);
  const displayTheme: ThemeOption = currentTheme === "system"
    ? ((resolvedTheme as ThemeOption) ?? "system")
    : currentTheme;

  const gradientClasses: Record<ThemeOption, string> = {
    light: "bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500",
    dark: "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900",
    system: "bg-gradient-to-br from-sky-500 via-blue-600 to-purple-600",
  };

  const subtleGlowClasses: Record<ThemeOption, string> = {
    light: "from-amber-200 via-orange-300 to-rose-400",
    dark: "from-indigo-400 via-slate-500 to-slate-800",
    system: "from-blue-400 via-sky-400 to-purple-500",
  };

  const themeLabelMap: Record<ThemeOption, string> = {
    light: "明亮模式",
    dark: "暗色模式",
    system: "跟随系统",
  };

  const cycleTheme = () => {
    const order: ThemeOption[] = ["light", "dark", "system"];
    const currentIndex = order.indexOf(preference);
    const nextTheme = order[(currentIndex + 1) % order.length];
    setTheme(nextTheme);
  };

  const renderThemeIcon = () => {
    const iconProps = {
      className: "w-5 h-5 text-white relative z-10 transition-transform duration-300 group-hover:scale-110",
    };

    if (!mounted) {
      return <Laptop {...iconProps} />;
    }

    if (currentTheme === "light") {
      return <Sun {...iconProps} />;
    }

    if (currentTheme === "dark") {
      return <Moon {...iconProps} />;
    }

    return <Laptop {...iconProps} />;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end space-y-3">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 回到顶部按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative group"
            >
              <button
                onClick={scrollToTop}
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                disabled={!showScrollTop}
              >
                {/* 背景渐变 */}
                <div
                  className={`absolute inset-0 rounded-full ${showScrollTop ? "bg-gradient-to-br from-blue-500 to-purple-500 opacity-80" : "bg-gray-500/50"}`}
                ></div>

                {/* 发光效果 */}
                <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-sm bg-gradient-to-r from-blue-400 to-purple-500"></div>

                {/* 图标 */}
                <ChevronUp
                  className={`w-5 h-5 relative z-10 transition-transform duration-300 ${showScrollTop ? "text-white group-hover:scale-110" : "text-gray-300"}`}
                />

                {/* 提示文字 */}
                <div className="absolute right-full mr-2 bg-gray-900/80 backdrop-blur-sm text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  回到顶部
                </div>
              </button>
            </motion.div>

            {/* 主题切换按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.03 }}
              className="relative group"
            >
              <button
                onClick={cycleTheme}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 ${
                  gradientClasses[currentTheme]
                }`}
                disabled={!mounted}
              >
                <div
                  className={`absolute inset-[1px] rounded-full bg-gradient-to-br opacity-90 ${subtleGlowClasses[displayTheme]}`}
                ></div>

                <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-sm bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>

                <div className="absolute inset-[3px] rounded-full bg-gradient-to-t from-black/20 via-black/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent"></div>

                {renderThemeIcon()}

                <div className="absolute right-full mr-2 bg-gray-900/80 dark:bg-gray-900/80 backdrop-blur-sm text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  切换主题 · {themeLabelMap[currentTheme]}
                </div>
              </button>
            </motion.div>

            {/* 管理后台按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="relative group"
            >
              <button
                onClick={() => router.push("/dashboard")}
                className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
              >
                {/* 背景渐变 */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-80"></div>

                {/* 发光效果 */}
                <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-sm bg-gradient-to-r from-blue-400 to-purple-500"></div>

                {/* 图标 */}
                <TvMinimal className="w-5 h-5 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />

                {/* 提示文字 */}
                <div className="absolute right-full mr-2 bg-gray-900/80 backdrop-blur-sm text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  进入管理后台
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 主按钮 - 展开/收起 */}
      <motion.div whileTap={{ scale: 0.95 }} className="relative group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
        >
          {/* 背景渐变 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-80"></div>

          {/* 发光效果 */}
          <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300 blur-sm bg-gradient-to-r from-blue-400 to-purple-500"></div>

          {/* 脉冲动画 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 animate-ping opacity-20"></div>

          {/* 图标 */}
          <Plus
            className="w-5 h-5 text-white relative z-10 transition-all duration-300 group-hover:scale-110"
            style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
          />

          {/* 提示文字 */}
          <div className="absolute right-full mr-2 bg-gray-900/80 backdrop-blur-sm text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {isOpen ? "收起菜单" : "展开菜单"}
          </div>
        </button>
      </motion.div>
    </div>
  );
}
