import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable } from "../components/InventoryTable";
import { CodeBlock } from "../components/CodeBlock";
import { ITEMS } from "../lib/data";

// 동적 함수(fetch no-store / headers 등)를 쓰지 않으므로 이 페이지는
// "빌드 시 1회" 렌더되어 정적 HTML로 고정된다(SSG).
const buildTime = new Date().toISOString(); // 모듈 평가 = 빌드 시점에 단 한 번

const code = `// app/ssg/page.tsx — 별도 설정 없음 = 정적 생성(SSG)
// 동적 함수를 쓰지 않으면 빌드 때 딱 1번 렌더되어 HTML로 고정된다.
// 배포 후에는 "다시 빌드"하기 전까지 값이 변하지 않는다.
const buildTime = new Date().toISOString(); // 빌드 시점에 한 번만 실행

export default function Page() {
  // ITEMS도 빌드 시점 값이 그대로 HTML에 박혀 배포된다
  return <InventoryTable items={ITEMS} />;
}`;

export default function Page() {
  return (
    <main className="container">
      <ModeHeader
        badge="SSG · 정적 생성"
        title="Static Site Generation"
        desc={<>빌드 시점에 HTML을 미리 만들어 두는 방식. <strong>가장 빠르고 저렴</strong>하지만 데이터는 빌드 때로 고정됩니다.</>}
        hint="새로고침해도 '빌드 시각'이 바뀌지 않습니다. 다시 배포(빌드)해야만 갱신됩니다."
      />
      <div className="stamp-row">
        <TimeStamp label="빌드 시각 (고정)" value={buildTime} />
      </div>
      <section>
        <h2>재고 스냅샷 · 빌드 시점 데이터</h2>
        <InventoryTable items={ITEMS} />
      </section>
      <CodeBlock code={code} />
    </main>
  );
}
