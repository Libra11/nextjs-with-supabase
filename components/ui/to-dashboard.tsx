/**
 * Author: Libra
 * Date: 2025-03-10 17:32:16
 * LastEditors: Libra
 * Description:
 */
"use client";
import { TvMinimal } from "lucide-react";
import { useRouter } from "next/navigation";

export function ToDashboard() {
  const router = useRouter();
  return (
    <div className="absolute bottom-5 right-5 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer border shadow-lg hover:bg-gray-800 transition-all duration-300">
      <TvMinimal
        className="w-6 h-6"
        onClick={() => {
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
