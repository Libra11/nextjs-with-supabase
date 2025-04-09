/**
 * Author: Libra
 * Date: 2025-03-06 15:18:54
 * LastEditors: Libra
 * Description:
 */
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Home,
  LogOut,
  FileText,
  Tag,
  Settings,
  LayoutDashboard,
  Image,
  Bell,
  LayoutDashboardIcon,
} from "lucide-react";
import Link from "next/link";
import { NavItem, NavSection } from "@/components/dashboard/nav-links";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <div className="w-72 bg-card shadow-md flex flex-col h-full relative z-10">
        <div className="px-6 py-6 border-b border-border/40">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <LayoutDashboard size={18} className="text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              管理系统
            </h2>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            <span>返回前台</span>
          </Link>
        </div>

        <div className="px-4 py-4">
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-muted text-sm text-muted-foreground">
              <Bell size={16} />
              <span>最近更新: 2025年04月08日</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <NavSection title="主菜单">
            <NavItem
              href="/dashboard"
              icon={<Home size={18} />}
              label="控制台"
            />
          </NavSection>

          <NavSection title="内容管理" className="mt-6">
            <NavItem
              href="/dashboard/blogs"
              icon={<FileText size={18} />}
              label="博客列表"
              badge="新建"
            />
            <NavItem
              href="/dashboard/tags"
              icon={<Tag size={18} />}
              label="标签管理"
            />
            <NavItem
              href="/dashboard/buckets"
              icon={<Image size={18} />}
              label="存储桶管理"
            />
          </NavSection>

          <NavSection title="系统设置" className="mt-6">
            <NavItem
              href="/dashboard/settings"
              icon={<Settings size={18} />}
              label="系统设置"
            />
          </NavSection>
        </nav>

        <div className="mt-auto px-3 pb-6 pt-2">
          <div className="border-t border-border/40 pt-4 px-2">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10 border border-border bg-muted">
                <AvatarImage src="" alt={user.email || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{user.email}</p>
                <p className="text-xs text-muted-foreground">管理员</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <form action="/api/auth/sign-out" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground px-2 h-8"
                >
                  <LogOut size={14} className="mr-1.5" />
                  <span className="text-xs">退出登录</span>
                </Button>
              </form>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/30">
        {/* 顶部导航栏 - 简洁设计 */}
        <header className="bg-background border-b border-border/40">
          <div className="h-20 flex items-center justify-between px-6">
            <div className="flex items-center">
              {/* 加个图标 */}
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-3">
                <LayoutDashboardIcon
                  size={18}
                  className="text-primary-foreground"
                />
              </div>
              <h1 className="text-xl font-semibold">博客管理系统</h1>
              <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                管理员
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 relative"
                >
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-foreground/70 ring-2 ring-background"></span>
                </Button>
              </div>

              <div className="flex items-center border-l border-border/40 ml-2 pl-4">
                <Avatar className="h-8 w-8 border border-border/60">
                  <AvatarFallback className="bg-muted text-foreground">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 内容区域 - 简洁版 */}
        <main className="flex-1 overflow-auto p-4">
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
