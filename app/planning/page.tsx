"use client";

import { useState } from "react";
import { FlowTab } from "./FlowTab";
import { ImplTab } from "./ImplTab";
import { ReportTab } from "./ReportTab";

// 업무기획 — 두 개의 탭.
//   업무흐름 : 전체 물류 업무를 도식으로 조망
//   업무구현 : 상단 전체 관제화면 + 단계별 구현(랙설계부터)

type TabKey = "flow" | "impl" | "report";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: "flow", label: "업무흐름", desc: "도식화 · 전체 조망" },
  { key: "impl", label: "업무구현", desc: "관제화면 · 단계별 구현" },
  { key: "report", label: "업무리포트", desc: "리포트 · 대시보드 양식" },
];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("flow");

  return (
    <main className="container">
      <header className="mode-head">
        <span className="mode-badge">업무기획</span>
        <h1>업무기획 — 제조물류 시뮬레이션</h1>
        <p>
          <strong>업무흐름</strong>에서 제조물류 전체를 도식으로 조망하고, <strong>업무구현</strong>에서
          관제화면과 함께 공장·창고 설계부터 입고 → 생산 → 출고까지 단계별로 구현합니다.
        </p>
      </header>

      <div className="mt-5 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                "-mb-px flex flex-col items-start border-b-2 px-4 py-2 text-left transition-colors " +
                (on ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700")
              }
            >
              <span className="text-sm font-semibold">{t.label}</span>
              <span className="text-[11px] text-slate-400">{t.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "flow" ? <FlowTab /> : tab === "impl" ? <ImplTab /> : <ReportTab />}
      </div>
    </main>
  );
}
