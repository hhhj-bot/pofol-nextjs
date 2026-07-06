"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LoadPreview } from "./LoadPreview";

// 실제 three.js 캔버스는 클라이언트에서만 로드 (SSR 비활성화)
const Warehouse3D = dynamic(() => import("./Warehouse3D").then((m) => m.Warehouse3D), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
      3D 뷰어 불러오는 중…
    </div>
  ),
});

// "적재/하중" 탭 — 설계된 랙에 SKU를 적재하고 무게로 하중·적재율을 보는 뷰어를 단계별로 학습.
// 각 스텝: 무엇을 하는지(플로우) → three.js 코드 → 결과 화면(미리보기).

type Step = { n: number; title: string; file: string; flow: string; code: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "랙 프레임 3D",
    file: "app/threejs/RackView.tsx",
    flow: "랙 설계 탭에서 정한 레벨·베이 수로 랙 프레임(가로 빔)을 3D로 세운다. OrbitControls로 돌려본다.",
    code: `"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export function RackView({ levels, bays }: { levels: number; bays: number }) {
  return (
    <Canvas camera={{ position: [7, 6, 9], fov: 45 }} style={{ height: 420 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 10, 6]} />
      {/* 레벨마다 가로 빔 */}
      {Array.from({ length: levels + 1 }).map((_, i) => (
        <mesh key={i} position={[0, i * 1.2, 0]}>
          <boxGeometry args={[bays * 1.2, 0.06, 1.2]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
      <OrbitControls enableDamping />
    </Canvas>
  );
}`,
  },
  {
    n: 2,
    title: "SKU 적재",
    file: "app/threejs/RackView.tsx",
    flow: "로케이션 데이터에서 SKU가 있는 칸에만 파레트 박스를 놓는다. 빈 칸은 그대로 둔다.",
    code: `// SKU가 있는 로케이션에만 파레트를 적재
{LOCS.filter((l) => l.sku).map((l) => (
  <mesh key={l.code} position={cellPos(l)}>
    <boxGeometry args={[1.0, 0.6, 1.0]} />
    <meshStandardMaterial color="#3b82f6" />
  </mesh>
))}

// 레벨/베이 -> 3D 좌표
function cellPos(l) {
  const x = (l.bay - 1) * 1.2 - ((BAYS - 1) * 1.2) / 2;
  const y = (l.level - 1) * 1.2 + 0.5;
  return [x, y, 0];
}`,
  },
  {
    n: 3,
    title: "무게로 하중 색상",
    file: "app/threejs/load.ts",
    flow: "레벨별 무게 합계를 허용하중과 비교해 빔 색을 바꾼다. 초과 위험이면 빨강으로 경고한다.",
    code: `const ALLOWABLE = 1000; // 레벨(빔)당 허용하중 kg

function levelLoad(level: number) {
  return LOCS.filter((l) => l.level === level)
             .reduce((s, l) => s + (l.weight ?? 0), 0);
}

function loadColor(ratio: number) {
  if (ratio < 0.7) return "#16a34a";  // 여유
  if (ratio < 0.95) return "#d97706"; // 주의
  return "#dc2626";                   // 허용하중 초과 위험
}

// 빔: <meshStandardMaterial color={loadColor(levelLoad(level) / ALLOWABLE)} />`,
  },
  {
    n: 4,
    title: "적재율 계산",
    file: "app/threejs/load.ts",
    flow: "채워진 로케이션 수로 전체 적재율을 구하고, 레벨별 하중과 함께 HUD로 표시한다.",
    code: `// 적재율 = 채워진 로케이션 / 전체 로케이션
const filled = LOCS.filter((l) => l.sku).length;
const fillRate = filled / LOCS.length;

// HUD 오버레이 예시
<div className="hud">
  <div>전체 적재율 {Math.round(fillRate * 100)}%</div>
  <div>L1 {levelLoad(1)}kg · L2 {levelLoad(2)}kg · L3 {levelLoad(3)}kg</div>
</div>`,
  },
  {
    n: 5,
    title: "로케이션별 SKU 리스트",
    file: "app/threejs/SkuList.tsx",
    flow: "적재된 로케이션을 로케이션·SKU·수량·중량 테이블로 뽑아, 3D 뷰 옆에 리스트로 보여준다.",
    code: `// 로케이션별 SKU 리스트 데이터
const rows = LOCS.filter((l) => l.sku).map((l) => ({
  location: l.code,
  sku: l.sku,
  qty: l.qty,
  weightKg: l.weight,
}));

// <table>로 로케이션 / SKU / 수량 / 중량 렌더
// 3D에서 특정 랙을 클릭하면 해당 행을 하이라이트하도록 확장 가능`,
  },
];

export function LoadTab() {
  const [step, setStep] = useState(1);
  const s = STEPS[step - 1];

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        설계된 랙에 SKU를 적재하고, 무게로 레벨별 하중과 전체 적재율을 보는 뷰어를 한 스텝씩 만듭니다.
        각 스텝마다 무엇을 하는지 → 코드 → 결과 화면을 같이 봅니다.
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
          <LoadPreview step={s.n} />
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
        <h2>최종 결과물 — 인터랙티브 3D</h2>
        <p className="mb-3 text-sm text-slate-500">
          위 스텝을 합친 실제 three.js 뷰어입니다. 드래그로 회전, 스크롤로 확대하세요. 레벨 빔 색 = 하중
          상태(초록 여유 / 노랑 주의 / 빨강 초과), 파란 박스 = 적재된 SKU입니다.
        </p>
        <Warehouse3D />
      </section>
    </div>
  );
}
