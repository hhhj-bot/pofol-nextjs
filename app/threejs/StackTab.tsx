"use client";

import { useState } from "react";
import { StepPreview } from "./StepPreview";

// "적치" 탭 — 재고 데이터로 랙 적재율/Capacity를 3D로 보여주는 뷰어를 단계별로 학습.
// 각 스텝마다: 무엇을 하는지(플로우) → 그 스텝의 three.js 코드 → 결과 화면(미리보기).

type Step = { n: number; title: string; file: string; flow: string; code: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "캔버스 & 컨트롤",
    file: "app/threejs/Warehouse.tsx",
    flow: "three.js 스택을 설치하고 빈 3D 씬에 카메라와 OrbitControls만 올린다. 마우스로 회전·확대가 되면 성공.",
    code: `"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export function Warehouse() {
  return (
    <Canvas camera={{ position: [8, 8, 12], fov: 45 }} style={{ height: 420 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 12, 6]} intensity={0.8} />
      {/* 아직 바닥도 랙도 없음. 카메라 + 회전/확대 컨트롤만. */}
      <OrbitControls enableDamping />
    </Canvas>
  );
}`,
  },
  {
    n: 2,
    title: "바닥 & 랙 배치",
    file: "app/threejs/Warehouse.tsx",
    flow: "바닥 평면을 깔고, 재고 데이터(RACKS)를 좌표에 매핑해 랙 박스를 배치한다. 색은 아직 회색.",
    code: `{/* 창고 바닥 */}
<mesh rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[24, 16]} />
  <meshStandardMaterial color="#eef2f7" />
</mesh>

{/* 재고 데이터로 랙 배치 (색은 다음 스텝에서) */}
{RACKS.map((r) => (
  <mesh key={r.id} position={[r.x, 0.75, r.z]}>
    <boxGeometry args={[1.2, 1.5, 1.2]} />
    <meshStandardMaterial color="#94a3b8" />
  </mesh>
))}`,
  },
  {
    n: 3,
    title: "적재율로 색·높이",
    file: "app/threejs/Rack.tsx",
    flow: "적재율(rate)에 따라 색(여유 초록 → 주의 노랑 → 포화 빨강)과 높이를 매핑해 상태를 한눈에 읽는다.",
    code: `// 적재율 -> 색
function color(rate: number) {
  if (rate < 0.7) return "#16a34a"; // 여유
  if (rate < 0.9) return "#d97706"; // 주의
  return "#dc2626";                 // 포화
}

{RACKS.map((r) => {
  const h = 0.5 + r.rate * 3; // 적재율이 높을수록 높게
  return (
    <mesh key={r.id} position={[r.x, h / 2, r.z]}>
      <boxGeometry args={[1.2, h, 1.2]} />
      <meshStandardMaterial color={color(r.rate)} />
    </mesh>
  );
})}`,
  },
  {
    n: 4,
    title: "Capacity 패널",
    file: "app/threejs/Warehouse.tsx",
    flow: "총 랙 수, 평균 적재율, 장기보관(회전 느린) 자재를 계산해 캔버스 위 HTML 오버레이(HUD)로 띄운다.",
    code: `// 재고 데이터로 요약값 계산
const total = RACKS.length;
const avgRate = RACKS.reduce((s, r) => s + r.rate, 0) / total;
const longStay = RACKS.filter((r) => r.stayDays >= 30);

// 캔버스 위에 HTML 오버레이(HUD)로 표시
<div className="hud">
  <div>총 랙 {total}칸</div>
  <div>평균 적재율 {Math.round(avgRate * 100)}%</div>
  <div>장기보관 30일+ {longStay.length}칸</div>
</div>
// 장기보관 랙은 테두리를 진하게 그려 눈에 띄게 한다`,
  },
  {
    n: 5,
    title: "평치 vs 자동화",
    file: "app/threejs/capacity.ts",
    flow: "레이아웃을 토글해 자동화(고층 랙) 전환 시 확보되는 capacity를 정량 비교한다.",
    code: `// 평치 vs 자동화(고층 랙) capacity 비교
function capacity(layout: "flat" | "auto", cells: number) {
  const perCell = layout === "auto" ? 6 : 2; // 자동화는 단수를 더 쌓는다
  return cells * perCell;
}

const flat = capacity("flat", RACKS.length);
const auto = capacity("auto", RACKS.length);
const gain = Math.round(((auto - flat) / flat) * 100);
// 화면: 토글로 flat/auto 전환하며 "자동화 시 +gain%" 표시`,
  },
];

export function StackTab() {
  const [step, setStep] = useState(1);
  const s = STEPS[step - 1];

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        재고 데이터로 랙 적재율·Capacity를 3D로 보여주는 뷰어를 한 스텝씩 만들어 봅니다. 각 스텝마다
        무엇을 하는지 → 코드 → 결과 화면을 같이 봅니다. 결과 화면은 지금 SVG 미리보기이고, 실제 캔버스는
        로컬에서 붙이며 비교하면 됩니다.
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
          <div className="mb-1.5 text-xs font-semibold text-slate-500">결과 화면 (미리보기)</div>
          <StepPreview step={s.n} />
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

      <section className="mt-10">
        <h2>실제 three.js를 붙이려면</h2>
        <div className="card">
          로컬에서 <code>npm install three @react-three/fiber @react-three/drei</code>로 스택을 깔고, 위 코드들을{" "}
          <code>app/threejs/</code> 아래 실제 컴포넌트로 옮기면 됩니다. 캔버스는 반드시{" "}
          <code>&quot;use client&quot;</code>로 두고, 필요하면 <code>dynamic(() =&gt; import(...), &#123; ssr: false &#125;)</code>로
          클라이언트에서만 로드하세요.
        </div>
      </section>
    </div>
  );
}
