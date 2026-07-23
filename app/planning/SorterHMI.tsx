"use client";

import { useEffect, useRef, useState } from "react";

// 허브 소터 관제 화면 (평면도 기반 HMI).
// 실제 물류센터 컨베이어 관제처럼:
//   - 평면도 위에 라인 세그먼트를 그리고, 가동=초록 / 정지=회색으로 표시
//   - 구간마다 스캔 게이트(RFID/바코드)가 있고, 화물이 통과할 때 빨간 인디케이터가 점멸
//   - 인입(제조/창고) → 메인 라인 → 분기 슈트 → 도크에서 차량 상차
// 라인/게이트를 클릭하면 우측 패널에서 상태를 볼 수 있고, 라인은 가동/정지 토글된다.

type Seg = {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "induct" | "main" | "chute";
  dock?: string; // 슈트가 연결된 도크
};

type Gate = { id: string; name: string; x: number; y: number; segId: string; type: "RFID" | "BARCODE" };

const SEGS: Seg[] = [
  // 인입 (제조/창고에서 들어옴)
  { id: "IN-1", name: "인입 · 제조라인", x1: 60, y1: 92, x2: 190, y2: 92, kind: "induct" },
  { id: "IN-2", name: "인입 · 창고 피킹", x1: 60, y1: 148, x2: 190, y2: 148, kind: "induct" },
  // 메인 라인 (좌 → 우)
  { id: "MAIN-1", name: "메인 라인 A", x1: 190, y1: 120, x2: 350, y2: 120, kind: "main" },
  { id: "MAIN-2", name: "메인 라인 B", x1: 350, y1: 120, x2: 530, y2: 120, kind: "main" },
  { id: "MAIN-3", name: "메인 라인 C", x1: 530, y1: 120, x2: 700, y2: 120, kind: "main" },
  // 분기 슈트 (아래 도크로)
  { id: "CH-1", name: "슈트 1", x1: 300, y1: 120, x2: 300, y2: 236, kind: "chute", dock: "D1" },
  { id: "CH-2", name: "슈트 2", x1: 420, y1: 120, x2: 420, y2: 236, kind: "chute", dock: "D2" },
  { id: "CH-3", name: "슈트 3", x1: 540, y1: 120, x2: 540, y2: 236, kind: "chute", dock: "D3" },
  { id: "CH-4", name: "슈트 4 (예외)", x1: 660, y1: 120, x2: 660, y2: 236, kind: "chute", dock: "D4" },
];

const GATES: Gate[] = [
  { id: "G1", name: "인입 검수 게이트", x: 190, y: 120, segId: "MAIN-1", type: "RFID" },
  { id: "G2", name: "분류 스캔 게이트", x: 350, y: 120, segId: "MAIN-2", type: "RFID" },
  { id: "G3", name: "출고 검증 게이트", x: 530, y: 120, segId: "MAIN-3", type: "BARCODE" },
];

const DOCKS = [
  { id: "D1", x: 300, plate: "12가 3456", dest: "아산 1공장" },
  { id: "D2", x: 420, plate: "34나 7890", dest: "천안 공장" },
  { id: "D3", x: 540, plate: "11바 6789", dest: "유라 경주공장" },
  { id: "D4", x: 660, plate: "-", dest: "예외 재처리" },
];

type Parcel = { id: number; seg: string; t: number; chute: number };

const LINE_ON = "#16a34a";
const LINE_OFF = "#cbd5e1";

export function SorterHMI() {
  const [running, setRunning] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SEGS.map((s) => [s.id, s.id !== "CH-4"]))
  );
  const [sel, setSel] = useState<string | null>("MAIN-2");
  const [gateFlash, setGateFlash] = useState<Record<string, number>>({});
  const [scans, setScans] = useState<{ t: string; gate: string; code: string; dest: string; ok: boolean }[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ D1: 0, D2: 0, D3: 0, D4: 0 });
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const nextId = useRef(1);
  const tick = useRef(0);

  // 시뮬레이션 루프
  useEffect(() => {
    const iv = setInterval(() => {
      tick.current += 1;

      // 화물 생성 (인입 라인이 돌 때만)
      setParcels((prev) => {
        let next = prev.map((p) => ({ ...p, t: p.t + 0.045 }));
        if (tick.current % 18 === 0 && (running["IN-1"] || running["IN-2"])) {
          const chute = Math.random() < 0.12 ? 4 : 1 + Math.floor(Math.random() * 3);
          next.push({ id: nextId.current++, seg: "MAIN", t: 0, chute });
        }
        // 메인 라인이 멈춰 있으면 진행 정지
        if (!running["MAIN-1"] || !running["MAIN-2"] || !running["MAIN-3"]) {
          next = prev;
        }
        return next.filter((p) => p.t < 1.25);
      });

      // 게이트 통과 시 점멸 + 스캔 로그
      setParcels((cur) => {
        cur.forEach((p) => {
          GATES.forEach((g, gi) => {
            const gt = [0.2, 0.42, 0.72][gi];
            if (Math.abs(p.t - gt) < 0.03) {
              setGateFlash((f) => ({ ...f, [g.id]: Date.now() }));
              if (gi === 1) {
                const code = "EPC-" + String(1000 + p.id).slice(-4);
                const ok = p.chute !== 4;
                setScans((s) =>
                  [
                    {
                      t: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
                      gate: g.name,
                      code,
                      dest: ok ? "D" + p.chute : "NoRead",
                      ok,
                    },
                    ...s,
                  ].slice(0, 12)
                );
                setCounts((c) => ({ ...c, ["D" + p.chute]: (c["D" + p.chute] ?? 0) + 1 }));
              }
            }
          });
        });
        return cur;
      });
    }, 60);
    return () => clearInterval(iv);
  }, [running]);

  const segOf = (id: string) => SEGS.find((s) => s.id === id);
  const selected = sel ? segOf(sel) ?? GATES.find((g) => g.id === sel) : undefined;
  const onCount = SEGS.filter((s) => running[s.id]).length;

  // 화물 좌표 (메인 라인 진행 → 해당 슈트로 하강)
  const parcelPos = (p: Parcel) => {
    const chuteX = [0, 300, 420, 540, 660][p.chute];
    const tTurn = (chuteX - 190) / 510; // 메인 구간 비율
    if (p.t <= tTurn) return { x: 190 + (p.t / tTurn) * (chuteX - 190), y: 120 };
    const d = Math.min(1, (p.t - tTurn) / 0.28);
    return { x: chuteX, y: 120 + d * 116 };
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_290px]">
      {/* 평면도 HMI */}
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">허브 소터 관제 (평면도)</span>
          <span className="text-[11px] text-slate-400">라인 가동 {onCount}/{SEGS.length} · 라인 클릭 시 가동/정지</span>
        </div>
        <svg viewBox="0 0 760 300" className="w-full rounded-xl border border-slate-200 bg-slate-900">
          {/* 구역 배경 */}
          <rect x={16} y={56} width={728} height={228} fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
          <text x={24} y={40} fontSize="12" fontWeight="700" fill="#e2e8f0">HUB SORTER — LINE STATUS</text>
          <text x={744} y={40} textAnchor="end" fontSize="9" fill="#64748b">실시간 관제 · 평면도</text>

          {/* 인입 소스 라벨 */}
          <rect x={16} y={76} width={44} height={32} rx={4} fill="#1e293b" stroke="#334155" />
          <text x={38} y={90} textAnchor="middle" fontSize="7.5" fill="#94a3b8">제조</text>
          <text x={38} y={101} textAnchor="middle" fontSize="7.5" fill="#94a3b8">라인</text>
          <rect x={16} y={132} width={44} height={32} rx={4} fill="#1e293b" stroke="#334155" />
          <text x={38} y={146} textAnchor="middle" fontSize="7.5" fill="#94a3b8">창고</text>
          <text x={38} y={157} textAnchor="middle" fontSize="7.5" fill="#94a3b8">피킹</text>

          {/* 라인 세그먼트 */}
          {SEGS.map((s) => {
            const on = running[s.id];
            const isSel = s.id === sel;
            return (
              <g
                key={s.id}
                onClick={() => {
                  setSel(s.id);
                  setRunning((r) => ({ ...r, [s.id]: !r[s.id] }));
                }}
                style={{ cursor: "pointer" }}
              >
                <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={on ? LINE_ON : LINE_OFF} strokeWidth={isSel ? 13 : 10} strokeLinecap="round" opacity={on ? 0.95 : 0.5} />
                {/* 롤러 눈금 */}
                <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#0f172a" strokeWidth={1.5} strokeDasharray="3 7" />
                {isSel && <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#38bdf8" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 5" />}
              </g>
            );
          })}

          {/* 화물 */}
          {parcels.map((p) => {
            const { x, y } = parcelPos(p);
            return <rect key={p.id} x={x - 5} y={y - 5} width={10} height={10} rx={1.5} fill="#fbbf24" stroke="#78350f" strokeWidth="0.6" />;
          })}

          {/* 스캔 게이트 */}
          {GATES.map((g) => {
            const flash = Date.now() - (gateFlash[g.id] ?? 0) < 260;
            return (
              <g key={g.id} onClick={() => setSel(g.id)} style={{ cursor: "pointer" }}>
                <rect x={g.x - 9} y={g.y - 30} width={18} height={60} rx={3} fill="none" stroke={flash ? "#ef4444" : "#475569"} strokeWidth={flash ? 3 : 1.6} />
                <circle cx={g.x} cy={g.y - 34} r={4.5} fill={flash ? "#ef4444" : "#334155"} />
                {flash && <circle cx={g.x} cy={g.y - 34} r={9} fill="none" stroke="#ef4444" strokeWidth="1.5" opacity={0.6} />}
                <text x={g.x} y={g.y - 44} textAnchor="middle" fontSize="7.5" fill={flash ? "#fca5a5" : "#64748b"} fontWeight="700">{g.id}</text>
                <text x={g.x} y={g.y + 44} textAnchor="middle" fontSize="7" fill="#64748b">{g.type}</text>
              </g>
            );
          })}

          {/* 도크 + 차량 */}
          {DOCKS.map((d) => {
            const seg = SEGS.find((s) => s.dock === d.id);
            const on = seg ? running[seg.id] : false;
            return (
              <g key={d.id}>
                <rect x={d.x - 40} y={240} width={80} height={38} rx={4} fill="#1e293b" stroke={on ? "#16a34a" : "#334155"} strokeWidth="1.4" />
                <text x={d.x} y={253} textAnchor="middle" fontSize="8" fontWeight="700" fill={on ? "#4ade80" : "#64748b"}>DOCK {d.id}</text>
                <text x={d.x} y={264} textAnchor="middle" fontSize="7" fill="#94a3b8">{d.plate}</text>
                <text x={d.x} y={274} textAnchor="middle" fontSize="6.5" fill="#64748b">{counts[d.id] ?? 0} 건 · {d.dest}</text>
              </g>
            );
          })}

          {/* 범례 */}
          <g>
            <line x1={520} y1={292} x2={544} y2={292} stroke={LINE_ON} strokeWidth="6" strokeLinecap="round" />
            <text x={550} y={295} fontSize="8" fill="#94a3b8">가동</text>
            <line x1={584} y1={292} x2={608} y2={292} stroke={LINE_OFF} strokeWidth="6" strokeLinecap="round" opacity={0.5} />
            <text x={614} y={295} fontSize="8" fill="#94a3b8">정지</text>
            <circle cx={654} cy={292} r={4} fill="#ef4444" />
            <text x={664} y={295} fontSize="8" fill="#94a3b8">스캔 감지</text>
          </g>
        </svg>
      </div>

      {/* 우측 상태 패널 */}
      <aside className="min-w-0 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">선택 대상</h4>
          {selected ? (
            "kind" in selected ? (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">라인</span><span className="font-semibold text-slate-800">{selected.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">ID</span><span className="font-mono text-slate-600">{selected.id}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-400">상태</span>
                  <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (running[selected.id] ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                    {running[selected.id] ? "가동" : "정지"}
                  </span>
                </div>
                {selected.dock && <div className="flex justify-between"><span className="text-slate-400">연결 도크</span><span className="text-slate-600">{selected.dock}</span></div>}
                <button
                  type="button"
                  onClick={() => setRunning((r) => ({ ...r, [selected.id]: !r[selected.id] }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {running[selected.id] ? "정지" : "가동"} 전환
                </button>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">게이트</span><span className="font-semibold text-slate-800">{selected.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">타입</span><span className="text-slate-600">{selected.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">설치 구간</span><span className="font-mono text-slate-600">{selected.segId}</span></div>
              </div>
            )
          ) : (
            <p className="text-xs text-slate-400">평면도에서 라인이나 게이트를 클릭하세요.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-900">스캔 로그</h4>
          <ul className="thin-scroll h-56 space-y-1 overflow-auto font-mono text-[10px]">
            {scans.length === 0 && <li className="font-sans text-xs text-slate-400">스캔 대기 중…</li>}
            {scans.map((s, i) => (
              <li key={i} className={s.ok ? "text-slate-600" : "text-red-600"}>
                <span className="text-slate-400">{s.t}</span> {s.code} → {s.dest}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
