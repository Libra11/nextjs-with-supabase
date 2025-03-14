/**
 * Author: Libra
 * Date: 2025-03-10 17:32:16
 * LastEditors: Libra
 * Description: 可展开的操作按钮组
 */
"use client";
import { TvMinimal, ChevronUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function ToDashboard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 监听滚动事件，决定是否显示回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始检查

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 回到顶部功能
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
