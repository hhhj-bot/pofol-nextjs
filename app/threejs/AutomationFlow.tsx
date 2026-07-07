"use client";

// 자동화 전환 배치 — 적치 도면(도면→랙배치)과 '같은' 창고·적치구역에서,
// 기존(수동) 랙을 자동화하는 두 가지 방식을 전환 후에 위아래로 함께 비교한다.
//   A. 스태커크레인 AS/RS : 좁은 통로(1.6m) + 무인 크레인 + 입출고 컨베이어 (지게차 없음)
//   B. 파레트 셔틀        : deep-lane 초고밀도(통로 최소) + 셔틀이 레인 이동 + 출고는 지게차

const WX = 16, WW = 328, WH = 118, ZX = 54, ZW = 248, COLS = 5;

function Warehouse({ y0, title }: { y0: number; title: string }) {
  const zy = y0 + 10, zh = WH - 20;
  return (
    <g>
      <text x={WX} y={y0 - 4} fontSize="9" fontWeight="700" className="fill-slate-600">{title}</text>
      <text x={WX + WW} y={y0 - 4} textAnchor="end" fontSize="7" className="fill-slate-400">24,000 x 16,000</text>
      <rect x={WX} y={y0} width={WW} height={WH} fill="#fff" stroke="#475569" strokeWidth="2.5" />
      <rect x={WX + 4} y={y0 + 4} width={WW - 8} height={WH - 8} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
      <rect x={ZX} y={zy} width={ZW} height={zh} fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="5 4" />
      <rect x={WX + 2} y={y0 + 40} width={14} height={26} fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
      <text x={WX + 9} y={y0 + 57} textAnchor="middle" fontSize="7" fill="#b45309" fontWeight="700">IN</text>
      <rect x={WX + WW - 16} y={y0 + 40} width={14} height={26} fill="#dbeafe" stroke="#2563eb" strokeWidth="1" />
      <text x={WX + WW - 9} y={y0 + 57} textAnchor="middle" fontSize="6.5" fill="#1d4ed8" fontWeight="700">OUT</text>
    </g>
  );
}

// 랙 열 그리기 — [y0+18, rackBottom] 안에 rows개, aisle(통로) 표시(옵션)
function rackGrid(y0: number, rows: number, rackBottom: number, aisleColor: string | null) {
  const colW = (ZW - 12) / COLS;
  const ry0 = y0 + 18;
  const rowH = (rackBottom - ry0) / rows;
  const els: JSX.Element[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      els.push(
        <rect key={String(y0) + "-" + r + "-" + c} x={ZX + 6 + c * colW + 1} y={ry0 + r * rowH + 1} width={colW - 3} height={rowH - (aisleColor ? 6 : 2)} rx={2} fill="#2563eb" stroke="#fff" strokeWidth="0.6" />
      );
    }
    if (aisleColor && r < rows - 1) {
      const ly = ry0 + (r + 1) * rowH - 3;
      els.push(<line key={"aisle-" + y0 + "-" + r} x1={ZX + 6} y1={ly} x2={ZX + ZW - 6} y2={ly} stroke={aisleColor} strokeWidth="1.2" strokeDasharray="4 3" />);
    }
  }
  return els;
}

export function AutomationFlow() {
  const AY = 26;    // 전환 전
  const A_Y = 172;  // 전환 후 A (스태커)
  const B_Y = 318;  // 전환 후 B (셔틀)

  return (
    <svg viewBox="0 0 360 456" className="w-full rounded-xl border border-slate-200 bg-white">
      {/* 전환 전 · 기존(수동) 랙 */}
      <Warehouse y0={AY} title="전환 전 · 기존(수동) 랙" />
      {rackGrid(AY, 3, AY + 96, "#cbd5e1")}
      <text x={180} y={AY + WH - 6} textAnchor="middle" fontSize="7" className="fill-slate-400">랙 5x3 · 지게차 넓은 통로(3.5m) · 4단</text>

      <text x={180} y={AY + WH + 14} textAnchor="middle" fontSize="8" fontWeight="700" fill="#2563eb">자동화 전환 (두 가지 방식)</text>

      {/* 전환 후 A · 스태커크레인 AS/RS */}
      <Warehouse y0={A_Y} title="전환 후 A · 스태커크레인 AS/RS" />
      {rackGrid(A_Y, 4, A_Y + 86, "#f59e0b")}
      <rect x={ZX + 6} y={A_Y + 92} width={ZW - 12} height={8} rx={2} fill="#0ea5e9" />
      <text x={180} y={A_Y + 98.5} textAnchor="middle" fontSize="6.5" fill="#fff" fontWeight="700">입출고 컨베이어</text>
      <text x={ZX + 12} y={A_Y + 99} fontSize="9" fill="#fff">-&gt;</text>
      <text x={ZX + ZW - 22} y={A_Y + 99} fontSize="9" fill="#fff">-&gt;</text>
      <text x={180} y={A_Y + WH - 4} textAnchor="middle" fontSize="7" className="fill-slate-400">크레인이 통로에 서서 옆으로 뻗어 꺼냄 · 좁은 통로(1.6m) · 무인 6단 · 컨베이어 출고</text>

      <text x={180} y={A_Y + WH + 14} textAnchor="middle" fontSize="8" fontWeight="700" fill="#16a34a">또는</text>

      {/* 전환 후 B · 파레트 셔틀 */}
      <Warehouse y0={B_Y} title="전환 후 B · 파레트 셔틀 (deep-lane)" />
      {Array.from({ length: 6 }).map((_, c) => {
        const chW = (ZW - 12) / 6;
        const cx = ZX + 6 + c * chW;
        return (
          <g key={c}>
            <rect x={cx + 1} y={B_Y + 18} width={chW - 2} height={66} fill="#2563eb" opacity={0.9} />
            {[1, 2, 3].map((k) => (
              <line key={k} x1={cx + 1} y1={B_Y + 18 + k * 16.5} x2={cx + chW - 1} y2={B_Y + 18 + k * 16.5} stroke="#fff" strokeWidth="0.8" />
            ))}
          </g>
        );
      })}
      <text x={ZX + 6 + 2.5 * ((ZW - 12) / 6)} y={B_Y + 56} textAnchor="middle" fontSize="15" fill="#fbbf24" fontWeight="700">↑</text>
      <rect x={ZX + 6} y={B_Y + 88} width={ZW - 12} height={14} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.6" />
      <rect x={ZX + 6 + 2.5 * ((ZW - 12) / 6) - 9} y={B_Y + 89} width={18} height={11} rx={1} fill="#f59e0b" />
      <text x={ZX + 6 + 2.5 * ((ZW - 12) / 6)} y={B_Y + 97} textAnchor="middle" fontSize="5" fill="#fff" fontWeight="700">셔틀</text>
      <rect x={ZX + 14} y={B_Y + 90} width={16} height={10} rx={1} fill="#d97706" />
      <text x={ZX + 22} y={B_Y + 97.5} textAnchor="middle" fontSize="5.5" fill="#fff" fontWeight="700">지게차</text>
      <text x={180} y={B_Y + WH - 12} textAnchor="middle" fontSize="6.5" className="fill-slate-500">셔틀 카트가 레인 안으로 들어가 파레트를 살짝 들어 옮김</text>
      <text x={180} y={B_Y + WH - 3} textAnchor="middle" fontSize="7" className="fill-slate-400">통로를 거의 없앤 deep-lane으로 바닥을 꽉 채움 — 높이가 아니라 밀도로 승부</text>

      <text x={16} y={446} fontSize="8.5" className="fill-slate-600">A=높이·무인(6단) · B=바닥 밀도(통로 최소). 축이 다른 두 전략 — 요건에 따라 택1, 아래 비교표 참고.</text>
    </svg>
  );
}
