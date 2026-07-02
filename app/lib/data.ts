import type { InvItem } from "../components/InventoryTable";

// WMS 더미 재고 스냅샷 — API Route와 SSG/ISR 페이지가 공유한다.
export const ITEMS: InvItem[] = [
  { sku: "RAW-1001", name: "폴리프로필렌 수지", qty: 1240, site: "이천", status: "정상" },
  { sku: "RAW-1002", name: "안료 마스터배치", qty: 85, site: "청주", status: "부족" },
  { sku: "WIP-2010", name: "사출 성형품 A", qty: 430, site: "이천", status: "정상" },
  { sku: "FIN-3001", name: "완제품 도어트림", qty: 210, site: "아산", status: "정상" },
  { sku: "FIN-3002", name: "완제품 콘솔", qty: 0, site: "아산", status: "이상" },
];
