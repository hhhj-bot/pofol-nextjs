"use client";

import { useState, useEffect } from "react";

// 랙 설계 탭.
// 단(레벨)×베이(열)와 로케이션 크기를 입력하면 전체 높이·너비를 계산해
// 정면도(치수 포함)와 평면도(동선·입고장·출고장·출구)로 보여준다.

function clampInt(v: number, min: number, max: number) {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, Math.round(v)));
}

// 숫자 입력 — 편집 중에는 자유 입력, 포커스가 빠질 때만 min~max로 정리한다.
// (매 키 입력마다 clamp 하면 100 뒤에 숫자가 붙는 문제가 생겨서 draft 문자열로 분리)
function NumberInput({
  value,
  min,
  max,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onFocus={() => setEditing(true)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        setDraft(raw);
        if (raw !== "") onCommit(Math.min(max, Number(raw))); // 편집 중엔 상한만
      }}
      onBlur={() => {
        setEditing(false);
        const v = draft === "" ? min : clampInt(Number(draft), min, max);
        onCommit(v);
        setDraft(String(v));
      }}
      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none"
    />
  );
}

const RACK_DEPTH = 1100; // 랙 안길이(mm) — 평면도 footprint용

export function RackDesigner() {
  const [rackName, setRackName] = useState("R1");
  const [levels, setLevels] = useState(4);
  const [bays, setBays] = useState(5);
  const [locW, setLocW] = useState(1100);
  const [locH, setLocH] = useState(1500);

  const overallW = bays * locW;
  const overallH = levels * locH;
  const locationCount = bays * levels;

  // ── 정면도 좌표 (치수 여백 포함) ──
  const PAD_L = 30;
  const PAD_T = 14;
  const PAD_R = 14;
  const PAD_B = 30;
  const VIEW_W = 360;
  const VIEW_H = 250;
  const availW = VIEW_W - PAD_L - PAD_R;
  const availH = VIEW_H - PAD_T - PAD_B;
  const scale = Math.min(availW / overallW, availH / overallH);
  const cellW = locW * scale;
  const cellH = locH * scale;
  const drawW = overallW * scale;
  const drawH = overallH * scale;
  const originX = PAD_L + (availW - drawW) / 2;
  const originY = PAD_T + (availH - drawH) / 2;
  const showLabels = cellW > 38 && cellH > 22;
  const dimW = overallW.toLocaleString();
  const dimH = overallH.toLocaleString();

  const rows = Array.from({ length: levels });
  const cols = Array.from({ length: bays });

  const numberField = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    min: number,
    max: number,
    suffix?: string
  ) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <div className="flex items-center gap-1">
        <NumberInput value={value} min={min} max={max} onCommit={onChange} />
        {suffix && <span className="text-[11px] text-slate-400">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        단(레벨)·베이(열) 수와 로케이션 크기를 입력하면 랙의 <strong>전체 높이·너비</strong>를 치수와 함께
        정면도로 그리고, 창고 <strong>평면도</strong>에 동선(통로)·입고장·출고장·출구까지 배치해 보여줍니다.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[240px_1fr]">
        {/* 입력 폼 */}
        <div className="card self-start">
          <h3 className="mb-3 font-semibold text-slate-900">랙 설정</h3>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
              랙 이름
              <input
                type="text"
                value={rackName}
                onChange={(e) => setRackName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              {numberField("단(레벨) 수", levels, setLevels, 1, 10)}
              {numberField("베이(열) 수", bays, setBays, 1, 15)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {numberField("로케이션 너비", locW, setLocW, 100, 5000, "mm")}
              {numberField("로케이션 높이", locH, setLocH, 100, 5000, "mm")}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
            <div>
              <div className="text-[11px] text-slate-400">전체 너비</div>
              <div className="text-sm font-bold text-brand-700">{dimW}mm</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">전체 높이</div>
              <div className="text-sm font-bold text-brand-700">{dimH}mm</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">로케이션</div>
              <div className="text-sm font-bold text-brand-700">{locationCount}칸</div>
            </div>
          </div>
        </div>

        {/* 정면도 + 평면도 */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* 정면도 (치수 포함) */}
          <div className="min-w-0">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">랙 정면도 (치수 · 로케이션 격자)</div>
            <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full rounded-xl border border-slate-200 bg-white">
              {/* 랙 외곽 프레임 */}
              <rect x={originX - 3} y={originY - 3} width={drawW + 6} height={drawH + 6} rx={4} fill="none" stroke="#475569" strokeWidth={3} />

              {rows.map((_, row) =>
                cols.map((__, col) => {
                  const x = originX + col * cellW;
                  const y = originY + row * cellH;
                  const level = levels - row;
                  const bay = col + 1;
                  return (
                    <g key={`${row}-${col}`}>
                      <rect x={x} y={y} width={cellW} height={cellH} fill="#eff6ff" stroke="#bfdbfe" strokeWidth={1} />
                      {showLabels && (
                        <text x={x + cellW / 2} y={y + cellH / 2 + 3} textAnchor="middle" fontSize="9" className="fill-slate-500">
                          {rackName}-{level}-{bay}
                        </text>
                      )}
                    </g>
                  );
                })
              )}

              {/* 하단 너비 치수 */}
              <line x1={originX} y1={originY + drawH + 16} x2={originX + drawW} y2={originY + drawH + 16} stroke="#2563eb" strokeWidth="0.9" />
              <line x1={originX} y1={originY + drawH + 12} x2={originX} y2={originY + drawH + 20} stroke="#2563eb" strokeWidth="0.9" />
              <line x1={originX + drawW} y1={originY + drawH + 12} x2={originX + drawW} y2={originY + drawH + 20} stroke="#2563eb" strokeWidth="0.9" />
              <text x={originX + drawW / 2} y={originY + drawH + 28} textAnchor="middle" fontSize="9" fill="#2563eb">전체 너비 {dimW}</text>

              {/* 좌측 높이 치수 */}
              <line x1={originX - 16} y1={originY} x2={originX - 16} y2={originY + drawH} stroke="#2563eb" strokeWidth="0.9" />
              <line x1={originX - 20} y1={originY} x2={originX - 12} y2={originY} stroke="#2563eb" strokeWidth="0.9" />
              <line x1={originX - 20} y1={originY + drawH} x2={originX - 12} y2={originY + drawH} stroke="#2563eb" strokeWidth="0.9" />
              <text transform={`rotate(-90 ${originX - 22} ${originY + drawH / 2})`} x={originX - 22} y={originY + drawH / 2} textAnchor="middle" fontSize="9" fill="#2563eb">전체 높이 {dimH}</text>
            </svg>
          </div>

          {/* 평면도 (동선·입고장·출고장·출구) */}
          <div className="min-w-0">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">창고 평면도 (동선 · 입고장 · 출고장 · 출구)</div>
            <svg viewBox="0 0 360 170" className="w-full rounded-xl border border-slate-200 bg-white">
              {/* 창고 외벽 */}
              <rect x={14} y={12} width={332} height={126} fill="#fff" stroke="#475569" strokeWidth="2.5" />

              {/* 입고장 IN (좌측) */}
              <rect x={14} y={40} width={26} height={44} fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
              <text x={27} y={58} textAnchor="middle" fontSize="8" fill="#b45309" fontWeight="700">입고</text>
              <text x={27} y={70} textAnchor="middle" fontSize="8" fill="#b45309" fontWeight="700">IN</text>

              {/* 출고장 OUT (우측) */}
              <rect x={320} y={40} width={26} height={44} fill="#dbeafe" stroke="#2563eb" strokeWidth="1" />
              <text x={333} y={58} textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="700">출고</text>
              <text x={333} y={70} textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="700">OUT</text>

              {/* 랙 두 열 (footprint, top view) */}
              <rect x={72} y={36} width={216} height={20} fill="#64748b" />
              <rect x={72} y={94} width={216} height={20} fill="#64748b" />
              <text x={180} y={50} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">{rackName} 앞열 · {bays}베이 · W {dimW} × D {RACK_DEPTH.toLocaleString()}</text>
              <text x={180} y={108} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">{rackName} 뒷열 · {bays}베이</text>

              {/* 동선(통로) — 랙 사이 + 흐름 화살표 */}
              <rect x={48} y={58} width={264} height={34} fill="#f1f5f9" />
              <text x={58} y={78} fontSize="7.5" fill="#94a3b8">통로(동선)</text>
              {[0, 1, 2, 3].map((i) => (
                <text key={i} x={120 + i * 48} y={79} fontSize="12" fill="#2563eb">→</text>
              ))}
              {/* 입고 → 통로 → 출고 흐름 */}
              <text x={44} y={66} fontSize="12" fill="#d97706">→</text>
              <text x={310} y={66} fontSize="12" fill="#2563eb">→</text>

              {/* 출구 EXIT (하단 벽 개구부) */}
              <rect x={164} y={132} width={32} height={8} fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
              <text x={180} y={152} textAnchor="middle" fontSize="8" fill="#166534" fontWeight="700">출구 EXIT</text>
              <text x={180} y={128} textAnchor="middle" fontSize="11" fill="#16a34a">↓</text>
            </svg>
            <p className="mt-2 text-xs text-slate-400">
              입고장(IN) → 통로(동선) → 랙 적치 → 출고장(OUT) 흐름과 비상 출구(EXIT)를 함께 배치합니다.
              앞열·뒷열은 <strong>같은 {rackName} 설계</strong>를 통로 양쪽에 마주보게 놓은 예시입니다(별도 랙 아님).
              로케이션 코드 = 랙이름-단-베이 (예: {rackName}-{levels}-1).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
