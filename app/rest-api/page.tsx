import Link from "next/link";
import { Tabs, type TabItem } from "../components/Tabs";

// /rest-api — 이 저장소에 추가한 REST API의 설계 배경을 설명하는 페이지.
// 홈(page.tsx)의 "Vite vs Next.js" 설명과 같은 톤으로, 이번엔 API 설계 근거를 다룬다.
type Endpoint = {
  method: string;
  path: string;
  desc: string;
};

// 6번 섹션 "API 설계 관점" 탭 콘텐츠 — 이 메뉴에 들어왔을 때 정리해서 학습하는 노트.
// "좋은 설계란"으로 시작해서, 이 프로젝트의 도메인 관점, 그리고 실무에서 같이 따라오는
// 주제(React Query 캐시·커넥션 풀·인증·페이지네이션)까지 이어간다.
const DESIGN_TABS: TabItem[] = [
  {
    id: "good-design",
    label: "좋은 설계란",
    content: (
      <div className="card">
        <p>
          <code className="font-mono">GET /api/hello</code> 처럼 아무 규칙 없이도 동작하는 API에서 출발해,
          원칙을 하나씩 더하면 이 프로젝트의 <code className="font-mono">/api/inventory</code>,{" "}
          <code className="font-mono">/api/labels</code>가 된다.
        </p>
        <ul className="mt-3">
          <li>
            <strong>리소스 중심 URL</strong> — 동사가 아니라 명사로: <code>/api/labels/{"{code}"}</code>는
            되지만 <code>/api/getLabel?code=...</code>은 REST스럽지 않다.
          </li>
          <li>
            <strong>HTTP 메서드의 의미를 지킨다</strong> — GET은 부작용이 없어야 하고(멱등성), 캐시 가능해야
            한다. 이 프로젝트가 지금 GET만 두는 이유이기도 하다.
          </li>
          <li>
            <strong>일관된 응답/에러 포맷</strong> — 이 프로젝트는 실패 시 항상{" "}
            <code>{"{ error, message }"}</code> 형태를 쓴다. 호출하는 쪽(PDA/Flutter)이 분기 로직을 한 벌만
            짜면 되게 하기 위함.
          </li>
          <li>
            <strong>상태 코드를 정확히 쓴다</strong> — 200/404를 구분하지 않고 전부 200 + 에러 필드로
            때우면, 클라이언트가 매번 바디를 열어봐야 한다.
          </li>
          <li>
            <strong>코드와 문서가 어긋나지 않게</strong> — Swagger 주석(<code>@swagger</code>)을 route.ts
            안에 같이 둬서, 엔드포인트를 고치면 문서도 같이 고쳐지게 만들었다.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "domain",
    label: "도메인 관점",
    content: (
      <div className="card">
        <p>
          같은 원칙이라도 <strong>창고 PDA(WMS)</strong>라는 도메인을 만나면 구체적인 선택이 갈린다.
        </p>
        <ul className="mt-3">
          <li>
            <strong>재고(inventory)와 라벨(label)을 분리</strong> — 재고는 "품목" 단위 개념이고, 라벨은
            "물리적으로 박스/팔레트에 붙은 바코드" 단위 개념이다. 하나의 SKU가 여러 라벨(마스터 1장 + 싱글
            여러 장)에 걸쳐 존재할 수 있어, 둘을 같은 리소스로 합치면 표현이 어색해진다.
          </li>
          <li>
            <strong>라벨 스캔 응답이 <code>{"{ label, item }"}</code>을 함께 반환</strong> — PDA는 창고
            현장에서 스캔 한 번으로 화면에 필요한 정보(라벨 상세 + 재고 상태)를 바로 봐야 한다. 저속
            네트워크·현장 작업이라는 조건에서, 왕복 횟수를 줄이는 게 REST 순수성보다 우선한다(BFF 패턴과
            같은 절충).
          </li>
          <li>
            <strong>지금 GET만 있는 이유</strong> — 아직은 "스캔해서 조회"하는 흐름만 검증하는 단계라서다.
            입고/출고를 실제로 반영하려면 그때 쓰기 엔드포인트가 필요해진다(5번 섹션 참고).
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "react-query",
    label: "React Query 캐시",
    content: (
      <div className="card">
        <p>
          지금 <code className="font-mono">/test</code> 페이지는 <code>useState</code> + <code>fetch</code>로
          직접 구현했지만, 실제 PDA/프런트 클라이언트에서는 <strong>React Query</strong> 같은 서버 상태
          캐시 레이어를 쓰는 게 좋다.
        </p>
        <ul className="mt-3">
          <li>
            <strong>queryKey</strong> — <code>{"['label', code]"}</code>처럼 요청을 식별하는 키. 같은 라벨을
            다시 스캔하면 같은 키로 캐시를 먼저 본다.
          </li>
          <li>
            <strong>staleTime</strong> — 이 시간 안에는 "신선한" 데이터로 취급해 재요청 없이 캐시를 그대로
            보여준다. 창고처럼 네트워크가 불안정한 현장에서는 staleTime을 넉넉히 잡아 왕복을 줄이는 편이
            유리하다.
          </li>
          <li>
            <strong>gcTime(구 cacheTime)</strong> — 화면에서 안 쓰인 뒤에도 캐시를 메모리에 얼마나 더
            들고 있을지. 같은 박스를 다시 스캔할 확률이 높다면 길게 잡는다.
          </li>
          <li>
            <strong>invalidateQueries</strong> — 재고가 실제로 바뀌는 이벤트(입고/출고)가 생기면 관련
            쿼리를 강제로 무효화해서 다음 스캔 때 최신 값을 받게 한다.
          </li>
          <li>
            <strong>서버 캐시와의 관계</strong> — React Query는 클라이언트(브라우저/앱) 메모리 캐시고,
            ISR·HTTP Cache-Control은 서버/CDN 캐시다. 이 프로젝트의 <Link href="/isr" className="font-semibold text-brand-600 underline">ISR 데모</Link>가 서버 쪽 캐시 절충을 보여준다면,
            React Query는 클라이언트 쪽 캐시 절충이다 — 계층이 다르다.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "connection-pool",
    label: "커넥션 풀",
    content: (
      <div className="card">
        <p>
          지금은 <code className="font-mono">ITEMS</code>가 그냥 메모리 배열이라 DB가 없고, 따라서 커넥션
          풀도 필요 없다. 하지만 <code>getInventory()</code>가 실제 DB 쿼리로 바뀌는 순간 이 개념을 바로
          마주치게 된다.
        </p>
        <ul className="mt-3">
          <li>
            <strong>왜 필요한가</strong> — DB 커넥션을 맺는 비용(TCP 핸드셰이크, 인증)은 크다. 요청마다
            새로 맺으면 느리고, DB 쪽 최대 커넥션 수도 금방 바닥난다. 그래서 커넥션을 미리 만들어 두고
            재사용하는 풀을 둔다.
          </li>
          <li>
            <strong>서버리스와의 충돌</strong> — Next.js Route Handler(서버리스 함수)는 인스턴스가 요청마다
            새로 뜰 수 있다. 각 인스턴스가 자기 풀을 따로 가지면, 동시 인스턴스 수만큼 DB 커넥션이 늘어나
            DB가 감당 못 할 수 있다 — 실제로 이 프로젝트의 SSR 페이지 배포 노트(자기 API 자기호출 hang
            이슈)와 결이 비슷한, "서버리스 특유의 함정"이다.
          </li>
          <li>
            <strong>실무 대응</strong> — PgBouncer 같은 별도 커넥션 풀러, 혹은 Prisma Accelerate/Neon처럼
            서버리스 환경을 고려해 만들어진 풀링 서비스를 DB 앞단에 둔다.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "auth",
    label: "인증 · 보안",
    content: (
      <div className="card">
        <p>
          지금은 <code className="font-mono">middleware.ts</code>에서 <code>Access-Control-Allow-Origin: *</code>로
          CORS를 완전히 열어뒀다 — 시뮬레이션 단계라 인증이 아예 없다는 뜻이기도 하다.
        </p>
        <ul className="mt-3">
          <li>
            <strong>다음 단계</strong> — Flutter PDA 앱이 실제로 붙으면 최소한 API Key 헤더나 창고 직원/디바이스
            단위 JWT 정도는 필요하다. PDA는 "로그인한 사람"이 아니라 "지급받은 단말"이 호출하는 경우가 많아,
            디바이스 단위 인증이 더 자연스러울 수 있다.
          </li>
          <li>
            <strong>CORS 좁히기</strong> — Origin을 <code>*</code>에서 실제 Flutter 웹 배포 도메인, 그리고
            다른 Vercel 프런트 도메인만 담은 화이트리스트로 좁힌다.
          </li>
          <li>
            <strong>왜 지금은 안 했나</strong> — 아직 호출하는 클라이언트(Flutter 앱)가 없어서, 인증 방식을
            먼저 정하기보다 API 형태(엔드포인트·응답 규약)를 먼저 굳히는 쪽을 택했다.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "pagination",
    label: "페이지네이션 · 성능",
    content: (
      <div className="card">
        <p>
          <code className="font-mono">GET /api/inventory</code>, <code className="font-mono">GET /api/labels</code>는
          지금 목록 전체를 한 번에 반환한다 — 목업 데이터가 5~6건이라 문제가 없을 뿐이다.
        </p>
        <ul className="mt-3">
          <li>
            <strong>페이지네이션</strong> — 실제 창고 재고는 SKU가 수천~수만 건일 수 있다. 오프셋 기반보다
            <code> cursor </code> 기반 페이지네이션이 대량 데이터·실시간 변경에 더 안전하다.
          </li>
          <li>
            <strong>필터링</strong> — 거점(site)·상태(status)별로 서버에서 걸러 내려주는 쿼리 파라미터(
            <code>?site=이천&status=부족</code>)가 있으면 클라이언트가 전체를 받아 걸러낼 필요가 없다.
          </li>
          <li>
            <strong>N+1 문제</strong> — PDA가 스캔 로그를 여러 건 쌓은 뒤 각 라벨의 재고를 하나씩 조회하면
            N+1이 발생한다. <code>POST /api/inventory/batch</code>처럼 SKU 배열을 한 번에 받는 배치 조회
            엔드포인트를 고려할 만하다.
          </li>
        </ul>
      </div>
    ),
  },
];

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/hello", desc: "가장 단순한 예시 엔드포인트 — 설계 원칙을 설명할 때 기준점" },
  { method: "GET", path: "/api/inventory", desc: "재고 전체 목록 (CSR 데모가 브라우저에서 호출)" },
  { method: "GET", path: "/api/inventory/{sku}", desc: "재고 단건 — 품목 바코드 스캔 시 상세 조회" },
  { method: "GET", path: "/api/labels", desc: "GTL 라벨 목록 — PDA 테스트용 스캔 코드 목록" },
  { method: "GET", path: "/api/labels/{code}", desc: "GTL 라벨 스캔 — 라벨 상세 + 매칭된 재고를 함께 반환" },
];

export default function RestApiPage() {
  return (
    <main className="container">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-100">
          Backend · REST API
        </span>
        <h1 className="mt-4 bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
          창고 PDA(GTL 라벨) 시뮬레이션 API
        </h1>
        <p className="mt-3 max-w-2xl text-slate-500">
          창고 PDA(핸디터미널)가 <strong className="font-semibold text-slate-700">GTL 마스터/싱글 라벨</strong>을
          스캔하는 상황을 흉내낸 조회 전용 REST API다. Route Handler(서버리스 함수)가 별도 백엔드 없이 그
          역할을 맡는다.
        </p>
      </header>

      <div className="banner">
        지금은 조회(GET)만 있다. 목적은 <strong>Flutter로 만들 PDA 앱</strong>과 <strong>별도로 배포될 다른
        Vercel 프런트</strong>가 이 API를 그대로 호출하는 것 — 그래서 스펙(Swagger)과 CORS를 먼저 갖춰뒀다.
      </div>

      <section>
        <h2>1. 왜 이 API가 필요한가</h2>
        <div className="card">
          실제 창고에서 PDA는 박스나 팔레트에 붙은 <strong>GTL 라벨</strong>을 스캔해 그 자리에서 품목·수량·로트
          정보를 확인한다. 라벨은 두 종류다: <strong>마스터 라벨</strong>(팔레트/박스 단위, 여러 싱글 박스를
          묶음)과 <strong>싱글 라벨</strong>(낱개 박스 단위). 이 API는 그 스캔 동작을{" "}
          <code className="rounded bg-white px-1 py-0.5 font-mono text-[13px] text-brand-700">
            GET /api/labels/{"{code}"}
          </code>{" "}
          하나로 재현한다 — 라벨 코드를 넘기면 라벨 상세와 매칭된 재고를 함께 돌려준다.
        </div>
      </section>

      <section>
        <h2>2. 엔드포인트</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Method</th>
              <th style={{ width: "33%" }}>Path</th>
              <th style={{ width: "55%" }}>설명</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={e.path}>
                <td>
                  <span className="badge badge-next">{e.method}</span>
                </td>
                <td style={{ fontFamily: "monospace" }}>{e.path}</td>
                <td className="dim">{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. 응답 · 에러 규약</h2>
        <div className="grid2">
          <div className="card pros">
            <h3>성공 (200)</h3>
            <p className="text-sm text-slate-500">
              단건 조회는 리소스 객체를 그대로, 목록은 배열(또는 <code>items</code> 필드)로 반환한다. 라벨
              스캔은 <code>{"{ label, item }"}</code> 형태로 라벨과 매칭 재고를 함께 준다.
            </p>
          </div>
          <div className="card cons">
            <h3>실패 (404)</h3>
            <p className="text-sm text-slate-500">
              존재하지 않는 SKU/라벨 코드는 <code>{"{ error: \"NOT_FOUND\", message }"}</code> 형태로 통일해
              돌려준다 — PDA/Flutter 쪽에서 에러 처리를 한 가지 형태로만 다루면 되게 하기 위함이다.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>4. 외부 호출 대비 (CORS)</h2>
        <div className="card">
          이 API는 이 Next.js 배포 바깥의 <strong>Flutter 앱</strong>과 <strong>다른 Vercel 프런트</strong>에서
          호출될 예정이라 <code>middleware.ts</code>에서 <code>/api/*</code> 전체에 CORS를 열어뒀다(Origin: *,
          Method: GET/OPTIONS). 실서비스로 넘어가면 허용 Origin을 화이트리스트로 좁힐 계획이다.
        </div>
      </section>

      <section>
        <h2>5. 왜 아직 GET만 있는가</h2>
        <div className="card">
          지금 단계는 <strong>PDA가 스캔해서 조회하는 흐름</strong>을 검증하는 시뮬레이션이라 쓰기(POST/PUT)가
          필요 없다. 입고/출고 처리를 실제로 반영하는 단계가 되면 그때 <code>POST /api/labels/scan-log</code>{" "}
          같은 쓰기 엔드포인트를 추가할 예정이다.
        </div>
      </section>

      <section>
        <h2>6. API 설계 관점 (스터디 노트)</h2>
        <p className="mb-4 text-sm text-slate-500">
          이 메뉴에서 실제로 만든 것(1~5번)을 바탕으로, 설계 관점을 정리한 학습 노트다. "좋은 설계란"에서
          시작해 이 프로젝트의 도메인 관점, 그리고 실무에서 같이 따라오는 주제들로 이어간다.
        </p>
        <Tabs items={DESIGN_TABS} />
      </section>

      <div className="conclusion">
        <h2>문서 · 테스트</h2>
        <p>
          엔드포인트 스펙은{" "}
          <Link href="/swagger" className="font-semibold text-white underline">
            /swagger
          </Link>
          에서 Swagger UI로, 실제 호출 결과는{" "}
          <Link href="/test" className="font-semibold text-white underline">
            /test
          </Link>
          에서 PDA 스캔 시뮬레이터로 확인할 수 있다.
        </p>
      </div>
    </main>
  );
}
