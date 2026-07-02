import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable, type InvItem } from "../components/InventoryTable";
import { CodeBlock } from "../components/CodeBlock";
import { getBaseUrl } from "../lib/base";

// SSR — 요청이 올 때마다 서버에서 렌더한다(정적 캐시 안 함).
export const dynamic = "force-dynamic";

type Api = { serverTime: string; items: InvItem[] };

async function getData(): Promise<Api> {
  // 서버리스 함수(/api/inventory)를 매 요청마다 호출 · 캐시 안 함
  const res = await fetch(`${getBaseUrl()}/api/inventory`, { cache: "no-store" });
  return res.json();
}

const code = `export const dynamic = "force-dynamic"; // 요청마다 서버에서 렌더(SSR)

async function getData() {
  // 서버리스 함수(/api/inventory)를 매 요청마다 호출 · 캐시 안 함
  const res = await fetch(\`\${getBaseUrl()}/api/inventory\`, { cache: "no-store" });
  return res.json();
}

export default async function Page() {
  const data = await getData();                 // 서버에서 데이터 확보 → HTML 완성
  const renderTime = new Date().toISOString();
  return /* 데이터가 채워진 완성 HTML */;
}`;

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
      <CodeBlock code={code} />
    </main>
  );
}
