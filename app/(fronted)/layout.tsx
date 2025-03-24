/**
 * Author: Libra
 * Date: 2025-03-07 17:42:21
 * LastEditors: Libra
 * Description: 前台布局
 */
"use client";
import { CustomHeader } from "@/components/custom-header";
import { ToDashboard } from "@/components/ui/to-dashboard";
import { PresenceAnimation } from "@/components/ui/presence-animation";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import dynamic from "next/dynamic";

// 动态导入，避免SSR问题
const CommandSearch = dynamic(
  () =>
    import("@/components/ui/command-search").then((mod) => mod.CommandSearch),
  { ssr: false }
);

export default function FrontedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <CustomHeader />
      <ToDashboard />
      <CommandSearch />

      <PresenceAnimation>
        <div className="flex-1 pt-32 max-w-[1200px] mx-auto">
          <ProgressProvider
            height="4px"
            color="#fffd00"
            options={{ showSpinner: false }}
            shallowRouting
          >
            {children}
          </ProgressProvider>
        </div>
      </PresenceAnimation>
    </div>
  );
}
