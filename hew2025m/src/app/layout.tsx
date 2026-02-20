import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell, ClientProviders } from "@/components";

// せのびゴシックフォントの最適化された読み込み（見出しのみに使用）
const senobiGothic = localFont({
  src: "../../public/fonts/Senobi-Gothic-Regular.woff2",
  variable: "--font-senobi",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "ツリマチ - 釣り人のためのマーケットプレイス",
    template: "%s | ツリマチ",
  },
  description: "釣り用品の売買から釣り情報のシェア、マッチングまで。釣り人の集まる街「ツリマチ」で、もっと釣りを楽しもう。",
  keywords: ["釣り", "フィッシング", "マーケットプレイス", "釣り用品", "中古釣具", "釣り情報"],
  authors: [{ name: "ツリマチ" }],
  creator: "ツリマチ",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "ツリマチ",
    title: "ツリマチ - 釣り人のためのマーケットプレイス",
    description: "釣り用品の売買から釣り情報のシェア、マッチングまで。釣り人の集まる街「ツリマチ」で、もっと釣りを楽しもう。",
  },
  twitter: {
    card: "summary_large_image",
    title: "ツリマチ - 釣り人のためのマーケットプレイス",
    description: "釣り用品の売買から釣り情報のシェア、マッチングまで。釣り人の集まる街「ツリマチ」で、もっと釣りを楽しもう。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={senobiGothic.variable}>
      <body>
        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}
