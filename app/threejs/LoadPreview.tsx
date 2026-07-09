"use client";

// "적재/하중" 탭 결과 미리보기 (controlled). 상태는 LoadTab이 소유해 3D와 공유한다.
// 셀 클릭 → 적재/제거. 물건은 바닥부터 쌓이고(중력), 위 칸을 빼면 아래로 내려온다.
// 레벨 허용하중을 넘으면 해당 단(L1/L2/L3) 라벨이 빨갛게 바뀐다.

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

// 빈 칸 클릭 시 채워 넣을 적재 프로파일 (베이별 순환)
const POOL = [
  { sku: "RAW-1001", qty: 10, weight: 350 },
  { sku: "FIN-3001", qty: 12, weight: 300 },
  { sku: "WIP-2010", qty: 8, weight: 240 },
  { sku: "FIN-3002", qty: 5, weight: 420 },
];

export function loadColor(ratio: number) {
  if (ratio < 0.7) return "#16a34a"; // 여유
  if (ratio < 0.95) return "#d97706"; // 주의
  return "#dc2626"; // 초과 위험
}

// 레벨 하중 합계
export function levelLoadOf(locs: Loc[], level: number) {
  return locs.filter((l) => l.level === level).reduce((s, l) => s + (l.weight ?? 0), 0);
}

// 베이별로 물건을 바닥부터 정렬(중력) — 빈 칸이 아래에 남지 않게 압축한다.
export function settleAll(src: Loc[]): Loc[] {
  return src.map((l) => {
    const items = src.filter((o) => o.bay === l.bay && o.sku).sort((a, b) => a.level - b.level);
    const d = items[l.level - 1];
    return d
      ? { code: l.code, level: l.level, bay: l.bay, sku: d.sku, qty: d.qty, weight: d.weight }
      : { code: l.code, level: l.level, bay: l.bay };
  });
}

// 클릭 토글 — 있으면 제거(위 칸이 내려옴), 빈 칸이면 바닥부터 다음 칸에 적재.
export function toggleLoc(locs: Loc[], bay: number, level: number): Loc[] {
  const stack = locs
    .filter((l) => l.bay === bay && l.sku)
    .sort((a, b) => a.level - b.level)
    .map((l) => ({ sku: l.sku as string, qty: l.qty as number, weight: l.weight as number }));
  const count = stack.length;
  if (level <= count) {
    stack.splice(level - 1, 1); // 그 칸 제거 → 위 칸 내려옴
  } else if (count < LEVELS) {
    const p = POOL[(bay - 1) % POOL.length];
    stack.push({ sku: p.sku, qty: p.qty, weight: p.weight }); // 바닥부터 다음 칸에 적재
  }
  return locs.map((l) => {
    if (l.bay !== bay) return l;
    const d = stack[l.level - 1];
    return d
      ? { code: l.code, level: l.level, bay: l.bay, sku: d.sku, qty: d.qty, weight: d.weight }
      : { code: l.code, level: l.level, bay: l.bay };
  });
}

const START_X = 14;
const START_Y = 30;
const CELL_W = 58;
const CELL_H = 52;
const RECT_W = 50;
const RECT_H = 44;

export function LoadPreview({
  step,
  locs,
  onToggle,
}: {
  step: number;
  locs: Loc[];
  onToggle: (bay: number, level: number) => void;
}) {
  const interactive = step >= 2 && step < 5;
  const filled = locs.filter((l) => l.sku).length;
  const fillRate = filled / locs.length;
  const totalWeight = locs.reduce((s, l) => s + (l.weight ?? 0), 0);

  // 스텝 5는 로케이션별 SKU 리스트 테이블.
  if (step >= 5) {
    const rows = locs.filter((l) => l.sku);
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

  return (
    <svg viewBox="0 0 360 250" className="w-full rounded-xl border border-slate-200 bg-white">
      {interactive && (
        <text x={START_X} y={20} fontSize="8" className="fill-slate-400">셀 클릭 → 적재 / 제거 (바닥부터 쌓임)</text>
      )}

      {/* 랙 외곽 프레임 */}
      <rect x={START_X - 4} y={START_Y - 4} width={BAYS * CELL_W + 2} height={LEVELS * CELL_H + 2} rx={4} fill="none" stroke="#94a3b8" strokeWidth={3} />

      {locs.map((l) => {
        const row = LEVELS - l.level; // 위쪽이 높은 레벨
        const x = START_X + (l.bay - 1) * CELL_W;
        const y = START_Y + row * CELL_H;
        const isFilled = occupied && !!l.sku;
        return (
          <g
            key={l.code}
            onClick={interactive ? () => onToggle(l.bay, l.level) : undefined}
            style={interactive ? { cursor: "pointer" } : undefined}
          >
            <rect x={x} y={y} width={RECT_W} height={RECT_H} rx={4} fill={isFilled ? "#dbeafe" : "#f8fafc"} stroke="#cbd5e1" strokeWidth={1} />
            {isFilled ? (
              <g>
                <rect x={x + 6} y={y + 8} width={RECT_W - 12} height={RECT_H - 14} rx={3} fill="#3b82f6" opacity={0.85} />
                <text x={x + RECT_W / 2} y={y + RECT_H / 2 + 1} textAnchor="middle" fontSize="8" fill="#ffffff" fontWeight="700">{l.sku}</text>
                <text x={x + RECT_W / 2} y={y + RECT_H / 2 + 11} textAnchor="middle" fontSize="7" fill="#dbeafe">{l.weight}kg</text>
              </g>
            ) : (
              interactive ? (
                <text x={x + RECT_W / 2} y={y + RECT_H / 2 + 5} textAnchor="middle" fontSize="14" fill="#cbd5e1">+</text>
              ) : null
            )}
          </g>
        );
      })}

      {/* 레벨별 하중 바 + 라벨 (스텝 3+) — 초과 시 L라벨 빨강 */}
      {showLoad &&
        Array.from({ length: LEVELS }).map((_, i) => {
          const level = LEVELS - i;
          const row = LEVELS - level;
          const cy = START_Y + row * CELL_H + RECT_H / 2;
          const lv = levelLoadOf(locs, level);
          const ratio = lv / ALLOWABLE;
          const over = lv > ALLOWABLE;
          const barX = START_X + BAYS * CELL_W + 6;
          const barMax = 78;
          const w = Math.min(1, ratio) * barMax;
          return (
            <g key={level}>
              <line x1={barX} y1={cy} x2={barX + barMax} y2={cy} stroke="#e2e8f0" strokeWidth={6} strokeLinecap="round" />
              <line x1={barX} y1={cy} x2={barX + w} y2={cy} stroke={loadColor(ratio)} strokeWidth={6} strokeLinecap="round" />
              <text x={barX} y={cy - 8} fontSize="8" fill={over ? "#dc2626" : "#64748b"} fontWeight={over ? 700 : 400}>L{level} {lv}kg{over ? " 초과" : ""}</text>
            </g>
          );
        })}

      {/* 전체 적재율 + 총중량 (스텝 4+) */}
      {showFill && (
        <g>
          <text x={START_X} y={228} fontSize="10" className="fill-slate-500">전체 적재율 {Math.round(fillRate * 100)}% ({filled}/{locs.length}) · 총 {totalWeight.toLocaleString()}kg</text>
          <rect x={START_X} y={234} width={BAYS * CELL_W - 6} height={8} rx={4} fill="#eef2f7" />
          <rect x={START_X} y={234} width={(BAYS * CELL_W - 6) * fillRate} height={8} rx={4} fill="#2563eb" />
        </g>
      )}
    </svg>
  );
}
