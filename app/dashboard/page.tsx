import { BarChart, DollarSign, ShoppingBag, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 模拟数据（实际项目中可从数据库获取）
  const stats = [
    {
      title: "总收入",
      value: "¥23,456",
      change: "+12%",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "新用户",
      value: "156",
      change: "+8%",
      icon: <Users className="h-4 w-4" />,
    },
    {
      title: "订单数",
      value: "326",
      change: "+5%",
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      title: "访问量",
      value: "2,541",
      change: "+18%",
      icon: <BarChart className="h-4 w-4" />,
    },
  ];

  // 最近订单数据
  const recentOrders = [
    {
      id: "ORD001",
      customer: "张三",
      date: "2024-03-01",
      amount: "¥426",
      status: "已完成",
    },
    {
      id: "ORD002",
      customer: "李四",
      date: "2024-03-02",
      amount: "¥195",
      status: "处理中",
    },
    {
      id: "ORD003",
      customer: "王五",
      date: "2024-03-03",
      amount: "¥752",
      status: "已完成",
    },
    {
      id: "ORD004",
      customer: "赵六",
      date: "2024-03-04",
      amount: "¥289",
      status: "已发货",
    },
    {
      id: "ORD005",
      customer: "钱七",
      date: "2024-03-05",
      amount: "¥568",
      status: "处理中",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">欢迎回来，管理员</h1>
      <p className="text-muted-foreground">
        这里是您的管理控制台概览，显示重要指标和最新数据。
      </p>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
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
                <div className="text-xs text-primary mt-1">
                  {stat.change} 相比上月
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="bg-card border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-medium">最近订单</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium text-sm">
                    订单编号
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-sm">
                    客户
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-sm">
                    日期
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-sm">
                    金额
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-sm">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 hover:bg-muted/50"
                  >
                    <td className="py-3 px-4 text-sm">{order.id}</td>
                    <td className="py-3 px-4 text-sm">{order.customer}</td>
                    <td className="py-3 px-4 text-sm">{order.date}</td>
                    <td className="py-3 px-4 text-sm">{order.amount}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "已完成"
                            ? "bg-green-100 text-green-800"
                            : order.status === "处理中"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">管理选项</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-3 py-2 border rounded-md text-sm hover:bg-accent">
                    修改密码
                  </button>
                  <button className="px-3 py-2 border rounded-md text-sm hover:bg-accent">
                    更新资料
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
