import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable } from "../components/InventoryTable";
import { CodeBlock } from "../components/CodeBlock";
import { ITEMS } from "../lib/data";

// ISR — 정적 페이지지만 "최대 20초마다" 백그라운드에서 다시 생성된다.
export const revalidate = 20;

const code = `// app/isr/page.tsx — 증분 정적 재생성(ISR)
export const revalidate = 20; // 최대 20초마다 백그라운드 재생성

export default function Page() {
  // 정적처럼 캐시된 HTML을 주되, 20초가 지나면 다음 요청 때 새로 만든다.
  const generatedAt = new Date().toISOString(); // 재생성될 때마다 갱신
  return <InventoryTable items={ITEMS} />;
}`;

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
        <TimeStamp label="정적 생성 시각 (≤20초마다 갱신)" value={generatedAt} />
      </div>
      <section>
        <h2>재고 스냅샷 · 20초 주기 재생성</h2>
        <InventoryTable items={ITEMS} />
      </section>
      <CodeBlock code={code} />
    </main>
  );
}
