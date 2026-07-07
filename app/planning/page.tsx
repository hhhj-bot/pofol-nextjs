import Link from "next/link";

// 업무기획 — 개별 업무PoC(적치/랙설계/적재·하중/입출고)를 하나의 전체 물류 업무로 조망하고,
// 추후 이 모듈들을 이어 붙여 재고→랙→적재→출고·배송·검증까지 한 번에 도는 통합 시뮬레이션으로 확장한다.

const MODULES: { title: string; desc: string }[] = [
  { title: "랙 설계", desc: "레벨·베이·로케이션 크기로 창고 공간을 정의" },
  { title: "적치 · Capacity", desc: "재고 데이터로 적재율과 총 capacity 산정" },
  { title: "적재 · 하중", desc: "SKU 적재와 레벨별 하중·적재율 확인" },
  { title: "입출고", desc: "GTL 마스터/싱글 출고·배송·PDA 검증·고객배송" },
];

const FLOW = ["랙 설계", "적치", "적재·하중", "입출고", "고객사"];

export default function Page() {
  return (
    <main className="container">
      <header className="mode-head">
        <span className="mode-badge">업무기획</span>
        <h1>업무기획 — 전체 물류 업무 조망</h1>
        <p>
          개별 업무PoC 모듈을 하나의 흐름으로 잇습니다. 창고 공간 정의(랙 설계)부터 적치·하중, 그리고
          출고·배송·검증(입출고)까지 — 재고 데이터 하나로 연결되는 엔드투엔드 물류 업무를 기획합니다.
        </p>
      </header>

      <section>
        <h2>전체 업무 흐름</h2>
        <svg viewBox="0 0 720 96" className="w-full">
          {FLOW.map((label, i) => {
            const x = 8 + i * 143;
            const last = i === FLOW.length - 1;
            return (
              <g key={label}>
                <rect
                  x={x}
                  y={22}
                  width={128}
                  height={52}
                  rx={10}
                  fill={last ? "#dcfce7" : "#eff6ff"}
                  stroke={last ? "#16a34a" : "#bfdbfe"}
                />
                <text x={x + 64} y={52} textAnchor="middle" fontSize="14" fontWeight="700" fill={last ? "#166534" : "#1d4ed8"}>
                  {label}
                </text>
                {!last && (
                  <text x={x + 133} y={53} textAnchor="middle" fontSize="16" fill="#94a3b8">
                    →
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-sm text-slate-500">
          각 단계의 상세 설계와 3D/미리보기는 <Link href="/threejs" className="font-semibold text-brand-600 underline">업무PoC</Link> 메뉴에서 볼 수 있습니다.
        </p>
      </section>

      <section>
        <h2>모듈별 요약</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULES.map((m) => (
            <Link
              key={m.title}
              href="/threejs"
              className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 no-underline shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <span className="font-semibold text-slate-900">{m.title}</span>
              <span className="text-sm text-slate-500">{m.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2>추후: 통합 시뮬레이션</h2>
        <div className="card">
          위 모듈들을 하나로 이어, <strong>재고 데이터 → 랙 배치 → 적재·하중 → 출고·배송·검증 → 고객배송</strong>까지
          한 화면에서 연속으로 도는 통합 3D 시뮬레이션으로 확장할 계획입니다. 지금은 각 업무를 개별 설계로
          검증하는 단계이고, 이 기획 페이지가 그 모듈들을 묶는 상위 뷰가 됩니다.
          <span className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            통합 시뮬레이션 — 준비 중
          </span>
        </div>
      </section>
    </main>
  );
}
