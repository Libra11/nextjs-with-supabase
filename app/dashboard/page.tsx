/**
 * Author: Libra
 * Date: 2025-03-06 15:19:27
 * LastEditors: Libra
 * Description:
 */
import {
  BarChart,
  DollarSign,
  ShoppingBag,
  Users,
  FileCode,
  CalendarCheck,
  ClipboardList,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  BookOpenCheck,
  Rocket,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { getAllDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  // 使用封装好的方法获取所有仪表盘数据
  const { stats, user } = await getAllDashboardData();

  const averageViews = stats.blogCount
    ? Math.round(stats.viewCount / stats.blogCount)
    : 0;
  const tagCoverage = stats.tagCount
    ? (stats.blogCount / stats.tagCount).toFixed(1)
    : "0";
  const productivityScore = stats.blogCount + stats.snippetCount;

  const statsCards = [
    {
      title: "博客数量",
      value: stats.blogCount.toString(),
      helper: `${stats.tagCount} 个标签协同` ,
      trend: `近30天新增 ${Math.min(stats.dayCount, 30)} 篇`,
      gradient: "from-sky-500/15 via-sky-500/5 to-transparent",
      iconBg: "bg-sky-500/15 text-sky-500",
      icon: BarChart,
    },
    {
      title: "累计访问量",
      value: stats.viewCount.toString(),
      helper: `平均 ${averageViews} 次/篇`,
      trend: "内容表现稳健",
      gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/15 text-emerald-500",
      icon: TrendingUp,
    },
    {
      title: "存储桶",
      value: stats.bucketCount.toString(),
      helper: "静态资源一体管理",
      trend: "使用 Supabase 存储",
      gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
      iconBg: "bg-indigo-500/15 text-indigo-500",
      icon: ShoppingBag,
    },
    {
      title: "代码片段",
      value: stats.snippetCount.toString(),
      helper: "复用率不断提升",
      trend: "维护良好的组件库",
      gradient: "from-purple-500/15 via-purple-500/5 to-transparent",
      iconBg: "bg-purple-500/15 text-purple-500",
      icon: FileCode,
    },
    {
      title: "标签覆盖",
      value: tagCoverage,
      helper: "平均每个标签覆盖文章",
      trend: "保持分类均衡",
      gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/15 text-amber-500",
      icon: DollarSign,
    },
    {
      title: "创作能量",
      value: productivityScore.toString(),
      helper: "博客 + 代码片段总和",
      trend: "持续增强的知识库",
      gradient: "from-rose-500/15 via-rose-500/5 to-transparent",
      iconBg: "bg-rose-500/15 text-rose-500",
      icon: Rocket,
    },
  ];

  const quickActions = [
    {
      title: "写一篇新博客",
      description: "打开编辑器，记录最新灵感",
      href: "/dashboard/blogs/new",
      icon: Sparkles,
    },
    {
      title: "创建 HTML 卡片",
      description: "沉淀常用组件或代码片段",
      href: "/dashboard/html-documents/new",
      icon: ClipboardList,
    },
    {
      title: "整理存储资源",
      description: "上传图片、音频等静态资源",
      href: "/dashboard/buckets",
      icon: FolderKanban,
    },
  ];

  const highlightCards = [
    {
      title: "内容空间",
      detail: "博客 · HTML 卡片 · 菜谱系统持续扩容",
      icon: Layers,
    },
    {
      title: "工作计划",
      detail: "设置站点迭代事项与上线时间",
      icon: CalendarCheck,
    },
    {
      title: "系统状态",
      detail: "权限、性能、安全监测全部绿灯",
      icon: ShieldCheck,
    },
  ];

  const insightCards = [
    {
      title: "创作节奏",
      metric: `${Math.min(stats.dayCount, 30)} 篇 / 30 天`,
      description: "保持稳定输出，持续拓展知识版图",
      icon: CalendarCheck,
    },
    {
      title: "知识结构",
      metric: `${stats.tagCount} 个标签`,
      description: "分类体系不断完善，查找效率更高",
      icon: BookOpenCheck,
    },
    {
      title: "服务健康度",
      metric: "正常运行",
      description: "Supabase + Next.js 监控通过",
      icon: ShieldCheck,
    },
  ];

  const activityTimeline = [
    {
      title: "发布新博客",
      time: "今天 10:24",
      detail: "《前端性能优化实战》已上线",
    },
    {
      title: "更新 HTML 卡片",
      time: "昨天 22:11",
      detail: "新增 “React Suspense 模板”",
    },
    {
      title: "代码片段归档",
      time: "本周一",
      detail: "整理 4 个常用工具函数",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border/30 bg-card/90 backdrop-blur px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              欢迎回来
            </p>
            <h1 className="text-2xl font-semibold mt-1">
              {user?.user_metadata?.name || "管理员"}，今日安排开始啦！
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              快速浏览关键指标、最近动态以及推荐操作，让你的知识库持续增长、井井有条。
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/blogs/new"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15"
            >
              <Sparkles size={16} />
              立即创作
            </Link>
            <Link
              href="/dashboard/blogs"
              className="inline-flex items-center gap-2 rounded-xl border border-border/40 bg-background/90 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ClipboardList size={16} />
              查看全部内容
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highlightCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-border/30 bg-card/80 px-5 py-4 shadow-sm flex items-center gap-3"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground">{card.detail}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`relative overflow-hidden rounded-2xl border border-border/30 bg-card/80 p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`}
                />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {card.title}
                    </p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-3xl font-semibold text-foreground">
                        {card.value}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {card.helper}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg} shadow-inner`}
                  >
                    <Icon size={18} />
                  </span>
                </div>
                <p className="mt-4 text-xs text-primary">{card.trend}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border/30 bg-card/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">快捷操作</h2>
              <p className="text-xs text-muted-foreground">
                常用入口触手可及，保持创作节奏
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/40 bg-background/80 px-4 py-3 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">最近动态</h2>
          <p className="text-xs text-muted-foreground mb-4">
            关键操作记录，便于追踪
          </p>
          <div className="space-y-4">
            {activityTimeline.map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="flex gap-3">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-1">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-border/30 bg-card/90 p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <h2 className="text-lg font-semibold">账户概览</h2>
          <p className="text-xs text-muted-foreground mb-4">
            当前登录身份与基本信息
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">电子邮件</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">用户 ID</p>
              <p className="font-mono text-xs">{user?.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">账户创建时间</p>
              <p>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleString("zh-CN")
                  : "未知"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">最后登录</p>
              <p>
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString("zh-CN")
                  : "未知"}
              </p>
            </div>
          </div>
        </div>

        {insightCards.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.title}
              className="rounded-2xl border border-border/30 bg-card/90 p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {insight.metric}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
