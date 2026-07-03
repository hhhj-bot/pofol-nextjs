// 기술 선택 비교 페이지 (Next.js App Router, 서버 컴포넌트)
// 컨셉: "이 포트폴리오는 Vite로 만들었다. 그렇다면 Next.js는 언제 도입하는가?"
//       프레임워크 자체를 비교하는 게 아니라, 프로젝트 성격·팀 성향에 따른 선택 기준을 보여준다.
import Link from "next/link";

type CompareRow = {
  topic: string; // 비교 항목
  vite: string; // Vite(SPA) 관점
  next: string; // Next.js 관점
};

// 핵심 비교 항목 — 표로 렌더링
const COMPARE: CompareRow[] = [
  {
    topic: "렌더링 방식",
    vite: "CSR(클라이언트 렌더링) 단일 페이지(SPA)",
    next: "CSR + SSR + SSG + ISR 선택 가능 (하이브리드)",
  },
  {
    topic: "라우팅",
    vite: "react-router-dom 등 별도 설치/구성",
    next: "파일 기반 라우팅 내장 (app/ 디렉터리)",
  },
  {
    topic: "SEO / 초기 로딩",
    vite: "초기 HTML이 비어 있어 SEO·첫 표시 불리",
    next: "서버에서 HTML 완성 → SEO·초기 표시 유리",
  },
  {
    topic: "서버 기능",
    vite: "프런트 전용. API는 별도 백엔드 필요",
    next: "Route Handler·Server Actions로 백엔드 일부 흡수",
  },
  {
    topic: "빌드·배포",
    vite: "정적 파일(dist) → 어떤 정적 호스팅/엔진엑스에도 배포",
    next: "Node 런타임 필요(SSR 시). 정적 export도 가능하나 제약",
  },
  {
    topic: "학습 곡선·설정",
    vite: "얇고 단순. 설정이 적어 입문·소규모에 빠름",
    next: "규약·개념(서버/클라 컴포넌트 등)이 많아 진입장벽↑",
  },
  {
    topic: "개발 서버 속도",
    vite: "esbuild 기반, 매우 빠른 HMR",
    next: "Turbopack 도입으로 개선됐으나 상대적으로 무거움",
  },
];

// Next.js 도입의 장점 / 단점
const PROS: string[] = [
  "검색 노출이 필요한 공개 웹(랜딩·블로그·커머스)에서 SSR/SSG로 SEO·초기 표시 우위",
  "파일 기반 라우팅·이미지 최적화·메타데이터 등 '관례화된 인프라'를 기본 제공",
  "Server Actions / Route Handler로 간단한 백엔드를 한 저장소에서 처리 (BFF 패턴)",
  "Vercel 등과의 배포 통합이 매끄럽고 캐싱 전략이 정교함",
];

const CONS: string[] = [
  "사내 대시보드처럼 로그인 뒤에서만 도는 화면은 SSR 이점이 거의 없음",
  "서버 런타임이 필요해 컨테이너/쿠버네티스 배포 시 정적 SPA보다 운영 부담↑",
  "서버/클라이언트 컴포넌트 경계, 캐싱 규약 등 학습·디버깅 비용이 큼",
  "규약이 강해 자유도가 낮고, 단순 SPA에는 과한 추상화일 수 있음",
];

// 의사결정 가이드 — 어떤 상황에 무엇이 맞나
type Guide = { when: string; pick: "vite" | "next"; why: string };
const GUIDE: Guide[] = [
  {
    when: "로그인 기반 사내 대시보드 / 어드민 / 실시간 모니터링",
    pick: "vite",
    why: "SEO 불필요, 인증 후 진입, 빠른 인터랙션이 핵심 → 가벼운 SPA가 적합",
  },
  {
    when: "검색 유입이 중요한 공개 웹 (마케팅·커머스·콘텐츠)",
    pick: "next",
    why: "SSR/SSG로 초기 HTML·메타데이터를 채워 SEO와 첫 표시를 확보",
  },
  {
    when: "백엔드를 따로 두기 어려운 소규모 풀스택 프로젝트",
    pick: "next",
    why: "Route Handler·Server Actions로 한 저장소에서 API까지 처리",
  },
  {
    when: "프런트 전담 + 별도 백엔드(NestJS 등)가 이미 있는 팀",
    pick: "vite",
    why: "프런트는 SPA로 단순하게, 서버 책임은 기존 백엔드에 위임",
  },
];

export default function Page() {
  return (
    <main className="container">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-100">
          Frontend · Rendering Strategy
        </span>
        <h1 className="mt-4 bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          Vite vs Next.js — 어떤 기준으로 선택했는가
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          제조 시스템 UI 포트폴리오(ERP·MES·PLM·SCM)는{" "}
          <strong className="font-semibold text-slate-700">Vite + React(SPA)</strong>로 구현했습니다.
          그 선택의 근거와, Next.js를 도입한다면 언제가 적절한지를 정리했습니다.
        </p>
      </header>

      <div className="banner">
        결론부터: 정답인 프레임워크는 없습니다. <strong>프로젝트의 성격(공개 웹 vs 사내 도구)</strong>과
        <strong> 팀의 구조(풀스택 vs 프런트 전담)</strong>에 따라 선택이 갈립니다.
      </div>

      {/* 0. 라이브 렌더링 데모 */}
      <section>
        <h2>0. 라이브 렌더링 데모 (SSR · SSG · ISR · CSR)</h2>
        <p className="mb-4 text-sm text-slate-500">
          같은 재고 API(<code>/api/inventory</code>, 서버리스 함수)를 4가지 방식으로 렌더링합니다.
          각 페이지에서 <strong>새로고침하며 타임스탬프 변화</strong>를 비교하고, <strong>“코드 보기”</strong>로 실제 구현을 확인하세요.
        </p>
        <div className="demo-grid">
          <Link href="/ssr" className="demo-card">
            <span className="mode-badge">SSR</span>
            <b>서버 렌더링</b>
            <small>요청마다 최신 · 새로고침 시 매번 변함</small>
          </Link>
          <Link href="/ssg" className="demo-card">
            <span className="mode-badge">SSG</span>
            <b>정적 생성</b>
            <small>빌드 시 고정 · 새로고침해도 그대로</small>
          </Link>
          <Link href="/isr" className="demo-card">
            <span className="mode-badge">ISR</span>
            <b>증분 정적 재생성</b>
            <small>20초 주기로 갱신</small>
          </Link>
          <Link href="/csr" className="demo-card">
            <span className="mode-badge">CSR</span>
            <b>클라이언트 렌더링</b>
            <small>브라우저가 로드 · 소스엔 데이터 없음</small>
          </Link>
        </div>
      </section>

      {/* 1. 왜 이 프로젝트는 Vite인가 */}
      <section>
        <h2>1. 이 프로젝트가 Vite를 선택한 이유</h2>
        <div className="card">
          이 포트폴리오의 화면들은 <strong>로그인 후 진입하는 사내 운영 대시보드</strong> 성격입니다.
          검색엔진 노출(SEO)이 필요 없고, 서버 렌더링으로 얻을 초기 표시 이점도 크지 않습니다.
          반면 차트·필터·실시간 갱신 같은 <strong>클라이언트 인터랙션</strong>이 화면의 핵심이죠.
          이 조건에서는 설정이 얇고 HMR이 빠른 <strong>Vite SPA</strong>가 생산성과 단순성 모두에서 유리합니다.
          또한 빌드 산출물이 <strong>정적 파일(dist)</strong>이라, 이후 Docker·Nginx·Kubernetes로
          배포하기에도 가볍습니다.
        </div>
      </section>

      {/* 2. 핵심 비교표 */}
      <section>
        <h2>2. 항목별 비교</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: "20%" }}>항목</th>
              <th style={{ width: "40%" }}>Vite + React (SPA)</th>
              <th style={{ width: "40%" }}>Next.js</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE.map((row) => (
              <tr key={row.topic}>
                <td>
                  <strong>{row.topic}</strong>
                </td>
                <td className="dim">{row.vite}</td>
                <td className="dim">{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 3. Next.js 도입 장단점 */}
      <section>
        <h2>3. Next.js를 도입했을 때의 장단점</h2>
        <div className="grid2">
          <div className="card pros">
            <h3>장점</h3>
            <ul>
              {PROS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="card cons">
            <h3>단점 / 비용</h3>
            <ul>
              {CONS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. 의사결정 가이드 */}
      <section>
        <h2>4. 상황별 선택 가이드</h2>
        <div className="decision">
          {GUIDE.map((g) => (
            <div className="card" key={g.when}>
              <span className={g.pick === "vite" ? "badge badge-vite" : "badge badge-next"}>
                {g.pick === "vite" ? "Vite 권장" : "Next.js 권장"}
              </span>
              <p style={{ marginTop: 10, fontWeight: 600 }}>{g.when}</p>
              <p className="mt-1.5 text-sm text-slate-500">{g.why}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="conclusion">
        <h2>정리</h2>
        <p>
          이 포트폴리오는 <strong>사내 대시보드</strong>라는 성격상 Vite SPA가 맞았습니다. 만약 동일한 UI를
          외부 고객용 공개 포털로 확장하거나, 별도 백엔드 없이 빠르게 풀스택으로 가야 한다면 그때는
          Next.js 도입을 검토합니다. 즉 기술 선택은 취향이 아니라{" "}
          <strong>요구사항과 팀 구조에 대한 의사결정</strong>입니다.
        </p>
      </div>
    </main>
  );
}
