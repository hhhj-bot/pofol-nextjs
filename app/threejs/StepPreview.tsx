"use client";

// 각 스텝의 "결과 화면"을 의존성 없이 보여주는 SVG 미리보기.
// 실제 three.js로 만들 결과를 top-down 히트맵 형태로 근사한다.
// (스텝 1: 빈 씬 / 2: 랙 배치 / 3: 적재율 색칠 / 4: capacity 패널 / 5: 평치 vs 자동화)

export type Rack = {
  id: string;
  row: number; // 0~2
  col: number; // 0~4
  rate: number; // 적재율 0~1
  stayDays: number; // 평균 보관일수
};

export const RACKS: Rack[] = [
  { id: "A-01", row: 0, col: 0, rate: 0.42, stayDays: 12 },
  { id: "A-02", row: 0, col: 1, rate: 0.55, stayDays: 20 },
  { id: "A-03", row: 0, col: 2, rate: 0.88, stayDays: 41 },
  { id: "A-04", row: 0, col: 3, rate: 0.30, stayDays: 8 },
  { id: "A-05", row: 0, col: 4, rate: 0.70, stayDays: 25 },
  { id: "B-01", row: 1, col: 0, rate: 0.95, stayDays: 63 },
  { id: "B-02", row: 1, col: 1, rate: 0.60, stayDays: 18 },
  { id: "B-03", row: 1, col: 2, rate: 0.82, stayDays: 35 },
  { id: "B-04", row: 1, col: 3, rate: 0.45, stayDays: 10 },
  { id: "B-05", row: 1, col: 4, rate: 0.90, stayDays: 48 },
  { id: "C-01", row: 2, col: 0, rate: 0.50, stayDays: 15 },
  { id: "C-02", row: 2, col: 1, rate: 0.75, stayDays: 30 },
  { id: "C-03", row: 2, col: 2, rate: 0.68, stayDays: 22 },
  { id: "C-04", row: 2, col: 3, rate: 0.92, stayDays: 55 },
  { id: "C-05", row: 2, col: 4, rate: 0.38, stayDays: 9 },
];

export function rackColor(rate: number) {
  if (rate < 0.7) return "#16a34a"; // 여유
  if (rate < 0.9) return "#d97706"; // 주의
  return "#dc2626"; // 포화
}

export function capacity(layout: "flat" | "auto", cells: number) {
  const perCell = layout === "auto" ? 6 : 2; // 자동화는 단수를 더 쌓는다
  return cells * perCell;
}

const START_X = 20;
const START_Y = 30;
const CELL_W = 60;
const CELL_H = 64;
const RECT = 48;

function cellXY(r: Rack) {
  return { x: START_X + r.col * CELL_W, y: START_Y + r.row * CELL_H };
}

export function StepPreview({ step }: { step: number }) {
  // 스텝 5는 평치 vs 자동화 비교 화면을 따로 그린다.
  if (step >= 5) {
    const cells = RACKS.length;
    const flat = capacity("flat", cells);
    const auto = capacity("auto", cells);
    const gain = Math.round(((auto - flat) / flat) * 100);
    const panels: { label: string; stack: number; value: number; tone: string }[] = [
      { label: "평치 창고", stack: 2, value: flat, tone: "#64748b" },
      { label: "자동화 창고", stack: 6, value: auto, tone: "#2563eb" },
    ];
    return (
      <svg viewBox="0 0 340 240" className="w-full rounded-xl border border-slate-200 bg-white">
        <text x="170" y="24" textAnchor="middle" className="fill-slate-500" fontSize="12">
          레이아웃별 Capacity 비교 (랙 {cells}칸 기준)
        </text>
        {panels.map((p, i) => {
          const baseX = 30 + i * 160;
          const floorY = 180;
          return (
            <g key={p.label}>
              <text x={baseX + 55} y={54} textAnchor="middle" fontSize="13" className="fill-slate-700" fontWeight="600">
                {p.label}
              </text>
              {Array.from({ length: p.stack }).map((_, k) => (
                <rect
                  key={k}
                  x={baseX + 30}
                  y={floorY - (k + 1) * 16}
                  width={50}
                  height={13}
                  rx={2}
                  fill={p.tone}
                  opacity={0.85}
                />
              ))}
              <line x1={baseX + 18} y1={floorY} x2={baseX + 92} y2={floorY} stroke="#cbd5e1" strokeWidth="2" />
              <text x={baseX + 55} y={floorY + 22} textAnchor="middle" fontSize="16" fontWeight="700" className="fill-slate-900">
                {p.value}
              </text>
              <text x={baseX + 55} y={floorY + 36} textAnchor="middle" fontSize="10" className="fill-slate-400">
                pallet capacity
              </text>
            </g>
          );
        })}
        <text x="170" y="230" textAnchor="middle" fontSize="12" fontWeight="700" fill="#2563eb">
          자동화 전환 시 capacity +{gain}%
        </text>
      </svg>
    );
  }

  const showRacks = step >= 2;
  const colored = step >= 3;
  const showHud = step >= 4;

  const total = RACKS.length;
  const avgRate = RACKS.reduce((s, r) => s + r.rate, 0) / total;
  const longStay = RACKS.filter((r) => r.stayDays >= 30);

  return (
    <svg viewBox="0 0 340 240" className="w-full rounded-xl border border-slate-200 bg-white">
      {/* 창고 바닥 */}
      <rect x="10" y="18" width="320" height="206" rx="8" fill="#f1f5f9" stroke="#e2e8f0" />

      {!showRacks && (
        <text x="170" y="125" textAnchor="middle" fontSize="12" className="fill-slate-400">
          빈 씬 · 카메라와 OrbitControls만 (회전/확대)
        </text>
      )}

      {showRacks &&
        RACKS.map((r) => {
          const { x, y } = cellXY(r);
          const isLong = showHud && r.stayDays >= 30;
          return (
            <g key={r.id}>
              <rect
                x={x}
                y={y}
                width={RECT}
                height={RECT}
                rx={5}
                fill={colored ? rackColor(r.rate) : "#94a3b8"}
                stroke={isLong ? "#0f172a" : "none"}
                strokeWidth={isLong ? 3 : 0}
              />
              {colored && (
                <text
                  x={x + RECT / 2}
                  y={y + RECT / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#ffffff"
                >
                  {Math.round(r.rate * 100)}%
                </text>
              )}
            </g>
          );
        })}

      {/* Capacity 패널 (스텝 4+) */}
      {showHud && (
        <g>
          <rect x="182" y="26" width="146" height="66" rx="8" fill="#ffffff" opacity="0.94" stroke="#bfdbfe" />
          <text x="192" y="44" fontSize="11" className="fill-slate-500">총 랙 {total}칸</text>
          <text x="192" y="62" fontSize="11" className="fill-slate-500">
            평균 적재율 {Math.round(avgRate * 100)}%
          </text>
          <text x="192" y="80" fontSize="11" className="fill-slate-500">
            장기보관(30일+) {longStay.length}칸
          </text>
        </g>
      )}
    </svg>
  );
}
