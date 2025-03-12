/**
 * Author: Libra
 * Date: 2025-03-11 15:09:25
 * LastEditors: Libra
 * Description:
 */
"use client";
import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <Skeleton className="w-full h-4" />
      <div className="w-full flex space-x-4">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 flex-1" />
      </div>
      <div className="w-full flex space-x-4">
        <Skeleton className="h-4 w-[500px]" />
        <Skeleton className="h-4 flex-1" />
      </div>
    </div>
  );
};

export default Loading;
