import Link from "next/link";
import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable } from "../components/InventoryTable";
import { CodeExplorer, type CodeFile } from "../components/CodeExplorer";
import { getInventory } from "../lib/inventory";
import {
  SNIPPET_API_ROUTE,
  SNIPPET_INVENTORY,
  SNIPPET_INVENTORY_TABLE,
  SNIPPET_TIMESTAMP,
} from "../lib/snippets";

// SSR — 요청이 올 때마다 서버에서 렌더한다(정적 캐시 안 함).
export const dynamic = "force-dynamic";

/*
 * ⚠️ [Vercel 자기호출 교착으로 사용하지 않음 — 참고용으로 남겨둠]
 *
 * 처음엔 SSR에서 자기 자신의 API Route를 HTTP로 호출했다. 로컬에선 잘 되지만,
 * Vercel에 배포하면 서버리스 함수가 '렌더 도중' 같은 배포의 API를 fetch할 때
 * 인스턴스 동시성 제약으로 응답을 못 받아 hang → timeout → 500 에러가 났다.
 * 그래서 아래 방식을 버리고, 데이터 소스(getInventory)를 직접 호출하도록 바꿨다.
 *
 * import { getBaseUrl } from "../lib/base";
 *
 * async function getData() {
 *   const res = await fetch(`${getBaseUrl()}/api/inventory`, { cache: "no-store" });
 *   return res.json();
 * }
 */

const pageCode = `// app/ssr/page.tsx
export const dynamic = "force-dynamic"; // 요청마다 서버에서 렌더(SSR)

/* ⚠️ [Vercel 자기호출 교착으로 사용 안 함 — 참고용]
   서버 렌더 도중 자기 API를 HTTP로 부르면 인스턴스 동시성 제약으로
   hang → timeout → 500. 로컬에선 되지만 Vercel에선 실패한다.

async function getData() {
  const res = await fetch(\`\${getBaseUrl()}/api/inventory\`, { cache: "no-store" });
  return res.json();
}
*/

export default async function Page() {
  // ✅ 대신 데이터 소스를 서버에서 '직접' 호출 (HTTP 없음 → 교착 없음)
  const data = getInventory();
  const renderTime = new Date().toISOString(); // 요청 시점의 렌더 시각

  return (
    <main>
      {/* 서버가 채운 값을 그대로 HTML에 담아 응답 → 소스보기에도 데이터가 있음 */}
      <TimeStamp label="서버 데이터 시각" value={data.serverTime} />
      <TimeStamp label="페이지 렌더 시각" value={renderTime} />
      <InventoryTable items={data.items} />
    </main>
  );
}`;

const FILES: CodeFile[] = [
  { name: "app/ssr/page.tsx", desc: "SSR 렌더 (이 화면)", code: pageCode },
  { name: "app/lib/inventory.ts", desc: "서버가 직접 부르는 데이터 소스", code: SNIPPET_INVENTORY },
  { name: "app/api/inventory/route.ts", desc: "같은 소스를 JSON으로 (CSR용)", code: SNIPPET_API_ROUTE },
  { name: "components/InventoryTable.tsx", desc: "데이터를 그리는 표", code: SNIPPET_INVENTORY_TABLE },
  { name: "components/TimeStamp.tsx", desc: "시각 스탬프 박스", code: SNIPPET_TIMESTAMP },
];

export default async function Page() {
  const data = getInventory();
  const renderTime = new Date().toISOString();
  return (
    <main className="container">
      <ModeHeader
        badge="SSR · 서버 렌더링"
        title="Server-Side Rendering"
        desc={<>요청마다 서버가 데이터를 조회해 값을 채운 HTML을 완성합니다. <strong>항상 최신</strong>이지만 매 요청 서버 연산이 듭니다.</>}
        hint="새로고침할 때마다 '서버 데이터 시각'과 '렌더 시각'이 매번 바뀝니다."
      />

      {/* 배포 노트 — Vercel 서버리스 자기호출 교착과 그 회피 설계를 명시 */}
      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
        <span className="font-semibold text-brand-700">⚠️ 배포 노트 (Vercel) — </span>
        서버리스 함수가 렌더 도중 <strong>자기 자신의 API를 HTTP로 호출</strong>하면 인스턴스 동시성
        제약으로 응답을 못 받아 <strong>교착(hang → timeout)</strong>되어 500 에러가 납니다. 그래서 이
        SSR 페이지는 HTTP 자기호출 대신{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-[13px] text-brand-700">getInventory()</code>{" "}
        데이터 소스를 <strong>서버에서 직접 호출</strong>합니다. (버려진 자기호출 코드는 코드뷰어에 주석으로
        남겨 두었습니다.) 서버리스 함수 호출 시연은 브라우저에서 부르는{" "}
        <Link href="/csr" className="font-semibold text-brand-600 underline">CSR</Link>이 담당합니다.
      </div>

      <div className="stamp-row">
        <TimeStamp label="서버 데이터 시각" value={data.serverTime} />
        <TimeStamp label="페이지 렌더 시각" value={renderTime} tone="muted" />
      </div>
      <section>
        <h2>재고 스냅샷 · 요청 시점 실시간</h2>
        <InventoryTable items={data.items} />
      </section>
      <CodeExplorer files={FILES} />
    </main>
  );
}
