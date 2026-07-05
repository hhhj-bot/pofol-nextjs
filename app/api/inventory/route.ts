import { NextResponse } from "next/server";
import { getInventory } from "../../lib/inventory";

// 별도 백엔드 없이 이 Route Handler가 서버 역할을 한다(이른바 서버리스 함수).
// 호출될 때마다 실행돼서 서버 시각과 더미 재고를 JSON으로 돌려준다.
// 이 엔드포인트는 CSR 페이지가 브라우저에서 호출한다.
export const dynamic = "force-dynamic"; // 호출 시각을 정확히 보여주려고 매번 실행

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: 재고 목록 조회
 *     description: WMS 더미 재고 스냅샷 전체 목록을 반환한다.
 *     tags:
 *       - Inventory
 *     responses:
 *       200:
 *         description: 재고 목록과 서버 시각
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serverTime:
 *                   type: string
 *                   format: date-time
 *                 generatedBy:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 */
export async function GET() {
  return NextResponse.json(getInventory());
}
