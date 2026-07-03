import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable } from "../components/InventoryTable";
import { CodeExplorer, type CodeFile } from "../components/CodeExplorer";
import { ITEMS } from "../lib/data";
import {
  SNIPPET_DATA,
  SNIPPET_INVENTORY_TABLE,
  SNIPPET_TIMESTAMP,
} from "../lib/snippets";

// ISR — 정적 페이지인데 최대 20초마다 백그라운드에서 다시 만들어진다.
export const revalidate = 20;

const pageCode = `// app/isr/page.tsx — 증분 정적 재생성(ISR)

// 이 HTML은 최대 20초까지 재사용하고, 그 뒤 요청이 오면 다시 만든다.
export const revalidate = 20;

export default function Page() {
  // 이 줄은 페이지가 (재)생성되는 순간에만 실행된다.
  // revalidate 주기로 다시 만들어질 때마다 새 값이 찍혀 HTML에 박제된다.
  // 덕분에 20초 안에는 어떤 요청이 와도 같은 generatedAt을 받는다.
  const generatedAt = new Date().toISOString();

  return (
    <main>
      {/* 박제된 generatedAt을 그대로 노출해서 재생성 여부를 눈으로 본다. */}
      {/* revalidate는 언제 갱신할지, generatedAt은 실제 갱신된 시각을 뜻한다. */}
      <TimeStamp label="정적 생성 시각 (최대 20초마다 갱신)" value={generatedAt} />

      {/* ITEMS는 고정이라 표는 그대로고, 타임스탬프만 주기적으로 바뀐다. */}
      <InventoryTable items={ITEMS} />
    </main>
  );
}`;

const FILES: CodeFile[] = [
  { name: "app/isr/page.tsx", desc: "증분 정적 재생성 (이 화면)", code: pageCode },
  { name: "app/lib/data.ts", desc: "재생성 때 다시 박제되는 데이터", code: SNIPPET_DATA },
  { name: "components/InventoryTable.tsx", desc: "데이터를 그리는 표", code: SNIPPET_INVENTORY_TABLE },
  { name: "components/TimeStamp.tsx", desc: "시각 스탬프 박스", code: SNIPPET_TIMESTAMP },
];

export default function Page() {
  const generatedAt = new Date().toISOString();
  return (
    <main className="container">
      <ModeHeader
        badge="ISR · 증분 정적 재생성"
        title="Incremental Static Regeneration"
        desc={<>정적 페이지의 속도를 유지하면서 <strong>일정 주기(여기선 20초)</strong>로 내용을 갱신합니다. 정적과 서버렌더의 절충안입니다.</>}
        hint="20초 안에는 '생성 시각'이 같습니다. 20초가 지난 뒤 새로고침하면 값이 갱신됩니다."
      />
      <div className="stamp-row">
        <TimeStamp label="정적 생성 시각 (최대 20초마다 갱신)" value={generatedAt} />
      </div>
      <section>
        <h2>재고 스냅샷 · 20초 주기 재생성</h2>
        <InventoryTable items={ITEMS} />
      </section>
      <CodeExplorer files={FILES} />
    </main>
  );
}
