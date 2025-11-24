import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E3Car 企业账户兑换",
  description: "使用兑换码创建企业账户并可选自动分配 Office 365 E3"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <header className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-semibold text-gray-900">E3Car</a>
            <nav className="flex items-center gap-4">
              <a href="/" className="text-sm text-gray-700 hover:text-gray-900">首页</a>
              <a href="/admin" className="text-sm text-gray-700 hover:text-gray-900">后台</a>
            </nav>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">{children}</div>
      </body>
    </html>
  );
}
