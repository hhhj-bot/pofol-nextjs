"use client";

// 적치 탭의 스텝별 "결과 화면" 미리보기 (의존성 없는 SVG).
// 창고 CAD 평면도(도면) 기반: 도면 로드 → 적치구역/랙 배치(치수) → 적재율 → capacity → 평치 vs 자동화.

export type Rack = {
  id: string;
  row: number;
  col: number;
  rate: number;
  stayDays: number;
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
  if (rate < 0.7) return "#16a34a";
  if (rate < 0.9) return "#d97706";
  return "#dc2626";
}

// 적재 단수(평치 2단 / 자동화 고층랙 6단)를 곱해 보관 pallet 수를 낸다.
const FLAT_LEVELS = 2;
const AUTO_LEVELS = 6;
export function capacity(layout: "flat" | "auto", cells: number) {
  return cells * (layout === "auto" ? AUTO_LEVELS : FLAT_LEVELS);
}

const WALL_X = 18;
const WALL_Y = 30;
const WALL_W = 300;
const WALL_H = 176;
const START_X = 40;
const START_Y = 52;
const CELL_W = 53;
const CELL_H = 46;
const RECT_W = 45;
const RECT_H = 38;

function cellXY(r: Rack) {
  return { x: START_X + r.col * CELL_W, y: START_Y + r.row * CELL_H };
}

// 창고 CAD 평면도(도면) 프레임 — 벽(더블라인) + 치수선 + 통로 + 타이틀블록
function Plan() {
  const dimYmid = WALL_Y + WALL_H / 2;
  return (
    <g>
      <rect x={WALL_X} y={WALL_Y} width={WALL_W} height={WALL_H} fill="#fff" stroke="#475569" strokeWidth="3" />
      <rect x={WALL_X + 5} y={WALL_Y + 5} width={WALL_W - 10} height={WALL_H - 10} fill="none" stroke="#94a3b8" strokeWidth="1" />

      <line x1={WALL_X} y1={20} x2={WALL_X + WALL_W} y2={20} stroke="#2563eb" strokeWidth="1" />
      <line x1={WALL_X} y1={16} x2={WALL_X} y2={24} stroke="#2563eb" strokeWidth="1" />
      <line x1={WALL_X + WALL_W} y1={16} x2={WALL_X + WALL_W} y2={24} stroke="#2563eb" strokeWidth="1" />
      <text x={WALL_X + WALL_W / 2} y={15} textAnchor="middle" fontSize="8" fill="#2563eb">24,000</text>

      <line x1={10} y1={WALL_Y} x2={10} y2={WALL_Y + WALL_H} stroke="#2563eb" strokeWidth="1" />
      <line x1={6} y1={WALL_Y} x2={14} y2={WALL_Y} stroke="#2563eb" strokeWidth="1" />
      <line x1={6} y1={WALL_Y + WALL_H} x2={14} y2={WALL_Y + WALL_H} stroke="#2563eb" strokeWidth="1" />
      <text transform={`rotate(-90 8 ${dimYmid})`} x={8} y={dimYmid} textAnchor="middle" fontSize="8" fill="#2563eb">16,000</text>

      <line x1={WALL_X + 5} y1={dimYmid} x2={WALL_X + WALL_W - 5} y2={dimYmid} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 4" />

      <rect x={WALL_X + WALL_W - 84} y={WALL_Y + WALL_H - 22} width={82} height={20} fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
      <text x={WALL_X + WALL_W - 43} y={WALL_Y + WALL_H - 13} textAnchor="middle" fontSize="6.5" fill="#334155" fontWeight="700">WAREHOUSE PLAN</text>
      <text x={WALL_X + WALL_W - 43} y={WALL_Y + WALL_H - 5} textAnchor="middle" fontSize="6" fill="#94a3b8">적치 도면 · rev.1</text>
    </g>
  );
}

// 스택 박스(단수 시각화) — 바닥에서 위로 n칸 쌓는다
function StackBoxes({ cx, floorY, levels, tone }: { cx: number; floorY: number; levels: number; tone: string }) {
  const bw = 46;
  const bh = 15;
  const gap = 2;
  return (
    <g>
      {Array.from({ length: levels }).map((_, k) => (
        <rect key={k} x={cx - bw / 2} y={floorY - (k + 1) * (bh + gap)} width={bw} height={bh} rx={2} fill={tone} opacity={0.9} stroke="#fff" strokeWidth="0.6" />
      ))}
      <line x1={cx - bw / 2 - 8} y1={floorY} x2={cx + bw / 2 + 8} y2={floorY} stroke="#94a3b8" strokeWidth="2" />
    </g>
  );
}

export function StepPreview({ step }: { step: number }) {
  // 스텝 5: 자동화 방식별 결과 — A는 단수(높이)로, B는 deep-lane(밀도)로 같은 ~2배
  if (step >= 5) {
    const COLS = 5;
    type Col = { key: string; label: string; rows: number; lv: number; fill: string; aisle: number };
    const cols: Col[] = [
      { key: "man", label: "기존 · 넓은통로", rows: 3, lv: 4, fill: "#64748b", aisle: 11 },
      { key: "a", label: "A 스태커 · 6단", rows: 4, lv: 6, fill: "#2563eb", aisle: 8 },
      { key: "b", label: "B 셔틀 · deep-lane", rows: 6, lv: 4, fill: "#0d9488", aisle: 5 },
    ];
    const cx = [62, 170, 278];
    const pcw = 7, pcp = 8.5, prh = 4, planY0 = 42;
    const fcw = 7, fcp = 8.5, fch = 8, flh = 9, floorY = 206;
    const bays = (c: Col) => COLS * c.rows;
    const pallets = (c: Col) => bays(c) * c.lv;

    return (
      <svg viewBox="0 0 340 288" className="w-full rounded-xl border border-slate-200 bg-white">
        <text x="170" y="14" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-slate-700">
          자동화 검증 · 같은 2배, 다른 방법 (A=높이 / B=밀도)
        </text>

        {/* 1 평면도 — 행·통로 배치 */}
        <text x="170" y="27" textAnchor="middle" fontSize="7.5" fontWeight="600" className="fill-slate-500">① 평면도 (위에서) — 기존 3행 · A 4행(통로↓) · B deep-lane 6행</text>
        {cols.map((c, i) => (
          <g key={"plan-" + c.key}>
            <text x={cx[i]} y={38} textAnchor="middle" fontSize="6.5" fontWeight="600" fill={c.fill}>{c.label}</text>
            {Array.from({ length: c.rows }).map((_, r) =>
              Array.from({ length: COLS }).map((_, k) => (
                <rect key={"p-" + i + "-" + r + "-" + k} x={cx[i] - 21 + k * pcp} y={planY0 + r * c.aisle} width={pcw} height={prh} rx={1} fill={c.fill} stroke="#fff" strokeWidth="0.4" />
              ))
            )}
          </g>
        ))}

        {/* 2 정면도 — 단수 (A만 6단, B는 4단) */}
        <text x="170" y="98" textAnchor="middle" fontSize="7.5" fontWeight="600" className="fill-slate-500">② 정면도 (앞에서) — A만 6단으로 ↑, B는 4단 유지</text>
        {cols.map((c, i) => (
          <g key={"front-" + c.key}>
            <text x={cx[i]} y={114} textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c.fill}>{c.lv}단</text>
            {Array.from({ length: c.lv }).map((_, l) =>
              Array.from({ length: COLS }).map((_, k) => (
                <rect key={"f-" + i + "-" + l + "-" + k} x={cx[i] - 21 + k * fcp} y={floorY - (l + 1) * flh} width={fcw} height={fch} rx={1} fill={c.fill} stroke="#fff" strokeWidth="0.4" />
              ))
            )}
            <line x1={cx[i] - 24} y1={floorY} x2={cx[i] + 24} y2={floorY} stroke="#94a3b8" strokeWidth="1.2" />
          </g>
        ))}

        {/* 결과 */}
        {cols.map((c, i) => (
          <text key={"res-" + c.key} x={cx[i]} y={228} textAnchor="middle" fontSize="8" fontWeight="700" fill={i === 0 ? "#334155" : c.fill}>
            {bays(c)}bay × {c.lv} = {pallets(c)}p
          </text>
        ))}
        <text x="170" y="250" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#16a34a">
          기존 60 → A·B 모두 120 pallet · 약 2배
        </text>
        <text x="170" y="266" textAnchor="middle" fontSize="7" className="fill-slate-500">
          A는 단수↑(위로) · B는 통로 없앤 deep-lane(안으로) — 지렛대가 다름
        </text>
        <text x="170" y="280" textAnchor="middle" fontSize="6.5" className="fill-slate-400">
          지게차 도달 한계로 B는 4단 유지 · 무인 6단 이상은 스태커(A) 몫
        </text>
      </svg>
    );
  }

  const showRacks = step >= 2;
  const colored = step >= 3;
  const showCap = step >= 4;
  const total = RACKS.length;
  const avg = RACKS.reduce((s, r) => s + r.rate, 0) / total;
  const totalCap = total * 4; // 도면 1칸 = bay(로케이션) · 기존 랙 4단
  const green = RACKS.filter((r) => r.rate < 0.7).length;
  const amber = RACKS.filter((r) => r.rate >= 0.7 && r.rate < 0.9).length;
  const red = RACKS.filter((r) => r.rate >= 0.9).length;
  const PER_RACK = 4; // 로케이션(bay) 1칸 = 4단 = 4 pallet
  const usedPallet = RACKS.reduce((sum, r) => sum + r.rate * PER_RACK, 0);
  const remainPallet = Math.round(total * PER_RACK - usedPallet);
  const freePct = Math.round((1 - avg) * 100);

  const caption =
    step === 1
      ? "창고 CAD 평면도 로드 — 벽·통로·적치 구역 정의"
      : step === 2
        ? "적치 구역을 랙으로 분할 · 로케이션 1,100 × 1,100 mm"
        : step === 3
          ? "각 랙에 재고 적재율을 색으로 매핑 (여유·주의·포화)"
          : `도면 면적 기반 · 총 ${total}칸 · Capacity ${totalCap} · 평균 적재율 ${Math.round(avg * 100)}%`;

  return (
    <svg viewBox="0 0 340 240" className="w-full rounded-xl border border-slate-200 bg-white">
      <Plan />

      {step === 1 && (
        <g>
          <rect x={34} y={46} width={270} height={144} fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="5 4" />
          <text x={170} y={42} textAnchor="middle" fontSize="9" fill="#2563eb" fontWeight="700">RACK ZONE · 적치 구역</text>
        </g>
      )}

      {showRacks &&
        RACKS.map((r) => {
          const { x, y } = cellXY(r);
          const longStay = showCap && r.stayDays >= 30;
          return (
            <g key={r.id}>
              <rect
                x={x}
                y={y}
                width={RECT_W}
                height={RECT_H}
                rx={3}
                fill={colored ? rackColor(r.rate) : "#cbd5e1"}
                stroke={longStay ? "#0f172a" : "#94a3b8"}
                strokeWidth={longStay ? 2 : 0.6}
              />
              {colored && (
                <text x={x + RECT_W / 2} y={y + RECT_H / 2 + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">
                  {Math.round(r.rate * 100)}%
                </text>
              )}
            </g>
          );
        })}

      {/* 랙(로케이션) 한 칸 치수 (CAD 스타일) — 스텝 2+ */}
      {showRacks && (
        <g>
          {/* 너비 */}
          <line x1={START_X} y1={196} x2={START_X + RECT_W} y2={196} stroke="#2563eb" strokeWidth="0.8" />
          <line x1={START_X} y1={193} x2={START_X} y2={199} stroke="#2563eb" strokeWidth="0.8" />
          <line x1={START_X + RECT_W} y1={193} x2={START_X + RECT_W} y2={199} stroke="#2563eb" strokeWidth="0.8" />
          <text x={START_X + RECT_W / 2} y={191} textAnchor="middle" fontSize="7" fill="#2563eb">1,100</text>
          {/* 높이 */}
          <line x1={33} y1={START_Y} x2={33} y2={START_Y + RECT_H} stroke="#2563eb" strokeWidth="0.8" />
          <line x1={30} y1={START_Y} x2={36} y2={START_Y} stroke="#2563eb" strokeWidth="0.8" />
          <line x1={30} y1={START_Y + RECT_H} x2={36} y2={START_Y + RECT_H} stroke="#2563eb" strokeWidth="0.8" />
          <text transform={`rotate(-90 29 ${START_Y + RECT_H / 2})`} x={29} y={START_Y + RECT_H / 2} textAnchor="middle" fontSize="7" fill="#2563eb">1,100</text>
          <text x={START_X + 2} y={205} fontSize="6.5" fill="#94a3b8">랙(로케이션) 1칸</text>
        </g>
      )}

      {/* 적치 현황 위젯 (Capacity 산정) — 오른쪽 위 */}
      {showCap && (
        <g>
          <rect x={198} y={33} width={118} height={80} rx={8} fill="#ffffff" opacity={0.96} stroke="#bfdbfe" strokeWidth="1" />
          <text x={207} y={47} fontSize="9" fontWeight="700" className="fill-slate-700">적치 현황 · 여유 {freePct}%</text>
          <text x={207} y={62} fontSize="9" className="fill-slate-500">적치 가능 <tspan fontWeight="700" fill="#1d4ed8">{remainPallet}</tspan> pallet</text>
          <circle cx={210} cy={75} r={3} fill="#16a34a" />
          <text x={218} y={78} fontSize="8" className="fill-slate-500">여유 {green}칸</text>
          <circle cx={210} cy={90} r={3} fill="#d97706" />
          <text x={218} y={93} fontSize="8" className="fill-slate-500">주의 {amber}칸</text>
          <circle cx={210} cy={105} r={3} fill="#dc2626" />
          <text x={218} y={108} fontSize="8" className="fill-slate-500">포화 {red}칸</text>
        </g>
      )}

      <text x="170" y="224" textAnchor="middle" fontSize={step === 4 ? 10 : 11} fill="#475569">
        {caption}
      </text>
    </svg>
  );
}
