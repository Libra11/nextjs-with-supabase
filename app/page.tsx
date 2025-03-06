import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex flex-col">
      {/* 前台导航栏 */}
      <nav className="w-full border-b border-b-foreground/10 bg-background">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              前台系统
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/products" className="hover:text-primary">
                产品
              </Link>
              <Link href="/services" className="hover:text-primary">
                服务
              </Link>
              <Link href="/about" className="hover:text-primary">
                关于我们
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  进入后台
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  登录
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  注册
                </Link>
              </div>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* 前台内容 */}
      <div className="flex-1">
        <section className="py-24 bg-gradient-to-b from-background to-muted">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              欢迎来到我们的平台
            </h1>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              这是前台系统的首页，提供产品展示和用户服务
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                浏览产品
              </Link>
              <Link
                href="/sign-up"
                className="px-6 py-3 border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
              >
                立即注册
              </Link>
            </div>
          </div>
        </section>

        {/* 更多前台内容 */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">我们的服务</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-semibold mb-3">
                    服务项目 {item}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    这里是服务项目的详细描述，展示服务的特点和优势。
                  </p>
                  <Link
                    href={`/services/${item}`}
                    className="text-primary hover:underline"
                  >
                    了解更多
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 前台页脚 */}
      <footer className="w-full border-t border-t-foreground/10 py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">关于我们</h3>
              <p className="text-sm text-muted-foreground">
                我们是一家专注于提供高质量服务的公司，致力于为客户创造价值。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">服务</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/services/1" className="hover:text-primary">
                    服务项目 1
                  </Link>
                </li>
                <li>
                  <Link href="/services/2" className="hover:text-primary">
                    服务项目 2
                  </Link>
                </li>
                <li>
                  <Link href="/services/3" className="hover:text-primary">
                    服务项目 3
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">联系我们</h3>
              <ul className="space-y-2 text-sm">
                <li>联系电话: 123-456-7890</li>
                <li>电子邮件: contact@example.com</li>
                <li>地址: 某某市某某区某某路88号</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">关注我们</h3>
              <div className="flex gap-4">
                <a href="#" className="hover:text-primary">
                  微信
                </a>
                <a href="#" className="hover:text-primary">
                  微博
                </a>
                <a href="#" className="hover:text-primary">
                  抖音
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-t-foreground/10 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} 公司名称. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
