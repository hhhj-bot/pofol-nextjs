"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { EquipmentPreview } from "./EquipmentPreview";

// 실제 three.js 캔버스는 클라이언트에서만 로드 (SSR 비활성화)
const Conveyor3D = dynamic(() => import("./Conveyor3D").then((m) => m.Conveyor3D), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
      3D 뷰어 불러오는 중…
    </div>
  ),
});

// "설비 연동" 탭 — 창고(WMS)와 설비(컨베이어·IoT·PLC)가 실제로 어떻게 이어지는지 단계별로 학습.
// 재고 로직만 있던 앞의 두 탭과 달리, 여기서는 GET /api/labels·/api/inventory를 그대로 불러와
// 컨베이어 위 박스 이동과 PLC 신호를 "실데이터"로 구동한다.

type Step = { n: number; title: string; file: string; flow: string; code: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "컨베이어 프레임",
    file: "app/threejs/Conveyor3D.tsx",
    flow: "벨트(긴 박스)와 롤러(원기둥 여러 개), 끝단에 공정 투입 게이트를 세운다. 아직 움직이는 것은 없다.",
    code: `"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const LENGTH = 8; // 컨베이어 길이

export function Conveyor3D() {
  return (
    <Canvas camera={{ position: [6, 5, 9], fov: 45 }} style={{ height: 420 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 10, 6]} />
      {/* 벨트 */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[LENGTH, 0.15, 1]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* 롤러 */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[-LENGTH / 2 + i, 0.3, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
      <OrbitControls enableDamping />
    </Canvas>
  );
}`,
  },
  {
    n: 2,
    title: "GTL 라벨 데이터로 박스 이동",
    file: "app/threejs/Conveyor3D.tsx",
    flow: "GET /api/labels를 fetch해서 받은 라벨(GTL 마스터/싱글)마다 박스를 하나씩 만들고, useFrame으로 컨베이어를 따라 이동시킨다. 끝에 닿으면 다시 처음으로.",
    code: `import { useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";

function useLabels() {
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  useEffect(() => {
    fetch("/api/labels").then((r) => r.json()).then(setLabels);
  }, []);
  return labels;
}

function MovingBox({ label, offset }: { label: LabelRecord; offset: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * SPEED + offset) % LENGTH;
    ref.current.position.x = -LENGTH / 2 + t; // 왼쪽 -> 오른쪽으로 순환 이동
  });
  const size = label.labelType === "MASTER" ? 0.6 : 0.4;
  return (
    <mesh ref={ref} position={[0, 0.55, 0]}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={label.labelType === "MASTER" ? "#2563eb" : "#0ea5e9"} />
    </mesh>
  );
}`,
  },
  {
    n: 3,
    title: "IoT 센서 · PLC 신호 연동",
    file: "app/threejs/Conveyor3D.tsx",
    flow: "GET /api/inventory로 재고 상태(정상/부족/이상)를 함께 받아, 라벨의 SKU와 매칭되는 재고가 이상이면 PLC를 알람(빨강 점멸)으로, 부족이면 주의(노랑)로 바꾼다.",
    code: `function statusToPlc(status: string) {
  if (status === "이상") return "ALARM";
  if (status === "부족") return "WARN";
  return "RUN";
}

// 라벨들의 매칭 재고 중 가장 심각한 상태를 설비 전체 PLC 상태로 사용
const worst = labels.reduce((acc, l) => {
  const item = items.find((i) => i.sku === l.sku);
  const s = item ? statusToPlc(item.status) : "RUN";
  return rank(s) > rank(acc) ? s : acc;
}, "RUN");

// 알람 상태의 센서는 emissive를 깜빡여 경고를 표현
useFrame(({ clock }) => {
  if (plc === "ALARM") {
    const blink = Math.sin(clock.elapsedTime * 8) > 0;
    material.emissiveIntensity = blink ? 1.2 : 0.2;
  }
});`,
  },
  {
    n: 4,
    title: "처리량 · PLC 상태 HUD",
    file: "app/threejs/Conveyor3D.tsx",
    flow: "경과 시간과 컨베이어 속도로 누적 처리량(박스가 게이트를 통과한 횟수)을 근사 계산해 HUD에 PLC 상태와 함께 띄운다.",
    code: `const cycleTime = LENGTH / SPEED; // 박스 1개가 컨베이어를 한 바퀴 도는 시간
const throughput = Math.floor(elapsed / cycleTime) * labels.length;

<div className="hud">
  <div>PLC 상태: {plcLabel(plc)}</div>
  <div>누적 처리량: {throughput}개</div>
  <div>연동 라벨: {labels.length}건 (GET /api/labels)</div>
</div>`,
  },
];

export function EquipmentTab() {
  const [step, setStep] = useState(1);
  const s = STEPS[step - 1];

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        창고(WMS)와 설비(컨베이어·IoT·PLC)가 실제로 어떻게 이어지는지 단계별로 만들어 봅니다. 앞의 두
        탭은 재고 로직만 다뤘다면, 여기서는 이미 만든 REST API(<code>/api/labels</code>,{" "}
        <code>/api/inventory</code>)를 그대로 fetch해서 3D 애니메이션을 구동합니다.
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
          <EquipmentPreview step={s.n} />
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
        <h2>최종 결과물 — 인터랙티브 3D (실데이터 연동)</h2>
        <p className="mb-3 text-sm text-slate-500">
          위 스텝을 합친 실제 three.js 뷰어입니다. <code>/api/labels</code>·<code>/api/inventory</code>를
          그대로 호출해 박스 이동과 PLC 신호를 구동합니다 — <code>/test</code> 페이지에서 스캔했던 그
          데이터가 여기서는 3D 애니메이션으로 나타납니다. 드래그로 회전, 스크롤로 확대하세요.
        </p>
        <Conveyor3D />
      </section>
    </div>
  );
}
