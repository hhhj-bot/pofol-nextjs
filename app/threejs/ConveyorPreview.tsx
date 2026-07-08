"use client";

// 설비연동(컨베이어) 탭의 스텝별 "결과 화면" 미리보기 (의존성 없는 SVG).
// 컨베이어 → RFID 게이트 스캔 → 목적지 라우팅 → 디버터 분기 → 집계.

const CHUTES = [
  { id: "A", cx: 224, color: "#2563eb", count: 2 },
  { id: "B", cx: 276, color: "#16a34a", count: 1 },
  { id: "C", cx: 328, color: "#d97706", count: 1 },
];

const BELT_Y = 104;
const GATE_X = 172;

// 마스터(아우터박스) + RFID 태그(●)
function Master({ x, dest, dim }: { x: number; dest?: string; dim?: boolean }) {
  return (
    <g>
      <rect x={x - 9} y={94} width={18} height={14} rx={2} fill={dim ? "#cbd5e1" : "#334155"} stroke="#fff" strokeWidth="0.5" />
      <circle cx={x + 6} cy={97.5} r={2.2} fill="#f59e0b" />
      {dest && <text x={x} y={90} textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#475569">{dest}</text>}
    </g>
  );
}

const TITLES = [
  "",
  "① 마스터 투입 · RFID 태그",
  "② RFID 게이트 스캔",
  "③ 목적지 → 슈트 라우팅",
  "④ 디버터 분기",
  "⑤ 슈트별 집계 · NoRead",
];

export function ConveyorPreview({ step }: { step: number }) {
  const gateActive = step >= 2;
  return (
    <svg viewBox="0 0 360 232" className="w-full rounded-xl border border-slate-200 bg-white">
      <text x="180" y="16" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-slate-700">{TITLES[step] ?? ""}</text>

      {/* 컨베이어 벨트 + 롤러 */}
      <rect x={16} y={BELT_Y} width={328} height={14} rx={2} fill="#cbd5e1" />
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={26 + i * 24} cy={BELT_Y + 18} r={3} fill="#94a3b8" />
      ))}
      <text x={8} y={BELT_Y + 6} fontSize="7.5" fill="#94a3b8">투입</text>
      <text x={20} y={BELT_Y - 6} fontSize="11" fill="#94a3b8">→</text>

      {/* 슈트 + 빈 */}
      {CHUTES.map((c) => (
        <g key={c.id}>
          <polygon points={(c.cx - 12) + ",118 " + (c.cx + 12) + ",118 " + (c.cx + 16) + ",156 " + (c.cx - 8) + ",156"} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
          <rect x={c.cx - 16} y={156} width={32} height={30} rx={3} fill="#fff" stroke={c.color} strokeWidth="1.5" />
          <text x={c.cx} y={150} textAnchor="middle" fontSize="8" fontWeight="700" fill={c.color}>슈트 {c.id}</text>
          {step >= 5 && (
            <text x={c.cx} y={176} textAnchor="middle" fontSize="12" fontWeight="700" fill={c.color}>{c.count}</text>
          )}
        </g>
      ))}

      {/* RFID 게이트 (스캔 시 파랑) */}
      <rect x={GATE_X - 12} y={60} width={30} height={6} rx={2} fill={gateActive ? "#2563eb" : "#64748b"} />
      <rect x={GATE_X - 12} y={62} width={5} height={54} fill={gateActive ? "#2563eb" : "#64748b"} />
      <rect x={GATE_X + 13} y={62} width={5} height={54} fill={gateActive ? "#2563eb" : "#64748b"} />
      <text x={GATE_X + 3} y={54} textAnchor="middle" fontSize="7" fontWeight="700" fill={gateActive ? "#1d4ed8" : "#64748b"}>RFID 게이트</text>
      {gateActive && (
        <g>
          <path d={"M " + (GATE_X - 6) + " 88 q 6 -6 12 0"} fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.7" />
          <path d={"M " + (GATE_X - 9) + " 92 q 9 -9 18 0"} fill="none" stroke="#2563eb" strokeWidth="1" opacity="0.4" />
        </g>
      )}

      {/* 스텝별 오버레이 */}
      {step === 1 && (
        <g>
          <Master x={50} dest="A" />
          <Master x={86} dest="B" />
          <Master x={122} dest="C" />
          <text x={180} y={210} textAnchor="middle" fontSize="8" className="fill-slate-500">마스터마다 RFID 태그(●)를 붙여 컨베이어에 투입</text>
        </g>
      )}

      {step === 2 && (
        <g>
          <Master x={GATE_X + 3} dest="B" />
          <rect x={206} y={70} width={132} height={32} rx={5} fill="#eff6ff" stroke="#bfdbfe" />
          <text x={214} y={84} fontSize="8" fontWeight="700" fill="#1d4ed8">읽음 · EPC E280-11AB</text>
          <text x={214} y={96} fontSize="8" fill="#334155">코드 M-…-02 · 목적지 B</text>
          <text x={180} y={210} textAnchor="middle" fontSize="8" className="fill-slate-500">게이트 통과 → 태그 스캔 → 코드·목적지 인식</text>
        </g>
      )}

      {step === 3 && (
        <g>
          <Master x={214} dest="B" />
          <rect x={40} y={150} width={152} height={52} rx={6} fill="#f8fafc" stroke="#e2e8f0" />
          <text x={48} y={164} fontSize="7.5" fontWeight="700" className="fill-slate-600">라우팅 (목적지 → 슈트)</text>
          <text x={48} y={178} fontSize="8" className="fill-slate-500">A → 슈트A · B → 슈트B</text>
          <text x={48} y={191} fontSize="8" className="fill-slate-500">C → 슈트C · ? → 예외(재처리)</text>
          <text x={180} y={222} textAnchor="middle" fontSize="8" className="fill-slate-500">인식한 목적지를 PLC 룩업으로 슈트에 매핑</text>
        </g>
      )}

      {step === 4 && (
        <g>
          <Master x={276} dest="B" />
          <text x={276} y={134} textAnchor="middle" fontSize="15" fill="#16a34a">↓</text>
          <rect x={250} y={92} width={16} height={10} rx={1} fill="#dc2626" />
          <text x={258} y={99.5} textAnchor="middle" fontSize="5.5" fill="#fff" fontWeight="700">디버터</text>
          <text x={180} y={210} textAnchor="middle" fontSize="8" className="fill-slate-500">디버터(푸셔) 작동 → 목적지 슈트로 분기</text>
        </g>
      )}

      {step >= 5 && (
        <g>
          <rect x={40} y={150} width={152} height={40} rx={6} fill="#fff7ed" stroke="#fed7aa" />
          <text x={48} y={166} fontSize="8" fontWeight="700" fill="#c2410c">집계 · 예외</text>
          <text x={48} y={181} fontSize="8" fill="#9a3412">A 2 · B 1 · C 1 · NoRead 1</text>
          <text x={180} y={210} textAnchor="middle" fontSize="8" className="fill-slate-500">슈트별 처리량 + 미인식(NoRead) 예외 모니터링</text>
        </g>
      )}
    </svg>
  );
}
