import { NextResponse } from "next/server";
import { getInventory } from "../../lib/inventory";

// 별도 백엔드 없이 이 Route Handler가 서버 역할을 한다(이른바 서버리스 함수).
// 호출될 때마다 실행돼서 서버 시각과 더미 재고를 JSON으로 돌려준다.
// 이 엔드포인트는 CSR 페이지가 브라우저에서 호출한다.
export const dynamic = "force-dynamic"; // 호출 시각을 정확히 보여주려고 매번 실행

export async function GET() {
  return NextResponse.json(getInventory());
}
