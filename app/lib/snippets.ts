// 코드 뷰어에서 보여줄 실제 소스 문자열들을 모아둔 곳.
// 각 모드 페이지가 이 중 필요한 걸 골라 오른쪽 목록에 띄운다.
// InventoryTable이나 TimeStamp가 이름만 나오고 끝나지 않게,
// 실제 코드까지 눈으로 확인할 수 있도록 여기 담아뒀다.

// 모든 모드 페이지가 데이터를 그릴 때 쓰는 재고 표 컴포넌트.
export const SNIPPET_INVENTORY_TABLE = `// app/components/InventoryTable.tsx
export type InvItem = {
  sku: string; name: string; qty: number; site: string; status: string;
};

function statusClass(s: string) {
  if (s === "정상") return "st st-ok";
  if (s === "부족") return "st st-warn";
  return "st st-bad"; // 이상
}

export function InventoryTable({ items }: { items: InvItem[] }) {
  return (
    <table>
      <thead>
        <tr><th>SKU</th><th>품목</th><th>수량</th><th>거점</th><th>상태</th></tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.sku}>
            <td>{it.sku}</td>
            <td>{it.name}</td>
            <td>{it.qty.toLocaleString()}</td>
            <td className="dim">{it.site}</td>
            <td><span className={statusClass(it.status)}>{it.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`;

// 렌더/수신 시각을 보여주는 작은 박스. 각 모드의 차이를 눈으로 보게 해준다.
export const SNIPPET_TIMESTAMP = `// app/components/ModeHeader.tsx (일부)
export function TimeStamp({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "muted";
}) {
  return (
    <div className={\`stamp \${tone === "muted" ? "stamp-muted" : ""}\`}>
      <span className="stamp-label">{label}</span>
      <span className="stamp-value">{value}</span>
    </div>
  );
}`;

// 재고 데이터를 만드는 서버 쪽 함수. API Route와 SSR이 같이 쓴다.
export const SNIPPET_INVENTORY = `// app/lib/inventory.ts — API Route와 SSR이 공유하는 데이터 소스
import { ITEMS } from "./data";

export function getInventory() {
  return {
    serverTime: new Date().toISOString(), // 불린 시점의 서버 시각
    generatedBy: "server data source (getInventory)",
    items: ITEMS,
  };
}`;

// CSR이 브라우저에서 호출하는 API 엔드포인트(서버리스 함수).
export const SNIPPET_API_ROUTE = `// app/api/inventory/route.ts — 서버리스 함수
import { NextResponse } from "next/server";
import { getInventory } from "../../lib/inventory";

export const dynamic = "force-dynamic"; // 호출 시각을 보여주려고 매번 실행

export async function GET() {
  // 같은 데이터 소스를 JSON으로 내려준다. 이걸 CSR이 브라우저에서 fetch 한다.
  return NextResponse.json(getInventory());
}`;

// SSG와 ISR, 그리고 데이터 소스가 함께 참조하는 더미 재고.
export const SNIPPET_DATA = `// app/lib/data.ts — WMS 더미 재고 스냅샷
import type { InvItem } from "../components/InventoryTable";

export const ITEMS: InvItem[] = [
  { sku: "RAW-1001", name: "폴리프로필렌 수지", qty: 1240, site: "이천", status: "정상" },
  { sku: "RAW-1002", name: "안료 마스터배치", qty: 85, site: "청주", status: "부족" },
  { sku: "WIP-2010", name: "사출 성형품 A", qty: 430, site: "이천", status: "정상" },
  { sku: "FIN-3001", name: "완제품 도어트림", qty: 210, site: "아산", status: "정상" },
  { sku: "FIN-3002", name: "완제품 콘솔", qty: 0, site: "아산", status: "이상" },
];`;
