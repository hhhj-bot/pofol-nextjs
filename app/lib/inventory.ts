import { ITEMS } from "./data";
import type { InvItem } from "../components/InventoryTable";

// 재고 스냅샷을 만들어 주는 서버 쪽 함수.
// API Route랑 SSR이 같은 데이터를 쓰도록 한 군데로 모아뒀다.
// API Route는 이걸 JSON으로 내려주고(브라우저에서 도는 CSR이 사용),
// SSR은 자기 API를 HTTP로 부르는 대신 이 함수를 그냥 직접 호출한다.
// API 응답용: 재고 항목 + 파생 총중량(kg)
export type InvItemOut = InvItem & { totalWeightKg: number };
export type Inventory = { serverTime: string; generatedBy: string; items: InvItemOut[] };

// 단위중량 x 수량 = 총중량(kg). 소수 1자리 반올림.
function withWeight(it: InvItem): InvItemOut {
  return { ...it, totalWeightKg: Math.round(it.qty * it.unitWeightKg * 10) / 10 };
}

export function getInventory(): Inventory {
  return {
    serverTime: new Date().toISOString(), // 이 함수가 불린 시점의 서버 시각
    generatedBy: "server data source (getInventory)",
    items: ITEMS.map(withWeight), // 로케이션 + 단위중량 + 총중량 포함
  };
}

// SKU 단건 조회 — PDA가 품목 바코드를 스캔했을 때 쓰는 조회 함수.
// GET /api/inventory/[sku] 가 이 함수를 그대로 호출한다.
export function getInventoryItem(sku: string): InvItemOut | undefined {
  const it = ITEMS.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
  return it ? withWeight(it) : undefined;
}
