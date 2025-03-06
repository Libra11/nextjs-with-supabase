import { createClient } from "@/utils/supabase/server";
import { PlusIcon, Search } from "lucide-react";

export default async function UsersPage() {
  const supabase = await createClient();

  // 示例数据 - 实际中从数据库获取
  const mockUsers = [
    {
      id: 1,
      name: "张三",
      email: "zhangsan@example.com",
      role: "管理员",
      status: "活跃",
      lastActive: "2024-03-06",
    },
    {
      id: 2,
      name: "李四",
      email: "lisi@example.com",
      role: "编辑",
      status: "活跃",
      lastActive: "2024-03-05",
    },
    {
      id: 3,
      name: "王五",
      email: "wangwu@example.com",
      role: "用户",
      status: "休眠",
      lastActive: "2024-02-15",
    },
    {
      id: 4,
      name: "赵六",
      email: "zhaoliu@example.com",
      role: "用户",
      status: "活跃",
      lastActive: "2024-03-04",
    },
    {
      id: 5,
      name: "钱七",
      email: "qianqi@example.com",
      role: "编辑",
      status: "已禁用",
      lastActive: "2024-01-20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户、角色和权限</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-flex items-center gap-2">
          <PlusIcon size={16} />
          添加用户
        </button>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="搜索用户..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
          <option value="">所有角色</option>
          <option value="admin">管理员</option>
          <option value="editor">编辑</option>
          <option value="user">用户</option>
        </select>
        <select className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
          <option value="">所有状态</option>
          <option value="active">活跃</option>
          <option value="inactive">休眠</option>
          <option value="disabled">已禁用</option>
        </select>
      </div>

      {/* 用户列表 */}
      <div className="bg-card border rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="py-3 px-4 text-left font-medium text-sm">
                  用户ID
                </th>
                <th className="py-3 px-4 text-left font-medium text-sm">
                  姓名
                </th>
                <th className="py-3 px-4 text-left font-medium text-sm">
                  Email
                </th>
                <th className="py-3 px-4 text-left font-medium text-sm">
                  角色
                </th>
                <th className="py-3 px-4 text-left font-medium text-sm">
                  状态
                </th>
                <th className="py-3 px-4 text-left font-medium text-sm">
                  最后活动
                </th>
                <th className="py-3 px-4 text-left font-medium text-sm">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="py-3 px-4 text-sm">{user.id}</td>
                  <td className="py-3 px-4 text-sm font-medium">{user.name}</td>
                  <td className="py-3 px-4 text-sm">{user.email}</td>
                  <td className="py-3 px-4 text-sm">{user.role}</td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.status === "活跃"
                          ? "bg-green-100 text-green-800"
                          : user.status === "休眠"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{user.lastActive}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs border rounded hover:bg-accent">
                        编辑
                      </button>
                      <button className="px-2 py-1 text-xs border rounded text-red-500 hover:bg-red-50">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            显示 1 - 5 共 5 记录
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded text-sm hover:bg-accent"
              disabled
            >
              上一页
            </button>
            <button className="px-3 py-1 border rounded text-sm bg-primary text-primary-foreground">
              1
            </button>
            <button
              className="px-3 py-1 border rounded text-sm hover:bg-accent"
              disabled
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
