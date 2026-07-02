"use client";

import { useEffect, useState } from "react";
import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable, type InvItem } from "../components/InventoryTable";
import { CodeBlock } from "../components/CodeBlock";

type Api = { serverTime: string; items: InvItem[] };

const code = `"use client"; // 클라이언트 컴포넌트

export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    // 브라우저가 마운트된 뒤 fetch — 최초 HTML엔 데이터가 없다
    fetch("/api/inventory").then((r) => r.json()).then(setData);
  }, []);
  if (!data) return <p>불러오는 중…</p>;
  return /* 클라이언트에서 받은 데이터 렌더 */;
}`;

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
      <CodeBlock code={code} />
    </main>
  );
}
