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
//  · 설비 연동: 창고(WMS)와 설비(컨베이어·IoT·PLC)를 REST API로 이어 실데이터로 구동

type TabKey = "stack" | "rack" | "load" | "equip";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: "stack", label: "적치", desc: "적재율 · Capacity 뷰어" },
  { key: "rack", label: "랙 설계", desc: "로케이션 구성 비주얼" },
  { key: "load", label: "적재/하중", desc: "하중 · 적재율 · SKU" },
  { key: "equip", label: "설비 연동", desc: "컨베이어 · IoT · PLC" },
];

export default function Page() {
  const [tab, setTab] = useState<TabKey>("stack");

  return (
    <main className="container">
      <header className="mode-head">
        <span className="mode-badge">Three.js</span>
        <h1>Three.js — 3D 자재창고 뷰어</h1>
        <p>재고 로직(소프트웨어)과 물리 창고(랙·로케이션)를 잇는 3D 뷰어입니다. 아래 탭에서 기능별로 살펴보세요.</p>
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
