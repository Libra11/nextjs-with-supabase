/**
 * Author: Libra
 * Date: 2025-03-07 17:42:21
 * LastEditors: Libra
 * Description: 前台布局
 */

import { CustomHeader } from "@/components/custom-header";

export default function FrontedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-screen">
      <CustomHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
