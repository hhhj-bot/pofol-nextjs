"use client";

import { useState } from "react";
import Link from "next/link";

// 상단 네비게이션.
//  · 데스크톱(sm+): 링크를 한 줄로 펼쳐서 표시
//  · 모바일: 햄버거 버튼 → 눌러서 아래로 펼쳐지는 메뉴 패널
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

export function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="inline-flex shrink-0 items-center gap-2 font-extrabold text-brand-600 no-underline"
        >
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-brand-gradient text-[11px] font-black text-white shadow-soft">
            N
          </span>
          Next.js 렌더링 데모
        </Link>

        {/* 데스크톱 링크 */}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 no-underline transition-colors hover:bg-brand-50 hover:text-brand-600"
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 sm:hidden"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 펼침 패널 */}
      {open && (
        <div className="border-t border-slate-200 bg-white sm:hidden">
          <div className="mx-auto flex max-w-4xl flex-col px-3 py-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 no-underline transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
