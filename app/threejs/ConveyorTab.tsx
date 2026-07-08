"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ConveyorPreview } from "./ConveyorPreview";

// "설비연동" 탭 — 컨베이어 + RFID 게이트로 마스터를 목적지 슈트에 자동 분기.
// 각 스텝: 무엇을 하는지(플로우) → 코드 → 결과 화면(SVG). 마지막에 실제 3D 이송 뷰.
const Conveyor3D = dynamic(() => import("./Conveyor3D").then((m) => m.Conveyor3D), {
  ssr: false,
  loading: () => (
    <div className="grid h-[440px] place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
      3D 로딩 중…
    </div>
  ),
});

type Step = { n: number; title: string; file: string; flow: string; code: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "마스터 투입 · 태그",
    file: "app/threejs/rfid.ts",
    flow: "마스터(아우터박스)마다 RFID 태그를 부여해 컨베이어에 투입한다. 태그에는 고유 EPC가 담겨, 이후 게이트에서 비접촉으로 읽힌다.",
    code: `// rfid.ts — 마스터에 RFID 태그를 부여해 컨베이어에 투입
type Master = { code: string; dest: "A" | "B" | "C"; epc: string };

const queue: Master[] = [
  { code: "M-240715-01", dest: "A", epc: "E280-11AA" },
  { code: "M-240715-02", dest: "B", epc: "E280-11AB" },
  { code: "M-240715-03", dest: "C", epc: "E280-11AC" },
];`,
  },
  {
    n: 2,
    title: "RFID 게이트 스캔",
    file: "app/threejs/gate.ts",
    flow: "컨베이어의 RFID 게이트(리더 안테나)를 통과할 때 태그를 읽어 마스터 코드와 목적지를 인식한다. 안테나가 못 읽으면 NoRead 예외로 넘긴다.",
    code: `// gate.ts — RFID 게이트: 통과하는 태그를 안테나가 읽는다
function onGatePass(m: Master) {
  const epc = rfidRead();            // 안테나가 읽은 EPC (없으면 null)
  if (!epc) return { status: "NoRead" as const, m };
  return { status: "OK" as const, code: m.code, dest: m.dest };
}`,
  },
  {
    n: 3,
    title: "목적지 라우팅",
    file: "app/threejs/route.ts",
    flow: "인식한 목적지(A/B/C)를 PLC 룩업 테이블로 슈트 번호에 매핑한다. 매핑이 없으면 예외(재처리) 슈트로 보낸다.",
    code: `// route.ts — 목적지 -> 슈트 매핑 (PLC 룩업 테이블)
const ROUTE: Record<string, number> = { A: 1, B: 2, C: 3 };

function route(dest: string) {
  return ROUTE[dest] ?? 0;           // 0 = 예외(재처리) 슈트
}`,
  },
  {
    n: 4,
    title: "디버터 분기",
    file: "app/threejs/diverter.ts",
    flow: "결정된 슈트 앞에서 디버터(푸셔)가 작동해 마스터를 해당 슈트로 밀어낸다. 통과 후 디버터는 원위치한다.",
    code: `// diverter.ts — 결정된 슈트 앞에서 디버터(푸셔) 작동
function divert(chute: number) {
  plc.write("DIVERTER_" + chute, true);    // 분기 ON
  waitPass();                              // 마스터 통과 대기
  plc.write("DIVERTER_" + chute, false);   // 원위치
}`,
  },
  {
    n: 5,
    title: "집계 · 예외",
    file: "app/threejs/tally.ts",
    flow: "슈트별 처리 수량과 미인식(NoRead)·미매핑 예외를 집계해 모니터링한다. 이 집계가 입출고 배송 흐름과 연결된다.",
    code: `// tally.ts — 슈트별 처리량 + 미인식(NoRead) 집계
const tally = { A: 0, B: 0, C: 0, noRead: 0 };

for (const r of results) {
  if (r.status === "NoRead") tally.noRead++;
  else tally[r.dest]++;
}
// 이 집계가 입출고 배송 흐름과 연결된다`,
  },
];

export function ConveyorTab() {
  const [step, setStep] = useState(1);
  const s = STEPS[step - 1];

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        컨베이어에 <strong>RFID 게이트</strong>를 두고, 마스터가 통과할 때 태그를 읽어 목적지별 슈트로 자동 분기하는
        <strong> PLC·IoT·RFID 설비 연동</strong>을 단계별로 구현합니다. 각 스텝: 플로우 → 코드 → 결과 화면.
        맨 아래에 실제 3D 이송 뷰가 있습니다.
      </p>

      {/* 스텝 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((st) => {
          const on = st.n === step;
          return (
            <button
              key={st.n}
              type="button"
              onClick={() => setStep(st.n)}
              className={
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors " +
                (on
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              <span
                className={
                  "grid h-5 w-5 place-items-center rounded-full text-xs font-bold " +
                  (on ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-500")
                }
              >
                {st.n}
              </span>
              {st.title}
            </button>
          );
        })}
      </div>

      {/* 플로우 */}
      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
        <span className="font-semibold text-brand-700">Step {s.n}. {s.title} — </span>
        {s.flow}
      </div>

      {/* 코드 + 결과 */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-1.5">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
              {s.file}
            </span>
          </div>
          <pre className="code-pre m-0 max-h-[420px] overflow-auto">
            <code>{s.code}</code>
          </pre>
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 text-xs font-semibold text-slate-500">결과 화면 (RFID 분기 미리보기)</div>
          <ConveyorPreview step={s.n} />
        </div>
      </div>

      {/* 이전 / 다음 */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((v) => Math.max(1, v - 1))}
          disabled={step === 1}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          이전 스텝
        </button>
        <span className="text-sm text-slate-400">{step} / {STEPS.length}</span>
        <button
          type="button"
          onClick={() => setStep((v) => Math.min(STEPS.length, v + 1))}
          disabled={step === STEPS.length}
          className="rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-40"
        >
          다음 스텝
        </button>
      </div>

      {/* 최종 결과물 — 실제 3D */}
      <section className="mt-10">
        <h2>최종 결과물 — 컨베이어 이송 3D</h2>
        <p className="mb-2 text-sm text-slate-500">
          위 분기 로직이 실제로 도는 모습을 react-three-fiber로 렌더한 3D 이송 뷰입니다. (마우스로 회전·확대)
        </p>
        <Conveyor3D />
      </section>
    </div>
  );
}
