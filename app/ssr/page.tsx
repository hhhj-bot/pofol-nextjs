import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable, type InvItem } from "../components/InventoryTable";
import { CodeExplorer, type CodeFile } from "../components/CodeExplorer";
import { getBaseUrl } from "../lib/base";
import { ITEMS } from "../lib/data";
import {
  SNIPPET_API_ROUTE,
  SNIPPET_BASE,
  SNIPPET_INVENTORY_TABLE,
  SNIPPET_TIMESTAMP,
} from "../lib/snippets";

// SSR — 요청이 올 때마다 서버에서 렌더한다(정적 캐시 안 함).
export const dynamic = "force-dynamic";

type Api = { serverTime: string; items: InvItem[] };

async function getData(): Promise<Api> {
  // 서버리스 함수(/api/inventory)를 매 요청마다 호출 · 캐시 안 함.
  // 단, Vercel 배포 보호 등으로 "자기 자신 API 호출"이 실패할 수 있어 폴백을 둔다.
  try {
    const res = await fetch(`${getBaseUrl()}/api/inventory`, { cache: "no-store" });
    if (!res.ok) throw new Error(`inventory API responded ${res.status}`);
    return res.json();
  } catch {
    // 자기호출 실패 환경에서도 화면이 죽지 않도록 로컬 데이터로 렌더 (force-dynamic이라 시각은 매 요청 최신)
    return { serverTime: new Date().toISOString(), items: ITEMS };
  }
}

const pageCode = `// app/ssr/page.tsx
export const dynamic = "force-dynamic"; // ① 요청마다 서버에서 렌더(SSR)

async function getData() {
  try {
    // ② 매 요청마다 서버리스 함수 호출 · 캐시 안 함 → 항상 최신
    const res = await fetch(\`\${getBaseUrl()}/api/inventory\`, { cache: "no-store" });
    if (!res.ok) throw new Error("api " + res.status);
    return res.json();
  } catch {
    // ③ 자기호출이 막히는 환경(예: Vercel 배포 보호)에서도 안 죽도록 폴백
    return { serverTime: new Date().toISOString(), items: ITEMS };
  }
}

export default async function Page() {
  const data = await getData();                // 서버에서 데이터 확보
  const renderTime = new Date().toISOString();  // 요청 시점의 렌더 시각

  return (
    <main>
      {/* 서버가 채운 값을 그대로 HTML에 담아 응답 → 소스보기에도 데이터가 있음 */}
      <TimeStamp label="API 서버 시각" value={data.serverTime} />
      <TimeStamp label="페이지 렌더 시각" value={renderTime} />
      <InventoryTable items={data.items} />
    </main>
  );
}`;

const FILES: CodeFile[] = [
  { name: "app/ssr/page.tsx", desc: "SSR 데이터패칭 (이 화면)", code: pageCode },
  { name: "app/api/inventory/route.ts", desc: "매 요청 호출되는 서버리스 함수", code: SNIPPET_API_ROUTE },
  { name: "app/lib/base.ts", desc: "서버→자기 API 절대 URL", code: SNIPPET_BASE },
  { name: "components/InventoryTable.tsx", desc: "데이터를 그리는 표", code: SNIPPET_INVENTORY_TABLE },
  { name: "components/TimeStamp.tsx", desc: "시각 스탬프 박스", code: SNIPPET_TIMESTAMP },
];

export default async function Page() {
  const data = await getData();
  const renderTime = new Date().toISOString();
  return (
    <main className="container">
      <ModeHeader
        badge="SSR · 서버 렌더링"
        title="Server-Side Rendering"
        desc={<>요청마다 서버가 API를 호출해 데이터를 채운 HTML을 완성합니다. <strong>항상 최신</strong>이지만 매 요청 서버 연산이 듭니다.</>}
        hint="새로고침할 때마다 'API 서버 시각'과 '렌더 시각'이 매번 바뀝니다."
      />
      <div className="stamp-row">
        <TimeStamp label="API 서버 시각" value={data.serverTime} />
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
