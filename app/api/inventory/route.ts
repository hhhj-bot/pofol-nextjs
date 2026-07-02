import { NextResponse } from "next/server";
import { ITEMS } from "../../lib/data";

// ── Route Handler = "서버리스 함수" ─────────────────────────────
// 별도 백엔드 없이 이 함수가 서버 역할을 한다.
// 호출될 때마다 실행되어 (1) 서버 처리 시각과 (2) WMS 더미 재고 스냅샷을 반환.
// SSR/CSR 페이지가 이 엔드포인트를 각기 다른 방식으로 소비한다.
export const dynamic = "force-dynamic"; // 항상 실행(호출 시각을 정확히 보여주기 위함)

export async function GET() {
  return NextResponse.json({
    serverTime: new Date().toISOString(), // 이 함수가 실행된 서버 시각
    generatedBy: "Route Handler (serverless function)",
    items: ITEMS,
  });
}
