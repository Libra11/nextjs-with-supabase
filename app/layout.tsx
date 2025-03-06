/**
 * Author: Libra
 * Date: 2025-03-06 10:57:58
 * LastEditors: Libra
 * Description:
 */
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { CustomHeader } from "@/components/custom-header";
import SplashCursor from "@/components/blocks/Animations/SplashCursor/SplashCursor";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "后台管理系统",
  description: "前台与后台管理系统",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen w-screen">
            <SplashCursor />
            <CustomHeader />
            <div className="flex-1 pt-16">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
