import { ITEMS } from "./data";
import type { InvItem } from "../components/InventoryTable";

// 재고 스냅샷을 만들어 주는 서버 쪽 함수.
// API Route랑 SSR이 같은 데이터를 쓰도록 한 군데로 모아뒀다.
// API Route는 이걸 JSON으로 내려주고(브라우저에서 도는 CSR이 사용),
// SSR은 자기 API를 HTTP로 부르는 대신 이 함수를 그냥 직접 호출한다.
export type Inventory = { serverTime: string; generatedBy: string; items: InvItem[] };

export function getInventory(): Inventory {
  return {
    serverTime: new Date().toISOString(), // 이 함수가 불린 시점의 서버 시각
    generatedBy: "server data source (getInventory)",
    items: ITEMS,
  };
}
