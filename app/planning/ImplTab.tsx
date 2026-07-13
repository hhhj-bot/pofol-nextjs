"use client";

import { useState } from "react";
import { ControlTower } from "./ControlTower";
import { FactoryPlan } from "./FactoryPlan";
import { OpsStages } from "./OpsStages";

// 업무구현 탭 — 맨 위에 전체 관제화면, 그 아래를 두 개의 서브탭으로 나눈다.
//   공장·창고 설계 시뮬레이션 : CAD 도면 · 랙 구획 · 입출고 위치 · 동선
//   입출고 · 생산            : 입고 → 생산(설비연동) → 출고

type SubKey = "design" | "ops";

const SUBS: { key: SubKey; label: string; desc: string }[] = [
  { key: "design", label: "공장·창고 설계 시뮬레이션", desc: "CAD 도면 · 랙 구획 · 동선" },
  { key: "ops", label: "입출고 · 생산", desc: "입고 → 생산(설비연동) → 출고" },
];

export function ImplTab() {
  const [sub, setSub] = useState<SubKey>("design");

  return (
    <div>
      {/* 전체 관제화면 (항상 상단) */}
      <section>
        <h2>전체 관제화면</h2>
        <p className="mb-3 text-sm text-slate-500">
          입고·재고·출고·차량을 한 화면에서 조망합니다. 직접 설계한 REST API
          (<code>/api/inbound</code>, <code>/api/inventory</code>, <code>/api/outbound</code>, <code>/api/vehicles</code>)를
          그대로 호출해 채웁니다.
        </p>
        <ControlTower />
      </section>

      {/* 서브탭 */}
      <section className="mt-10">
        <h2>단계별 구현</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUBS.map((t) => {
            const on = t.key === sub;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSub(t.key)}
                className={
                  "flex flex-col items-start rounded-xl border px-4 py-2 text-left transition-colors " +
                  (on
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                <span className="text-sm font-semibold">{t.label}</span>
                <span className="text-[11px] text-slate-400">{t.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">{sub === "design" ? <FactoryPlan /> : <OpsStages />}</div>

        <p className="mt-3 text-xs text-slate-400">
          설계에서 정의한 구획·로케이션·동선이 입고 → 생산(설비연동) → 출고 전 단계의 입력이 됩니다.
        </p>
      </section>
    </div>
  );
}
