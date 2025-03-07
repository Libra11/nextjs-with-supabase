/**
 * Author: Libra
 * Date: 2025-03-06 15:18:54
 * LastEditors: Libra
 * Description:
 */
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Home, Users, LogOut, User, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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
      <div className="w-64 border-r border-r-foreground/10 py-4 flex flex-col h-full">
        <div className="px-4 mb-6">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            <span className="font-semibold">返回前台</span>
          </Link>
        </div>
        <div className="px-4 py-2">
          <h2 className="text-xl font-bold">后台管理系统</h2>
        </div>
        <nav className="flex-1 px-2 mt-6 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent group"
          >
            <Home
              size={20}
              className="text-muted-foreground group-hover:text-foreground"
            />
            <span>首页</span>
          </Link>
          <Link
            href="/dashboard/users"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent group"
          >
            <Users
              size={20}
              className="text-muted-foreground group-hover:text-foreground"
            />
            <span>用户管理</span>
          </Link>
          <Link
            href="/dashboard/blogs"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent group"
          >
            <FileText
              size={20}
              className="text-muted-foreground group-hover:text-foreground"
            />
            <span>博客管理</span>
          </Link>
        </nav>
        <div className="mt-auto px-2">
          <div className="border-t border-t-foreground/10 pt-4 pb-2 px-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">管理员</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <form action="/api/auth/sign-out" method="post">
                <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  <LogOut size={16} />
                  <span>退出登录</span>
                </button>
              </form>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="border-b border-b-foreground/10 bg-background h-14">
          <div className="h-full flex items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-medium">后台管理</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                {new Date().toLocaleDateString("zh-CN")}
              </div>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
