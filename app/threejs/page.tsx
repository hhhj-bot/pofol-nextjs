"use client";

import { useState } from "react";
import { StackTab } from "./StackTab";
import { RackDesigner } from "./RackDesigner";
import { LoadTab } from "./LoadTab";
import { EquipmentTab } from "./EquipmentTab";

// Three.js 페이지 — 탭 구조.
//  · 적치    : 재고 데이터로 적재율/Capacity를 3D로 보여주는 뷰어 (단계별 학습)
//  · 랙 설계 : 가상의 랙을 만들어 전체/로케이션 크기를 설정하고 정면도로 비주얼
//  · 적재/하중: 설계된 랙에 SKU를 적재하고 하중·적재율을 3D로 확인
//  · 입출고 : GTL 라벨(마스터/싱글) 기준의 출고·배송·입고 검증 흐름 (컨베이어 설비 연동은 추후 별도 탭)

type TabKey = "stack" | "rack" | "load" | "equip";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: "stack", label: "적치", desc: "CAD 도면 기반 적치" },
  { key: "rack", label: "랙 설계", desc: "로케이션 구성 비주얼" },
  { key: "load", label: "적재/하중", desc: "하중 · 적재율 · SKU" },
  { key: "equip", label: "입출고", desc: "검증 · 배송 · 입/출고" },
];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("stack");

  return (
    <main className="container">
      <header className="mode-head">
        <span className="mode-badge">업무PoC</span>
        <h1>업무PoC — 물류 업무 3D 설계</h1>
        <p>물류 업무를 기능별로 상세 설계합니다. 아래 탭에서 랙 설계·적치·적재/하중·입출고를 각각 살펴보세요. (전체 조망은 업무기획 메뉴)</p>
      </header>

      {/* 탭 바 */}
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
                (on
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-slate-700")
              }
            >
              <span className="text-sm font-semibold">{t.label}</span>
              <span className="text-[11px] text-slate-400">{t.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "stack" ? (
          <StackTab />
        ) : tab === "rack" ? (
          <RackDesigner />
        ) : tab === "load" ? (
          <LoadTab />
        ) : (
          <EquipmentTab />
        )}
      </div>
    </main>
  );
}
