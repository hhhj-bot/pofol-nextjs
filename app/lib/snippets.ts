// 코드 탐색기(CodeExplorer)에서 보여줄 "실제 공유 소스" 문자열 모음.
// 각 모드 페이지가 이 스니펫들을 골라 목록으로 노출한다 →
// InventoryTable / TimeStamp가 이름만 나오지 않고 실제 형태까지 보이게 한다.

// 재고 표 컴포넌트 — 모든 모드 페이지가 이 컴포넌트로 데이터를 렌더한다.
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

// 시각 스탬프 — 각 모드가 "언제 렌더/수신됐는지"를 보여주는 작은 박스.
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

// 서버리스 함수(Route Handler) — SSR/CSR이 호출하는 실제 API 엔드포인트.
export const SNIPPET_API_ROUTE = `// app/api/inventory/route.ts — "서버리스 함수"
import { NextResponse } from "next/server";
import { ITEMS } from "../../lib/data";

export const dynamic = "force-dynamic"; // 호출 시각을 정확히 보여주려 항상 실행

export async function GET() {
  return NextResponse.json({
    serverTime: new Date().toISOString(), // 이 함수가 실행된 서버 시각
    generatedBy: "Route Handler (serverless function)",
    items: ITEMS,
  });
}`;

// 더미 재고 데이터 — SSG/ISR과 API Route가 공유한다.
export const SNIPPET_DATA = `// app/lib/data.ts — WMS 더미 재고 스냅샷
import type { InvItem } from "../components/InventoryTable";

export const ITEMS: InvItem[] = [
  { sku: "RAW-1001", name: "폴리프로필렌 수지", qty: 1240, site: "이천", status: "정상" },
  { sku: "RAW-1002", name: "안료 마스터배치", qty: 85, site: "청주", status: "부족" },
  { sku: "WIP-2010", name: "사출 성형품 A", qty: 430, site: "이천", status: "정상" },
  { sku: "FIN-3001", name: "완제품 도어트림", qty: 210, site: "아산", status: "정상" },
  { sku: "FIN-3002", name: "완제품 콘솔", qty: 0, site: "아산", status: "이상" },
];`;

// SSR이 자기 API를 절대 URL로 호출하기 위한 베이스 URL 헬퍼.
export const SNIPPET_BASE = `// app/lib/base.ts — 서버가 자기 API Route를 부를 때의 베이스 URL
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return \`https://\${process.env.VERCEL_URL}\`;
  return "http://localhost:3000";
}`;
