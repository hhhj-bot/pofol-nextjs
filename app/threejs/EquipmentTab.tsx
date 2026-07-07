"use client";

import { useState } from "react";
import { EquipmentPreview } from "./EquipmentPreview";

// "입출고" 탭 — GTL 라벨(마스터/싱글) 기준의 출고·배송·입고 검증 흐름을 단계별로 학습.
//   싱글 라벨(생산) → 마스터(아우터박스) 포장 → 창고 픽업·출고 → 배송 →
//   도착지 입고예정서 검증 → 개봉·싱글 확인 → 고객 배송
// (컨베이어를 이용한 설비 연동은 별개 업무로 추후 도입 예정)

type Step = { n: number; title: string; file: string; flow: string; code: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "싱글 라벨 (생산)",
    file: "GET /api/labels",
    flow: "생산된 제품을 박스포장하고, 라벨 프린터에서 싱글 라벨을 출력해 각 박스에 부착한다. /api/labels에서 SINGLE만 걸러 낱개 박스를 확인한다.",
    code: `// 생산된 제품마다 싱글 라벨 부착 → SINGLE만 필터
const res = await fetch("/api/labels");
const labels: LabelRecord[] = await res.json();

const singles = labels.filter((l) => l.labelType === "SINGLE");
// 각 싱글: labelCode, sku, lotNo, qty (낱개 박스 단위)`,
  },
  {
    n: 2,
    title: "마스터 포장",
    file: "app/lib/labels.ts",
    flow: "싱글 N개를 하나의 아우터박스에 담고 마스터 라벨을 부착한다. 싱글은 masterCode로 자기 마스터를 가리킨다.",
    code: `// 싱글을 마스터(masterCode)별로 묶는다 = 아우터박스 포장
function singlesOf(masterCode: string) {
  return labels.filter(
    (l) => l.labelType === "SINGLE" && l.masterCode === masterCode
  );
}

// 마스터 한 장에 싱글 N개가 담긴다
// master.boxCount === singlesOf(master.labelCode).length`,
  },
  {
    n: 3,
    title: "창고 픽업·출고",
    file: "출고 지시",
    flow: "마스터 단위로 창고에 보관했다가 픽업해 출고한다. 이 단계부터는 낱개 싱글이 아니라 마스터(아우터박스)가 이동 단위다.",
    code: `// 마스터 단위로 창고에서 픽업·출고 (싱글 낱개 아님)
const outbound = labels.filter((l) => l.labelType === "MASTER");

for (const m of outbound) {
  ship(m.palletNo, m.destination); // 파렛트/목적지로 출고 지시
}`,
  },
  {
    n: 4,
    title: "상차·배송",
    file: "배송 추적",
    flow: "마스터를 컨베이어로 이송해 트럭에 상차한 뒤 도착지 허브로 배송한다. 운송 중에는 마스터 코드만으로 추적하고, 내부 싱글은 개봉 전까지 열지 않는다.",
    code: `// 마스터를 도착지로 배송, 마스터 코드로 추적
const inTransit = masters().map((m) => ({
  master: m.labelCode,
  to: m.destination,   // "아산", "이천" ...
  boxes: m.boxCount,   // 안에 든 싱글 수 (개봉 전엔 미확인)
}));`,
  },
  {
    n: 5,
    title: "입고 검증 (송장 대조)",
    file: "도착지 검증",
    flow: "도착지에서 PDA로 마스터 라벨과 송장(거래명세서) 라벨을 스캔해 대조한다. 코드가 일치하고, 송장 예정 수량과 실제 싱글 수가 맞는지 확인한다.",
    code: `// 도착지: PDA로 마스터 라벨 <-> 송장(거래명세서) 대조
function verifyMaster(code: string) {
  const m = findLabel(code);
  const actual = singlesOf(code).length;
  return {
    ok: !!m && actual === m?.boxCount,
    expected: m?.boxCount,
    actual,
  };
}`,
  },
  {
    n: 6,
    title: "개봉·싱글 확인·고객배송",
    file: "개봉 검수",
    flow: "마스터 검증이 끝나면 아우터박스를 개봉해 안의 싱글을 하나씩 검수하고, 각 싱글은 서로 다른 고객사로 개별 배송한다.",
    code: `// 아우터박스 개봉 → 싱글별 검수 → 싱글마다 각 고객사로 개별 배송
const singles = singlesOf(master.labelCode);

for (const s of singles) {
  if (scanned.has(s.labelCode)) {
    deliverTo(s.customer, s.labelCode); // 싱글 → 각 고객사
  }
}`,
  },
];

export function EquipmentTab() {
  const [step, setStep] = useState(1);
  const s = STEPS[step - 1];

  return (
    <div>
      <p className="text-sm leading-relaxed text-slate-600">
        GTL 라벨(마스터/싱글) 기준의 <strong>출고 → 배송 → 입고 검증</strong> 흐름을 한 스텝씩 봅니다.
        싱글 N개가 하나의 마스터(아우터박스)로 묶여 이동하고, 도착지에서 송장 라벨을 PDA로 대조해 검증한 뒤 개봉해
        싱글을 확인하고, 각 싱글은 서로 다른 고객사로 개별 배송됩니다. 이미 만든 REST API(<code>/api/labels</code>)를 그대로 씁니다.
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

      <p className="mt-8 text-xs text-slate-400">
        참고: 컨베이어를 이용한 설비 연동(자동 분류·IoT/PLC)은 입출고와 다른 업무라, 별도 탭으로 추후 도입할 예정입니다.
      </p>
    </div>
  );
}
