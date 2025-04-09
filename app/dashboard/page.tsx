/**
 * Author: Libra
 * Date: 2025-03-06 15:19:27
 * LastEditors: Libra
 * Description:
 */
import { BarChart, DollarSign, ShoppingBag, Users } from "lucide-react";
import { getAllDashboardData } from "@/lib/dashboard";

export default async function DashboardPage() {
  // 使用封装好的方法获取所有仪表盘数据
  const { stats, user } = await getAllDashboardData();

  // 统计卡片数据
  const statsCards = [
    {
      title: "博客数量",
      value: stats.blogCount.toString(),
      change: `+${stats.dayCount > 30 ? 30 : stats.dayCount}天`,
      icon: <BarChart className="h-4 w-4" />,
    },
    {
      title: "存储桶数",
      value: stats.bucketCount.toString(),
      change: "云存储",
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      title: "访问量",
      value: stats.viewCount.toString(),
      change: "总计",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "标签数量",
      value: stats.tagCount.toString(),
      change: "分类",
      icon: <DollarSign className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        欢迎回来，{user?.user_metadata?.name || "管理员"}
      </h1>
      <p className="text-muted-foreground">
        这里是您的管理控制台概览，显示重要指标和最新数据。
      </p>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-card border rounded-lg p-6 shadow-sm flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">{stat.title}</span>
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                {stat.icon}
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-primary mt-1">{stat.change}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* 用户信息 */}
        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">您的账户信息</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  电子邮件
                </h3>
                <p>{user?.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  用户ID
                </h3>
                <p className="text-sm font-mono">{user?.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  账户创建时间
                </h3>
                <p>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleString("zh-CN")
                    : "未知"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  最后登录
                </h3>
                <p>
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString("zh-CN")
                    : "未知"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
