import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TopNav } from "./components/TopNav";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// 페이지 메타데이터. Next.js가 서버에서 <head>에 넣어준다(SEO에 유리한 부분).
export const metadata: Metadata = {
  title: "Next.js 렌더링 비교 (SSR·SSG·ISR·CSR)",
  description:
    "제조 시스템 UI 포트폴리오에서 Vite(SPA)를 선택한 이유와, Next.js의 4가지 렌더링 방식을 API Route(서버리스 함수)로 실증합니다.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <TopNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
