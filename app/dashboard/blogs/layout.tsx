/**
 * Author: Libra
 * Date: 2025-03-07 18:08:36
 * LastEditors: Libra
 * Description:
 */
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

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
