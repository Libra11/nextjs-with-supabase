/**
 * Author: Libra
 * Date: 2025-04-08
 * LastEditors: Libra
 * Description: Dashboard navigation links with active state
 */
"use client";

import { ActiveLink } from "@/components/ui/active-link";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

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
