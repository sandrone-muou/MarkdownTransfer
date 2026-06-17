import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown Transfer - Markdown 转富文本工具",
  description:
    "Markdown Transfer 是一款简洁优雅的 Markdown 转富文本工具。在浏览器中完成所有转换，无需服务器，支持实时预览、一键复制到 Word、导出 Word/TXT 文件。",
  keywords: ["Markdown", "富文本", "Word", "转换器", "markdown to word", "复制粘贴", "在线工具"],
  other: {
    "msvalidate.01": "08207684CC345ACFD9CF9B8B6A42BF4A",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
