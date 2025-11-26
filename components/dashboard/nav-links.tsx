/**
 * Author: Libra
 * Date: 2025-04-08
 * LastEditors: Libra
 * Description: Dashboard navigation links with active state
 */
"use client";

import { ActiveLink } from "@/components/ui/active-link";
import { cn } from "@/lib/utils";
import { ReactNode, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
}

export function NavItem({ href, icon, label, badge }: NavItemProps) {
  return (
    <ActiveLink
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md group transition-colors",
        "hover:bg-primary/10 hover:text-primary"
      )}
      activeClassName="bg-primary/10 text-primary font-medium"
      exact={href === "/dashboard"}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <Badge className="ml-auto bg-primary/15 text-primary hover:bg-primary/20 px-1.5 py-0.5 text-xs">
          {badge}
        </Badge>
      )}
    </ActiveLink>
  );
}

interface NavGroupProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function NavGroup({ icon, label, children, defaultOpen = false }: NavGroupProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // 检查子路径是否为当前活动路径
  const childPaths = Array.isArray(children)
    ? children.map((child: any) => child?.props?.href || "")
    : [];
  
  const isActive = childPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  
  // 使用useEffect只在组件挂载和路径变化时自动展开,而不是每次渲染
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [pathname]);
  
  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2.5 rounded-md transition-colors",
          "hover:bg-primary/10 hover:text-primary",
          isActive && "text-primary bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className={cn("font-medium", isActive && "font-semibold")}>{label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="pl-3 ml-2 border-l border-border/30 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

interface NavSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function NavSection({ title, children, className }: NavSectionProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground px-3 py-2">
        {title}
      </p>
      {children}
    </div>
  );
}
