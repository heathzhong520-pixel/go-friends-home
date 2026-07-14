import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://gofren.cn:8081"),
  title: "GoFriends — 做有用的数字工具",
  description: "GoFriends 独立开发者官网：持续打磨网站、桌面应用与小工具，为真实的问题做清晰的解法。",
  icons: {
    icon: [{ url: "/gofriends-logo.png", type: "image/png" }],
    apple: "/gofriends-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ? <script defer src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL} data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID} /> : null}
      </body>
    </html>
  );
}
