"use client";

import { useState } from "react";
import { StepPreview } from "./StepPreview";
import { AutomationFlow } from "./AutomationFlow";

// "적치" 탭 — 창고 CAD 평면도(도면)를 기반으로 적치를 계획한다.
// 도면의 적치 구역을 랙 좌표로 읽어 배치하고, 재고 데이터로 적재율·Capacity를 산정한다.
// 각 스텝: 무엇을 하는지(플로우) → 코드 → 결과 화면(도면 기반 미리보기).

type Step = { n: number; title: string; file: string; flow: string; code: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "CAD 도면 로드",
    file: "app/threejs/plan.ts",
    flow: "창고 CAD 평면도(도면)를 불러온다. 벽·통로·적치 구역이 정의돼 있고, 여기서 적치 계획을 시작한다.",
    code: `// app/threejs/plan.ts — 창고 CAD 평면도(도면)에서 적치 구역 읽기
// DXF/SVG 도면의 폴리라인(RACK ZONE 레이어)을 좌표로 파싱한다고 가정
export type Zone = { id: string; x: number; z: number; w: number; d: number };

export const PLAN = {
  name: "WAREHOUSE-PLAN-rev1",
  size: { w: 24000, d: 16000 }, // mm
  zones: [
    { id: "A", x: 2000, z: 2000, w: 20000, d: 12000 }, // 적치 구역
  ] as Zone[],
};`,
  },
  {
    n: 2,
    title: "도면 → 랙 배치",
    file: "app/threejs/plan.ts",
    flow: "도면의 적치 구역(20,000×12,000mm)을 로케이션 그리드(1,100×1,100mm)로 나눠 랙 위치를 만든다. CAD처럼 구역·로케이션 치수가 함께 나온다.",
    code: `// 적치 구역을 랙 셀 그리드로 분할해 좌표를 만든다 (도면 -> 랙)
function racksFromZone(z: Zone, cols: number, rows: number) {
  const cw = z.w / cols;
  const cd = z.d / rows;
  const racks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      racks.push({ id: r + "-" + c, x: z.x + c * cw, z: z.z + r * cd });
    }
  }
  return racks;
}`,
  },
  {
    n: 3,
    title: "적재율 표시",
    file: "app/threejs/Rack.tsx",
    flow: "각 랙에 재고 데이터의 적재율(rate)을 색으로 매핑한다. 여유는 초록, 포화는 빨강으로 도면 위에서 바로 읽힌다.",
    code: `// 적재율 -> 색
function color(rate: number) {
  if (rate < 0.7) return "#16a34a"; // 여유
  if (rate < 0.9) return "#d97706"; // 주의
  return "#dc2626";                 // 포화
}

// 도면 좌표에 놓인 각 랙 셀을 color(rate)로 칠한다`,
  },
  {
    n: 4,
    title: "Capacity 산정",
    file: "app/threejs/capacity.ts",
    flow: "도면 면적과 랙 수로 총 capacity와 평균 적재율을 산정한다. 도면이 곧 산정 근거가 된다.",
    code: `const PALLETS_PER_RACK = 4; // 도면 1칸 = bay(로케이션) = 4단 = 4 pallet

const total = racks.length;
const avgRate = racks.reduce((s, r) => s + r.rate, 0) / total;
const capacity = total * PALLETS_PER_RACK;

// 도면 면적(24m x 16m) 대비 랙 수·적재율로 공간 효율을 본다`,
  },
  {
    n: 5,
    title: "자동화 검증",
    file: "app/threejs/capacity.ts",
    flow: "도면→랙배치로 만든 랙 창고를 자동화한다. 방식은 둘 — A(스태커크레인)는 통로를 좁히고(3.5→1.6m) 단수를 6단으로 올려 '높이'로, B(파레트 셔틀)는 통로를 없앤 deep-lane으로 '바닥 밀도'로 보관량을 늘린다. 지게차 도달 높이 한계로 B는 4단을 유지하는 대신 행을 촘촘히 채워 A와 같은 약 2배를 만든다. 요건(천장고·무인화 vs 바닥면적·비용)에 따라 A/B를 고른다.",
    code: `// 자동화 검증 — 같은 도면·랙배치에서 두 전략, 결과는 같은 ~2배
const bays = (rows) => 5 * rows; // 5열 기준

// 기존(수동): 넓은 통로(3.5m) → 3행, 지게차 4단
const man = bays(3) * 4;  // 15 x 4 = 60

// A. 스태커크레인: 통로 1.6m로 4행 + 마스트로 6단 (무인)
const a = bays(4) * 6;    // 20 x 6 = 120  <- 높이(단수)로 2배

// B. 파레트 셔틀: 통로 없앤 deep-lane 6행, 지게차 도달까지 4단
const b = bays(6) * 4;    // 30 x 4 = 120  <- 바닥 밀도로 2배

// A는 위로(단수), B는 안으로(밀도). 같은 60 -> 120이지만 지렛대가 다르다.`,
  },
];

export function StackTab() {
  const [step, setStep] = useState(1);
  const s = STEPS[step - 1];

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        창고 <strong>CAD 평면도(도면)</strong>를 기반으로 적치를 계획합니다. 도면의 적치 구역을 랙 좌표로 읽어
        배치하고, 재고 데이터로 적재율·Capacity를 산정합니다. 기계설계·SolidWorks 감각을 살려 도면 →
        좌표 → 3D 배치로 잇는 흐름입니다.
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
          <div className="mb-1.5 text-xs font-semibold text-slate-500">결과 화면 (도면 기반 미리보기)</div>
          <StepPreview step={s.n} />
        </div>
      </div>

      {step === 5 && (
        <div className="mt-4">
          <div className="mb-1.5 text-xs font-semibold text-slate-500">자동화 전환 배치 플로우맵</div>
          <AutomationFlow />

          {/* A vs B — 축이 다른 두 자동화 전략 비교 */}
          <div className="mt-4 mb-1.5 text-xs font-semibold text-slate-500">A vs B — 어떤 요건이면 뭘 고르나</div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="px-3 py-2 font-semibold">지표</th>
                  <th className="px-3 py-2 font-semibold text-brand-700">A · 스태커크레인 AS/RS</th>
                  <th className="px-3 py-2 font-semibold text-amber-700">B · 파레트 셔틀 (deep-lane)</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-500">높이(단수)</td>
                  <td className="px-3 py-2">마스트가 끝까지 올라가 <strong>고층 6단+</strong> 유리</td>
                  <td className="px-3 py-2">셔틀은 수평만 — 높이는 리프트 도달까지(<strong>중저층</strong>)</td>
                </tr>
                <tr className="border-t border-slate-100 bg-slate-50/40">
                  <td className="px-3 py-2 font-medium text-slate-500">밀도(바닥 활용)</td>
                  <td className="px-3 py-2">통로 1.6m는 필요 — 보통</td>
                  <td className="px-3 py-2">통로 거의 없앤 deep-lane — <strong>밀도 최고</strong></td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-500">무인화</td>
                  <td className="px-3 py-2"><strong>완전 무인</strong> (크레인 + 입출고 컨베이어)</td>
                  <td className="px-3 py-2">반자동 (셔틀은 자동, 출고 이동은 지게차)</td>
                </tr>
                <tr className="border-t border-slate-100 bg-slate-50/40">
                  <td className="px-3 py-2 font-medium text-slate-500">투자비</td>
                  <td className="px-3 py-2">높음 (크레인·레일·제어 설비)</td>
                  <td className="px-3 py-2"><strong>낮음~중간</strong> (셔틀 카트 + 랙)</td>
                </tr>
                <tr className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-500">적합 상황</td>
                  <td className="px-3 py-2">천장 높고 완전 무인이 필요할 때</td>
                  <td className="px-3 py-2">동일 품목을 바닥면적 대비 최대로 밀집 보관할 때</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            같은 도면·랙배치에서 자동화 방식은 하나가 아닙니다. <strong>높이·무인화가 목표면 A</strong>,
            <strong> 바닥면적 대비 밀도가 목표면 B</strong> — 요건에 따라 전략을 고르는 것까지가 검증입니다.
          </p>
        </div>
      )}

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

      <section className="mt-10">
        <h2>실제 three.js를 붙이려면</h2>
        <div className="card">
          로컬에서 <code>npm install three @react-three/fiber @react-three/drei</code>로 스택을 깔고, 도면에서 읽은
          랙 좌표(<code>racksFromZone</code>)를 <code>app/threejs/</code> 아래 실제 컴포넌트에서 3D 박스로 세우면 됩니다.
          캔버스는 반드시 <code>&quot;use client&quot;</code>로 두고, 필요하면 <code>dynamic(() =&gt; import(...), &#123; ssr: false &#125;)</code>로
          클라이언트에서만 로드하세요.
        </div>
      </section>
    </div>
  );
}
