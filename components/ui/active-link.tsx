/**
 * Author: Libra
 * Date: 2025-04-08
 * LastEditors: Libra
 * Description: Active link component for navigation
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ActiveLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  exact?: boolean;
}

export function ActiveLink({
  href,
  children,
  className,
  activeClassName,
  exact = false,
}: ActiveLinkProps) {
  const pathname = usePathname();
  
  // Determine if the link is active
  const isActive = exact 
    ? pathname === href 
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
