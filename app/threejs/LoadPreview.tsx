"use client";

// "적재/하중" 탭의 스텝별 결과 미리보기.
// 설계된 랙(레벨×베이)에 SKU를 적재하고, 무게로 레벨별 하중·적재율을 보여준다.
// 스텝 1: 랙 프레임 / 2: SKU 적재 / 3: 하중 색상 / 4: 적재율 / 5: 로케이션별 SKU 리스트

export type Loc = {
  code: string;
  level: number; // 1이 최하단
  bay: number;
  sku?: string;
  qty?: number;
  weight?: number; // kg
};

export const LEVELS = 3;
export const BAYS = 4;
export const ALLOWABLE = 1000; // 레벨(빔)당 허용하중 kg

export const LOCS: Loc[] = [
  { code: "L1-B1", level: 1, bay: 1, sku: "RAW-1001", qty: 20, weight: 480 },
  { code: "L1-B2", level: 1, bay: 2, sku: "FIN-3001", qty: 12, weight: 360 },
  { code: "L1-B3", level: 1, bay: 3 },
  { code: "L1-B4", level: 1, bay: 4, sku: "WIP-2010", qty: 8, weight: 240 },
  { code: "L2-B1", level: 2, bay: 1, sku: "RAW-1002", qty: 30, weight: 150 },
  { code: "L2-B2", level: 2, bay: 2 },
  { code: "L2-B3", level: 2, bay: 3, sku: "FIN-3002", qty: 5, weight: 650 },
  { code: "L2-B4", level: 2, bay: 4 },
  { code: "L3-B1", level: 3, bay: 1, sku: "RAW-1001", qty: 16, weight: 384 },
  { code: "L3-B2", level: 3, bay: 2 },
  { code: "L3-B3", level: 3, bay: 3 },
  { code: "L3-B4", level: 3, bay: 4, sku: "WIP-2010", qty: 10, weight: 300 },
];

export function levelLoad(level: number) {
  return LOCS.filter((l) => l.level === level).reduce((s, l) => s + (l.weight ?? 0), 0);
}

export function loadColor(ratio: number) {
  if (ratio < 0.7) return "#16a34a"; // 여유
  if (ratio < 0.95) return "#d97706"; // 주의
  return "#dc2626"; // 초과 위험
}

const START_X = 14;
const START_Y = 30;
const CELL_W = 58;
const CELL_H = 52;
const RECT_W = 50;
const RECT_H = 44;

export function LoadPreview({ step }: { step: number }) {
  // 스텝 5는 로케이션별 SKU 리스트 테이블.
  if (step >= 5) {
    const rows = LOCS.filter((l) => l.sku);
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table>
          <thead>
            <tr>
              <th>로케이션</th>
              <th>SKU</th>
              <th>수량</th>
              <th>중량(kg)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.code}>
                <td style={{ fontFamily: "monospace" }}>{l.code}</td>
                <td>{l.sku}</td>
                <td>{l.qty}</td>
                <td className="dim">{l.weight?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const occupied = step >= 2;
  const showLoad = step >= 3;
  const showFill = step >= 4;

  const filled = LOCS.filter((l) => l.sku).length;
  const fillRate = filled / LOCS.length;

  return (
    <svg viewBox="0 0 360 250" className="w-full rounded-xl border border-slate-200 bg-white">
      {/* 랙 외곽 프레임 */}
      <rect x={START_X - 4} y={START_Y - 4} width={BAYS * CELL_W + 2} height={LEVELS * CELL_H + 2} rx={4} fill="none" stroke="#94a3b8" strokeWidth={3} />

      {LOCS.map((l) => {
        const row = LEVELS - l.level; // 위쪽이 높은 레벨
        const x = START_X + (l.bay - 1) * CELL_W;
        const y = START_Y + row * CELL_H;
        const isFilled = occupied && !!l.sku;
        return (
          <g key={l.code}>
            <rect x={x} y={y} width={RECT_W} height={RECT_H} rx={4} fill={isFilled ? "#dbeafe" : "#f8fafc"} stroke="#cbd5e1" strokeWidth={1} />
            {isFilled && (
              <>
                <rect x={x + 6} y={y + 10} width={RECT_W - 12} height={RECT_H - 16} rx={3} fill="#3b82f6" opacity={0.85} />
                <text x={x + RECT_W / 2} y={y + RECT_H / 2 + 4} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="700">
                  {l.sku}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* 레벨별 하중 바 (스텝 3+) */}
      {showLoad &&
        Array.from({ length: LEVELS }).map((_, i) => {
          const level = LEVELS - i; // 위 행부터 최상단
          const row = LEVELS - level;
          const cy = START_Y + row * CELL_H + RECT_H / 2;
          const load = levelLoad(level);
          const ratio = load / ALLOWABLE;
          const barX = START_X + BAYS * CELL_W + 6;
          const barMax = 78;
          const w = Math.min(1, ratio) * barMax;
          return (
            <g key={level}>
              <line x1={barX} y1={cy} x2={barX + barMax} y2={cy} stroke="#e2e8f0" strokeWidth={6} strokeLinecap="round" />
              <line x1={barX} y1={cy} x2={barX + w} y2={cy} stroke={loadColor(ratio)} strokeWidth={6} strokeLinecap="round" />
              <text x={barX} y={cy - 8} fontSize="8" className="fill-slate-500">
                L{level} {load}kg
              </text>
            </g>
          );
        })}

      {/* 전체 적재율 게이지 (스텝 4+) */}
      {showFill && (
        <g>
          <text x={START_X} y={228} fontSize="10" className="fill-slate-500">
            전체 적재율 {Math.round(fillRate * 100)}% ({filled}/{LOCS.length})
          </text>
          <rect x={START_X} y={234} width={BAYS * CELL_W - 6} height={8} rx={4} fill="#eef2f7" />
          <rect x={START_X} y={234} width={(BAYS * CELL_W - 6) * fillRate} height={8} rx={4} fill="#2563eb" />
        </g>
      )}
    </svg>
  );
}
