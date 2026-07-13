import Link from "next/link";

// 업무흐름 탭 — 제조물류 시뮬레이션 전체를 도식으로 조망한다.

const MODULES: { title: string; desc: string; href: string; external?: boolean }[] = [
  { title: "랙 설계", desc: "레벨·베이·로케이션 크기로 창고 공간을 정의", href: "/threejs" },
  { title: "적치 · Capacity", desc: "재고 데이터로 적재율과 총 capacity 산정", href: "/threejs" },
  { title: "적재 · 하중", desc: "SKU 적재와 레벨별 하중·적재율 확인", href: "/threejs" },
  { title: "입출고", desc: "GTL 마스터/싱글 출고·배송·PDA 검증·고객배송", href: "/threejs" },
  {
    title: "운송관제",
    desc: "포트폴리오 시스템 UI — ERP · MES · PLM · SCM",
    href: "https://portfolio-git-main-hhh-p.vercel.app/demo/scm",
    external: true,
  },
  {
    title: "발주 · 구매(MRP)",
    desc: "소요량(MRP) 기반 발주·구매 — ERP 시스템 UI",
    href: "https://portfolio-git-main-hhh-p.vercel.app/demo/erp",
    external: true,
  },
];

const FLOW = ["랙 설계", "적치", "적재·하중", "입출고", "고객사"];

export function FlowTab() {
  return (
    <div>
      <section>
        <h2>전체 업무 흐름</h2>
        <svg viewBox="0 0 720 96" className="w-full">
          {FLOW.map((label, i) => {
            const x = 8 + i * 143;
            const last = i === FLOW.length - 1;
            return (
              <g key={label}>
                <rect x={x} y={22} width={128} height={52} rx={10} fill={last ? "#dcfce7" : "#eff6ff"} stroke={last ? "#16a34a" : "#bfdbfe"} />
                <text x={x + 64} y={52} textAnchor="middle" fontSize="14" fontWeight="700" fill={last ? "#166534" : "#1d4ed8"}>
                  {label}
                </text>
                {!last && (
                  <text x={x + 133} y={53} textAnchor="middle" fontSize="16" fill="#94a3b8">→</text>
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
        <h2>입출고 · 운송 · 자재수급 연계</h2>
        <svg viewBox="0 0 720 250" className="w-full">
          <rect x={280} y={12} width={160} height={48} rx={10} fill="#eff6ff" stroke="#bfdbfe" />
          <text x={360} y={32} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1d4ed8">입출고</text>
          <text x={360} y={48} textAnchor="middle" fontSize="10" fill="#64748b">창고 반입·반출 · GTL 검증</text>

          <line x1={360} y1={60} x2={360} y2={104} stroke="#94a3b8" strokeWidth="1.5" />
          <text x={360} y={90} textAnchor="middle" fontSize="16" fill="#94a3b8">↕</text>
          <text x={378} y={88} fontSize="10" fill="#94a3b8">창고 안 ↔ 창고 밖</text>

          <rect x={24} y={110} width={196} height={68} rx={10} fill="#f1f5f9" stroke="#cbd5e1" />
          <text x={122} y={138} textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">Fab / Milk 운송</text>
          <text x={122} y={156} textAnchor="middle" fontSize="10.5" fill="#64748b">Fab 반입·반출 · 밀크런 집하</text>

          <rect x={262} y={110} width={196} height={68} rx={10} fill="#fef3c7" stroke="#d97706" />
          <text x={360} y={138} textAnchor="middle" fontSize="15" fontWeight="700" fill="#b45309">운송</text>
          <text x={360} y={156} textAnchor="middle" fontSize="10.5" fill="#a16207">차량·경로·배차 (TMS)</text>

          <rect x={500} y={110} width={196} height={68} rx={10} fill="#dcfce7" stroke="#16a34a" />
          <text x={598} y={138} textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">자재수급</text>
          <text x={598} y={156} textAnchor="middle" fontSize="10.5" fill="#15803d">소요량 기반 발주·수급</text>

          <text x={241} y={150} textAnchor="middle" fontSize="18" fill="#94a3b8">↔</text>
          <text x={479} y={150} textAnchor="middle" fontSize="18" fill="#94a3b8">↔</text>

          <text x={360} y={204} textAnchor="middle" fontSize="11" fill="#475569">자재수급(발주) → 운송(배차) → Fab/밀크런(집하·반입) → 입출고(창고)</text>
          <text x={360} y={224} textAnchor="middle" fontSize="10" fill="#94a3b8">출고는 역방향: 입출고 → 운송 → Fab/고객사</text>
        </svg>
        <p className="mt-2 text-sm text-slate-500">
          <strong>입출고</strong> 위아래로 <strong>운송</strong> 레이어를 두어, 창고 안(적치·입출고)과 창고 밖(Fab·공급사 간 이동)을
          하나로 잇습니다. 운송은 왼쪽의 <strong>Fab/밀크런 운송</strong>으로 실행되고, 오른쪽의 <strong>자재수급</strong>(소요량·발주)이
          그 운송을 트리거합니다.
        </p>
      </section>

      <section>
        <h2>모듈별 요약</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODULES.map((m) => {
            const cls =
              "flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-4 no-underline shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift";
            return m.external ? (
              <a key={m.title} href={m.href} target="_blank" rel="noopener noreferrer" className={cls}>
                <span className="font-semibold text-slate-900">{m.title}</span>
                <span className="text-sm text-slate-500">{m.desc}</span>
                <span className="mt-1 text-xs font-semibold text-brand-600">외부 데모 열기 ↗</span>
              </a>
            ) : (
              <Link key={m.title} href={m.href} className={cls}>
                <span className="font-semibold text-slate-900">{m.title}</span>
                <span className="text-sm text-slate-500">{m.desc}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
