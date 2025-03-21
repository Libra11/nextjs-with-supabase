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

export default function FrontedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <CustomHeader />
      <ToDashboard />

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
