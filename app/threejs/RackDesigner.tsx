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
  const showLabels = cellW > 24 && cellH > 14;
  const frontFont = cellW < 46 ? 6.5 : 8.5;
  const dimW = overallW.toLocaleString();
  const dimH = overallH.toLocaleString();

  const rows = Array.from({ length: levels });
  const cols = Array.from({ length: bays });

  // ── 평면도: 10,000 x 8,000 창고에 랙을 실제 치수로 스케일 배치 ──
  const WH_W = 10000; // 창고 내부 가로(mm)
  const WH_D = 8000; //  창고 내부 세로(mm)
  const P_VW = 360, P_VH = 232;
  const P_L = 34, P_T = 22, P_R = 18, P_B = 30;
  const pAvailW = P_VW - P_L - P_R;
  const pAvailD = P_VH - P_T - P_B;
  const pScale = Math.min(pAvailW / WH_W, pAvailD / WH_D);
  const whW = WH_W * pScale;
  const whD = WH_D * pScale;
  const whX = P_L + (pAvailW - whW) / 2;
  const whY = P_T;
  const rackFits = overallW <= WH_W; // 랙 전체너비가 창고 폭을 넘는지
  const rackWpx = Math.min(overallW, WH_W) * pScale; // 랙 footprint 폭(스케일)
  const rackDpx = RACK_DEPTH * pScale;
  const rackX = whX + (whW - rackWpx) / 2;
  const frontY = whY + whD * 0.14;
  const backY = whY + whD - whD * 0.14 - rackDpx;
  const aisleY = frontY + rackDpx;
  const aisleH = backY - aisleY;
  const cellWpx = rackWpx / bays;
  const planLabel = cellWpx > 22; // 셀에 로케이션 코드 표시 가능 여부

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
                        <text x={x + cellW / 2} y={y + cellH / 2 + 2.5} textAnchor="middle" fontSize={frontFont} className="fill-slate-500">
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
            <p className="mt-2 text-xs text-slate-400">
              로케이션 코드 = <strong>랙이름-단-베이</strong> (예: {rackName}-{levels}-1 = {levels}단 1베이).
              평면도의 행-열과 합쳐 랙 안 위치를 특정합니다.
            </p>
          </div>

          {/* 평면도 (동선·입고장·출고장·출구) */}
          <div className="min-w-0">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">창고 평면도 (동선 · 입고장 · 출고장 · 출구)</div>
            <svg viewBox={`0 0 ${P_VW} ${P_VH}`} className="w-full rounded-xl border border-slate-200 bg-white">
              {/* 창고 외벽 (10,000 x 8,000 mm) */}
              <rect x={whX} y={whY} width={whW} height={whD} fill="#fff" stroke="#475569" strokeWidth="2.5" />
              <rect x={whX + 3} y={whY + 3} width={whW - 6} height={whD - 6} fill="none" stroke="#e2e8f0" strokeWidth="0.7" />

              {/* 창고 치수 (고정) */}
              <line x1={whX} y1={whY - 8} x2={whX + whW} y2={whY - 8} stroke="#2563eb" strokeWidth="0.8" />
              <text x={whX + whW / 2} y={whY - 11} textAnchor="middle" fontSize="8" fill="#2563eb">10,000</text>
              <text transform={`rotate(-90 ${whX - 9} ${whY + whD / 2})`} x={whX - 9} y={whY + whD / 2} textAnchor="middle" fontSize="8" fill="#2563eb">8,000</text>

              {/* 실시간 정보 (전체너비·베이·칸수) */}
              <text x={whX + 6} y={whY + 13} fontSize="7.5" fill="#334155" fontWeight="700">랙 {rackName}</text>
              <text x={whX + 6} y={whY + 23} fontSize="7" fill={rackFits ? "#475569" : "#dc2626"}>
                너비 {dimW}mm · 베이 {bays} · {bays * 2}칸{rackFits ? "" : " · 창고폭 초과"}
              </text>

              {/* 입고 IN / 출고 OUT (통로 레벨) */}
              <rect x={whX} y={aisleY + aisleH / 2 - 13} width={12} height={26} fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
              <text x={whX + 6} y={aisleY + aisleH / 2 + 2} textAnchor="middle" fontSize="6.5" fill="#b45309" fontWeight="700">IN</text>
              <rect x={whX + whW - 12} y={aisleY + aisleH / 2 - 13} width={12} height={26} fill="#dbeafe" stroke="#2563eb" strokeWidth="0.8" />
              <text x={whX + whW - 6} y={aisleY + aisleH / 2 + 2} textAnchor="middle" fontSize="6" fill="#1d4ed8" fontWeight="700">OUT</text>

              {/* 통로(동선) */}
              <rect x={whX + 14} y={aisleY} width={whW - 28} height={aisleH} fill="#f8fafc" />
              {[0, 1, 2, 3].map((i) => (
                <text key={"ar" + i} x={whX + whW / 2 - 66 + i * 44} y={aisleY + aisleH / 2 + 4} fontSize="12" fill="#2563eb">→</text>
              ))}

              {/* 앞열 (1행) — 실제 치수 스케일 */}
              <rect x={rackX} y={frontY} width={rackWpx} height={rackDpx} fill="#64748b" />
              {Array.from({ length: bays - 1 }).map((_, i) => (
                <line key={"fd" + i} x1={rackX + cellWpx * (i + 1)} y1={frontY} x2={rackX + cellWpx * (i + 1)} y2={frontY + rackDpx} stroke="#cbd5e1" strokeWidth="0.6" />
              ))}
              {Array.from({ length: bays }).map((_, c) => (
                <text key={"fc" + c} x={rackX + cellWpx * (c + 0.5)} y={frontY + rackDpx / 2 + 2} textAnchor="middle" fontSize={planLabel ? 5 : 6} fill="#fff">{planLabel ? `${rackName}-1-${c + 1}` : c + 1}</text>
              ))}
              <text x={rackX + rackWpx + 4} y={frontY + rackDpx / 2 + 2.5} fontSize="6.5" fill="#334155" fontWeight="700">앞열</text>

              {/* 랙 전체너비 치수 (실시간) */}
              <line x1={rackX} y1={frontY + rackDpx + 5} x2={rackX + rackWpx} y2={frontY + rackDpx + 5} stroke="#2563eb" strokeWidth="0.8" />
              <line x1={rackX} y1={frontY + rackDpx + 2} x2={rackX} y2={frontY + rackDpx + 8} stroke="#2563eb" strokeWidth="0.8" />
              <line x1={rackX + rackWpx} y1={frontY + rackDpx + 2} x2={rackX + rackWpx} y2={frontY + rackDpx + 8} stroke="#2563eb" strokeWidth="0.8" />
              <text x={rackX + rackWpx / 2} y={frontY + rackDpx + 14} textAnchor="middle" fontSize="7" fill="#2563eb">전체너비 {dimW}</text>

              {/* 뒷열 (2행) */}
              <rect x={rackX} y={backY} width={rackWpx} height={rackDpx} fill="#64748b" />
              {Array.from({ length: bays - 1 }).map((_, i) => (
                <line key={"bd" + i} x1={rackX + cellWpx * (i + 1)} y1={backY} x2={rackX + cellWpx * (i + 1)} y2={backY + rackDpx} stroke="#cbd5e1" strokeWidth="0.6" />
              ))}
              {Array.from({ length: bays }).map((_, c) => (
                <text key={"bc" + c} x={rackX + cellWpx * (c + 0.5)} y={backY + rackDpx / 2 + 2} textAnchor="middle" fontSize={planLabel ? 5 : 6} fill="#fff">{planLabel ? `${rackName}-2-${c + 1}` : c + 1}</text>
              ))}
              <text x={rackX + rackWpx + 4} y={backY + rackDpx / 2 + 2.5} fontSize="6.5" fill="#334155" fontWeight="700">뒷열</text>

              {/* 출구 EXIT (하단 벽) */}
              <rect x={whX + whW / 2 - 16} y={whY + whD - 4} width={32} height={8} fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
              <text x={whX + whW / 2} y={whY + whD + 15} textAnchor="middle" fontSize="7.5" fill="#166534" fontWeight="700">출구 EXIT</text>
            </svg>
            <p className="mt-2 text-xs text-slate-400">
              <strong>10,000 × 8,000mm</strong> 창고에 랙을 실제 치수로 배치합니다. 랙 설정(베이·로케이션 너비)을 바꾸면
              평면도의 랙 폭·베이·칸수가 실시간으로 반영됩니다. 통로를 사이에 둔 앞열(1행)·뒷열(2행)에 <strong>{rackName}</strong>을
              배치하고, 각 로케이션은 <strong>랙이름-행-열</strong>로 자동 네이밍됩니다 (예: {rackName}-1-1, {rackName}-2-{bays}).
              정면도의 단(레벨)까지 합치면 랙이름-단-베이로 세분화됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
