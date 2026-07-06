"use client";

import { useState } from "react";

// 가상의 랙을 생성하는 탭.
// 랙 전체가 아니라 "레벨(단) × 베이(열)"와 로케이션 한 칸의 크기를 입력하면,
// 전체 너비/높이를 계산해 랙 정면도(로케이션 격자)로 비주얼한다.

function clampInt(v: number, min: number, max: number) {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function RackDesigner() {
  const [rackName, setRackName] = useState("R1");
  const [levels, setLevels] = useState(4); // 단(레벨) 수
  const [bays, setBays] = useState(5); // 베이(열) 수
  const [locW, setLocW] = useState(1100); // 로케이션 한 칸 너비 (mm)
  const [locH, setLocH] = useState(1500); // 로케이션 한 칸 높이 (mm)

  const overallW = bays * locW;
  const overallH = levels * locH;
  const locationCount = bays * levels;

  // SVG 정면도 좌표 계산
  const PAD_L = 12;
  const PAD_T = 12;
  const PAD_R = 12;
  const PAD_B = 12;
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
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(clampInt(Number(e.target.value), min, max))}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800 focus:border-brand-400 focus:outline-none"
        />
        {suffix && <span className="text-[11px] text-slate-400">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        가상의 랙을 만들어 봅니다. 단(레벨)과 베이(열) 수, 로케이션 한 칸의 너비·높이를 입력하면
        전체 크기를 계산해 정면도로 그려 줍니다. 실제 3D는 이 값으로 박스를 세우면 됩니다.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr]">
        {/* 입력 폼 */}
        <div className="card">
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
              <div className="text-sm font-bold text-brand-700">{overallW.toLocaleString()}mm</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">전체 높이</div>
              <div className="text-sm font-bold text-brand-700">{overallH.toLocaleString()}mm</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">로케이션</div>
              <div className="text-sm font-bold text-brand-700">{locationCount}칸</div>
            </div>
          </div>
        </div>

        {/* 정면도 비주얼 */}
        <div className="min-w-0">
          <div className="mb-1.5 text-xs font-semibold text-slate-500">랙 정면도 (로케이션 격자)</div>
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full rounded-xl border border-slate-200 bg-white">
            {/* 랙 외곽 프레임 */}
            <rect
              x={originX - 3}
              y={originY - 3}
              width={drawW + 6}
              height={drawH + 6}
              rx={4}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={3}
            />
            {rows.map((_, row) =>
              cols.map((__, col) => {
                const x = originX + col * cellW;
                const y = originY + row * cellH;
                const level = levels - row; // 위쪽이 높은 단
                const bay = col + 1;
                return (
                  <g key={`${row}-${col}`}>
                    <rect
                      x={x}
                      y={y}
                      width={cellW}
                      height={cellH}
                      fill="#eff6ff"
                      stroke="#bfdbfe"
                      strokeWidth={1}
                    />
                    {showLabels && (
                      <text
                        x={x + cellW / 2}
                        y={y + cellH / 2 + 3}
                        textAnchor="middle"
                        fontSize="9"
                        className="fill-slate-500"
                      >
                        {rackName}-{level}-{bay}
                      </text>
                    )}
                  </g>
                );
              })
            )}
          </svg>
          <p className="mt-2 text-xs text-slate-400">
            로케이션 코드 = 랙이름-단-베이 (예: {rackName}-{levels}-1 은 최상단 첫 베이). 값이 클수록 칸이 작게 축소돼 표시됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
