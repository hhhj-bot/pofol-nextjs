import { NextResponse } from "next/server";
import { getInventory } from "../../lib/inventory";

// ── Route Handler = "서버리스 함수" ─────────────────────────────
// 별도 백엔드 없이 이 함수가 서버 역할을 한다. 호출될 때마다 실행되어
// 서버 처리 시각 + WMS 더미 재고 스냅샷을 JSON으로 반환한다.
// (CSR 페이지가 브라우저에서 이 엔드포인트를 호출한다.)
export const dynamic = "force-dynamic"; // 항상 실행(호출 시각을 정확히 보여주기 위함)

export async function GET() {
  return NextResponse.json(getInventory());
}
