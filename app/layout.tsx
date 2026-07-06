import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

// 페이지 메타데이터. Next.js가 서버에서 <head>에 넣어준다(SEO에 유리한 부분).
export const metadata: Metadata = {
  title: "Next.js 렌더링 비교 (SSR·SSG·ISR·CSR)",
  description:
    "제조 시스템 UI 포트폴리오에서 Vite(SPA)를 선택한 이유와, Next.js의 4가지 렌더링 방식을 API Route(서버리스 함수)로 실증합니다.",
};

const NAV = [
  { href: "/ssr", label: "SSR" },
  { href: "/ssg", label: "SSG" },
  { href: "/isr", label: "ISR" },
  { href: "/csr", label: "CSR" },
  { href: "/rest-api", label: "REST API" },
  { href: "/swagger", label: "Swagger" },
  { href: "/test", label: "Test" },
  { href: "/threejs", label: "Three.js" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="topnav">
          <div className="topnav-inner">
            <Link href="/" className="brand inline-flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-gradient text-[11px] font-black text-white shadow-soft">
                N
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
