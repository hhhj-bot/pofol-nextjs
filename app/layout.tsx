import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

// 페이지 메타데이터 — Next.js가 SSR 단계에서 <head>에 주입 (SEO 이점 예시)
export const metadata: Metadata = {
  title: "Next.js 렌더링 비교 (SSR·SSG·ISR·CSR)",
  description:
    "제조 시스템 UI 포트폴리오에서 Vite(SPA)를 선택한 이유와, Next.js의 4가지 렌더링 방식을 API Route(서버리스 함수)로 실증합니다.",
};

const NAV = [
  { href: "/", label: "비교 홈" },
  { href: "/ssr", label: "SSR" },
  { href: "/ssg", label: "SSG" },
  { href: "/isr", label: "ISR" },
  { href: "/csr", label: "CSR" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="topnav">
          <div className="topnav-inner">
            <Link href="/" className="brand inline-flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-gradient text-[11px] font-black text-white shadow-soft">
                ▲
              </span>
              Next.js 렌더링 데모
            </Link>
            <div className="topnav-links">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>{n.label}</Link>
              ))}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
