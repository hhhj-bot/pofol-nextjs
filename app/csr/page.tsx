"use client";

import { useEffect, useState } from "react";
import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable, type InvItem } from "../components/InventoryTable";
import { CodeExplorer, type CodeFile } from "../components/CodeExplorer";
import {
  SNIPPET_API_ROUTE,
  SNIPPET_INVENTORY_TABLE,
  SNIPPET_TIMESTAMP,
} from "../lib/snippets";

type Api = { serverTime: string; items: InvItem[] };

const pageCode = `// app/csr/page.tsx
"use client"; // ① 클라이언트 컴포넌트

export default function Page() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // ② 브라우저가 마운트된 뒤 fetch — 최초 HTML엔 데이터가 없다
    fetch("/api/inventory").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p>불러오는 중…</p>; // ③ 도착 전 로딩 표시

  return (
    <main>
      {/* ④ 클라이언트가 받은 data를 렌더 → 페이지 소스(Ctrl+U)엔 이 값이 없음 */}
      <TimeStamp label="API 서버 시각" value={data.serverTime} />
      <InventoryTable items={data.items} />
    </main>
  );
}`;

const FILES: CodeFile[] = [
  { name: "app/csr/page.tsx", desc: "CSR 데이터패칭 (이 화면)", code: pageCode },
  { name: "app/api/inventory/route.ts", desc: "브라우저가 부르는 서버리스 함수", code: SNIPPET_API_ROUTE },
  { name: "components/InventoryTable.tsx", desc: "데이터를 그리는 표", code: SNIPPET_INVENTORY_TABLE },
  { name: "components/TimeStamp.tsx", desc: "시각 스탬프 박스", code: SNIPPET_TIMESTAMP },
];

export default function Page() {
  const [data, setData] = useState<Api | null>(null);
  const [fetchedAt, setFetchedAt] = useState("");

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((d: Api) => {
        setData(d);
        setFetchedAt(new Date().toISOString());
      });
  }, []);

  return (
    <main className="container">
      <ModeHeader
        badge="CSR · 클라이언트 렌더링"
        title="Client-Side Rendering"
        desc={<>최초 HTML은 비어 있고, 브라우저가 마운트된 뒤 데이터를 불러옵니다. <strong>페이지 소스에는 표 데이터가 없습니다.</strong></>}
        hint="처음에 '불러오는 중…'이 잠깐 보입니다. 페이지 소스 보기(Ctrl+U)엔 표 데이터가 없습니다."
      />
      {!data ? (
        <div className="card">불러오는 중…</div>
      ) : (
        <>
          <div className="stamp-row">
            <TimeStamp label="API 서버 시각" value={data.serverTime} />
            <TimeStamp label="클라이언트 수신 시각" value={fetchedAt} tone="muted" />
          </div>
          <section>
            <h2>재고 스냅샷 · 브라우저에서 로드</h2>
            <InventoryTable items={data.items} />
          </section>
        </>
      )}
      <CodeExplorer files={FILES} />
    </main>
  );
}
