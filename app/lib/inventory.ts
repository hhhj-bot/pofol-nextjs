import { ITEMS } from "./data";
import type { InvItem } from "../components/InventoryTable";

// 재고 스냅샷을 만드는 "서버 측 데이터 소스".
// API Route(route.ts)와 SSR 페이지가 이 함수를 공유한다.
//  · API Route  → 이 결과를 JSON으로 반환 (CSR이 브라우저에서 호출)
//  · SSR 페이지 → HTTP 자기호출 대신 이 함수를 직접 호출 (Vercel 자기호출 교착 방지)
export type Inventory = { serverTime: string; generatedBy: string; items: InvItem[] };

export function getInventory(): Inventory {
  return {
    serverTime: new Date().toISOString(), // 호출(렌더) 시점의 서버 시각
    generatedBy: "server data source (getInventory)",
    items: ITEMS,
  };
}
