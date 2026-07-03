import { ModeHeader, TimeStamp } from "../components/ModeHeader";
import { InventoryTable } from "../components/InventoryTable";
import { CodeExplorer, type CodeFile } from "../components/CodeExplorer";
import { ITEMS } from "../lib/data";
import {
  SNIPPET_DATA,
  SNIPPET_INVENTORY_TABLE,
  SNIPPET_TIMESTAMP,
} from "../lib/snippets";

// 동적 함수(no-store fetch나 headers 같은 것)를 안 쓰니까 이 페이지는
// 빌드 때 딱 한 번 렌더돼서 정적 HTML로 굳는다(SSG).
const buildTime = new Date().toISOString(); // 모듈이 평가되는 빌드 시점에 한 번만 찍힘

const pageCode = `// app/ssg/page.tsx — 아무 설정도 안 하면 기본이 정적 생성(SSG)

// 동적 함수를 안 쓰면 빌드 때 한 번만 렌더돼서 HTML로 굳는다.
// 그래서 다시 배포(빌드)하기 전까진 이 값이 안 바뀐다.
const buildTime = new Date().toISOString();

export default function Page() {
  return (
    <main>
      {/* 빌드 때 찍힌 buildTime이 HTML에 그대로 박혀 나간다 */}
      <TimeStamp label="빌드 시각 (고정)" value={buildTime} />

      {/* ITEMS도 빌드 시점 값 그대로 박제돼 배포된다 */}
      <InventoryTable items={ITEMS} />
    </main>
  );
}`;

const FILES: CodeFile[] = [
  { name: "app/ssg/page.tsx", desc: "정적 생성 (이 화면)", code: pageCode },
  { name: "app/lib/data.ts", desc: "빌드 때 박제되는 재고 데이터", code: SNIPPET_DATA },
  { name: "components/InventoryTable.tsx", desc: "데이터를 그리는 표", code: SNIPPET_INVENTORY_TABLE },
  { name: "components/TimeStamp.tsx", desc: "시각 스탬프 박스", code: SNIPPET_TIMESTAMP },
];

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
      <CodeExplorer files={FILES} />
    </main>
  );
}
