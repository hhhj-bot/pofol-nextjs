"use client";

import { useState } from "react";

// 랙설계 단계 — 공장·창고 CAD 도면.
// 창고/공장 배치, 랙 구획(수동/자동화), 배치에 맞는 랙 구성 정보,
// 입고·출고 위치, 입출고 이동경로(동선)를 한 도면에 담는다.

type Zone = {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rows: number; // 랙 열
  bays: number; // 베이
  levels: number; // 단
  auto: boolean; // 자동화 구획 여부
  aisle: string; // 통로폭
  equip: string; // 장비
};

const ZONES: Zone[] = [
  { id: "A", name: "일반 파렛트 랙", x: 404, y: 70, w: 196, h: 108, rows: 4, bays: 6, levels: 4, auto: false, aisle: "3.5m", equip: "지게차" },
  { id: "B", name: "일반 파렛트 랙", x: 404, y: 192, w: 196, h: 108, rows: 4, bays: 6, levels: 4, auto: false, aisle: "3.5m", equip: "지게차" },
  { id: "C", name: "중량물 랙", x: 404, y: 314, w: 196, h: 108, rows: 4, bays: 5, levels: 4, auto: false, aisle: "3.5m", equip: "리치트럭" },
  { id: "D", name: "자동화 AS/RS", x: 646, y: 70, w: 150, h: 230, rows: 6, bays: 8, levels: 6, auto: true, aisle: "1.6m", equip: "스태커크레인 + 컨베이어" },
];

const loc = (z: Zone) => z.rows * z.bays * z.levels;

export function FactoryPlan() {
  const [sel, setSel] = useState<string>("D");
  const selected = ZONES.find((z) => z.id === sel);
  const totalLoc = ZONES.reduce((s, z) => s + loc(z), 0);
  const autoLoc = ZONES.filter((z) => z.auto).reduce((s, z) => s + loc(z), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      {/* CAD 도면 */}
      <div className="min-w-0">
        <div className="mb-1.5 text-xs font-semibold text-slate-500">
          창고·공장 배치도 (CAD) — 랙 구획 · 입출고 위치 · 이동경로
        </div>
        <svg viewBox="0 0 920 520" className="w-full rounded-xl border border-slate-200 bg-white">
          <defs>
            <marker id="arrIn" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#d97706" />
            </marker>
            <marker id="arrOut" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb" />
            </marker>
            <pattern id="autoHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#93c5fd" strokeWidth="2" />
            </pattern>
          </defs>

          {/* 타이틀블록 */}
          <text x={16} y={22} fontSize="12" fontWeight="700" className="fill-slate-700">FACTORY &amp; WAREHOUSE LAYOUT</text>
          <text x={16} y={34} fontSize="8" className="fill-slate-400">rev.1 · 단위 mm · 창고 60,000 × 40,000</text>

          {/* 부지 경계 */}
          <rect x={16} y={42} width={888} height={462} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="6 4" />

          {/* 공장동 */}
          <rect x={32} y={60} width={170} height={340} fill="#f8fafc" stroke="#475569" strokeWidth="2" />
          <text x={117} y={78} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-slate-600">공장동 (생산)</text>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={48} y={96 + i * 96} width={138} height={72} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
              <text x={117} y={136 + i * 96} textAnchor="middle" fontSize="9" className="fill-slate-500">생산라인 {i + 1}</text>
            </g>
          ))}

          {/* 공장 → 창고 반입 */}
          <line x1={202} y1={224} x2={256} y2={224} stroke="#d97706" strokeWidth="2" markerEnd="url(#arrIn)" />
          <text x={229} y={216} textAnchor="middle" fontSize="8" fill="#b45309" fontWeight="700">완제품 반입</text>

          {/* 창고동 */}
          <rect x={246} y={48} width={650} height={440} fill="#fff" stroke="#475569" strokeWidth="2.5" />
          <text x={571} y={64} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-slate-600">창고동 (보관 · 입출고)</text>

          {/* 입고장 IN DOCK */}
          <rect x={258} y={78} width={96} height={86} fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          <text x={306} y={110} textAnchor="middle" fontSize="11" fontWeight="700" fill="#b45309">입고장</text>
          <text x={306} y={126} textAnchor="middle" fontSize="9" fill="#b45309">IN DOCK</text>
          <text x={306} y={142} textAnchor="middle" fontSize="7.5" fill="#a16207">트럭 접안 2</text>

          {/* 검수 QC */}
          <rect x={258} y={178} width={96} height={64} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2" />
          <text x={306} y={205} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-slate-600">입고 검수</text>
          <text x={306} y={220} textAnchor="middle" fontSize="7.5" className="fill-slate-400">PDA 스캔 · 송장대조</text>

          {/* 메인 통로 (세로) */}
          <rect x={366} y={70} width={28} height={352} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />
          <text transform="rotate(-90 380 250)" x={380} y={250} textAnchor="middle" fontSize="7.5" fill="#94a3b8">메인 통로 (동선)</text>

          {/* 랙 구획 */}
          {ZONES.map((z) => {
            const on = z.id === sel;
            return (
              <g key={z.id} onClick={() => setSel(z.id)} style={{ cursor: "pointer" }}>
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  fill={z.auto ? "url(#autoHatch)" : "#f1f5f9"}
                  stroke={on ? "#2563eb" : z.auto ? "#3b82f6" : "#94a3b8"}
                  strokeWidth={on ? 3 : 1.2}
                />
                {/* 랙 열(row) 표현 */}
                {Array.from({ length: z.rows }).map((_, r) => (
                  <rect
                    key={r}
                    x={z.x + 8}
                    y={z.y + 20 + r * ((z.h - 28) / z.rows)}
                    width={z.w - 16}
                    height={(z.h - 28) / z.rows - 5}
                    fill={z.auto ? "#2563eb" : "#64748b"}
                    opacity={0.85}
                  />
                ))}
                <text x={z.x + 8} y={z.y + 14} fontSize="10" fontWeight="700" fill={z.auto ? "#1d4ed8" : "#334155"}>
                  ZONE {z.id} · {z.name}
                </text>
                <text x={z.x + z.w - 8} y={z.y + 14} textAnchor="end" fontSize="8" fill={z.auto ? "#1d4ed8" : "#64748b"}>
                  {z.rows}열×{z.bays}베이×{z.levels}단 = {loc(z)} LOC
                </text>
              </g>
            );
          })}
          <text x={721} y={314} textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="700">자동화 구획 (무인)</text>

          {/* 통로2 (세로) */}
          <rect x={610} y={70} width={26} height={352} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />

          {/* 입출고 컨베이어 (자동화 구획 연결) */}
          <line x1={636} y1={92} x2={646} y2={92} stroke="#0ea5e9" strokeWidth="5" />
          <line x1={394} y1={92} x2={610} y2={92} stroke="#0ea5e9" strokeWidth="5" opacity={0.35} />
          <text x={520} y={86} textAnchor="middle" fontSize="7.5" fill="#0284c7" fontWeight="700">입출고 컨베이어</text>

          {/* 피킹 · 출고 스테이징 */}
          <rect x={646} y={330} width={150} height={76} fill="#eff6ff" stroke="#2563eb" strokeWidth="1.2" />
          <text x={721} y={358} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4ed8">피킹 · 출고 스테이징</text>
          <text x={721} y={374} textAnchor="middle" fontSize="7.5" fill="#3b82f6">고객사 주문별 싱글 배열</text>

          {/* 출고장 OUT DOCK */}
          <rect x={806} y={330} width={78} height={76} fill="#dbeafe" stroke="#2563eb" strokeWidth="1.5" />
          <text x={845} y={360} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4ed8">출고장</text>
          <text x={845} y={375} textAnchor="middle" fontSize="8" fill="#1d4ed8">OUT DOCK</text>

          {/* 입고 동선 (amber) */}
          <path d="M 306,164 V 178" fill="none" stroke="#d97706" strokeWidth="2" markerEnd="url(#arrIn)" />
          <path d="M 354,210 H 380 V 400" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#arrIn)" />
          <path d="M 380,124 H 404" fill="none" stroke="#d97706" strokeWidth="1.8" markerEnd="url(#arrIn)" />
          <path d="M 380,246 H 404" fill="none" stroke="#d97706" strokeWidth="1.8" markerEnd="url(#arrIn)" />
          <path d="M 380,368 H 404" fill="none" stroke="#d97706" strokeWidth="1.8" markerEnd="url(#arrIn)" />

          {/* 출고 동선 (blue) */}
          <path d="M 600,150 H 623 V 350 H 646" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3" markerEnd="url(#arrOut)" />
          <path d="M 600,272 H 623" fill="none" stroke="#2563eb" strokeWidth="1.8" markerEnd="url(#arrOut)" />
          <path d="M 600,394 H 623" fill="none" stroke="#2563eb" strokeWidth="1.8" markerEnd="url(#arrOut)" />
          <path d="M 796,368 H 806" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#arrOut)" />
          <path d="M 884,368 H 900" fill="none" stroke="#2563eb" strokeWidth="2" markerEnd="url(#arrOut)" />
          <text x={898} y={360} textAnchor="end" fontSize="8" fill="#1d4ed8" fontWeight="700">출차</text>

          {/* 범례 */}
          <g>
            <line x1={258} y1={470} x2={286} y2={470} stroke="#d97706" strokeWidth="2" strokeDasharray="5 3" />
            <text x={292} y={473} fontSize="8" className="fill-slate-500">입고 동선</text>
            <line x1={356} y1={470} x2={384} y2={470} stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3" />
            <text x={390} y={473} fontSize="8" className="fill-slate-500">출고 동선</text>
            <rect x={452} y={464} width={14} height={12} fill="url(#autoHatch)" stroke="#3b82f6" strokeWidth="1" />
            <text x={472} y={473} fontSize="8" className="fill-slate-500">자동화 구획</text>
            <line x1={556} y1={470} x2={584} y2={470} stroke="#0ea5e9" strokeWidth="5" />
            <text x={590} y={473} fontSize="8" className="fill-slate-500">컨베이어</text>
          </g>
          <text x={884} y={496} textAnchor="end" fontSize="7.5" className="fill-slate-400">도면 클릭 → 랙 구획 선택</text>
        </svg>
      </div>

      {/* 랙 구성 정보 (프로그램 화면) */}
      <aside className="min-w-0">
        <div className="mb-1.5 text-xs font-semibold text-slate-500">랙 구성 정보</div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="text-[11px] text-slate-400">총 로케이션</div>
              <div className="text-lg font-bold text-slate-900">{totalLoc.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-2">
              <div className="text-[11px] text-blue-500">자동화 비율</div>
              <div className="text-lg font-bold text-brand-700">{Math.round((autoLoc / totalLoc) * 100)}%</div>
            </div>
          </div>

          <ul className="space-y-1.5">
            {ZONES.map((z) => {
              const on = z.id === sel;
              return (
                <li key={z.id}>
                  <button
                    type="button"
                    onClick={() => setSel(z.id)}
                    className={
                      "w-full rounded-lg border px-2 py-1.5 text-left transition-colors " +
                      (on ? "border-brand-300 bg-brand-50" : "border-slate-100 hover:bg-slate-50")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">ZONE {z.id}</span>
                      <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (z.auto ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>
                        {z.auto ? "자동" : "수동"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {z.rows}열 × {z.bays}베이 × {z.levels}단 = <strong className="text-slate-600">{loc(z)}</strong> LOC
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50 p-2.5 text-xs leading-relaxed text-slate-600">
              <div className="mb-1 font-semibold text-brand-700">ZONE {selected.id} · {selected.name}</div>
              <div>로케이션 코드: <code>{selected.id}-행-열-단</code> (예: {selected.id}-1-1-1)</div>
              <div>통로폭 {selected.aisle} · 장비 {selected.equip}</div>
              <div>보관능력 {loc(selected).toLocaleString()} 파렛트</div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
