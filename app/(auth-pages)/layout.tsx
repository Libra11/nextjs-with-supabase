/**
 * Author: Libra
 * Date: 2025-03-06 10:57:58
 * LastEditors: Libra
 * Description:
 */
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10 bg-background">
        <div className="container mx-auto flex justify-between items-center p-4">
          <Link href="/" className="text-xl font-bold">
            前台系统
          </Link>
          <ThemeSwitcher />
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">{children}</div>
      </div>

      <footer className="w-full border-t border-t-foreground/10 py-4 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 公司名称. 保留所有权利.</p>
        </div>
      </footer>
    </div>
  );
}
