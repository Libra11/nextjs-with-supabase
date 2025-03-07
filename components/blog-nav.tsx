"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Tag } from "lucide-react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors",
        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function BlogNav() {
  return (
    <div className="flex border-b pb-4 gap-4">
      <NavLink href="/dashboard/blogs">
        <FileText size={16} />
        <span>博客列表</span>
      </NavLink>
      <NavLink href="/dashboard/blogs/tags">
        <Tag size={16} />
        <span>标签管理</span>
      </NavLink>
    </div>
  );
}
