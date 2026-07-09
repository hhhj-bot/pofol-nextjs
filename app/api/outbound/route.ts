import { NextResponse } from "next/server";
import { getOutbound } from "../../lib/outbound";

// 출고 지시/이력 목록. Flutter 출고 화면이 호출한다.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/outbound:
 *   get:
 *     summary: 출고 지시 목록 조회
 *     description: 재고(로케이션)에서 피킹해 도착지로 내보내는 출고 지시/이력 목록. Flutter 출고 화면에서 사용한다.
 *     tags:
 *       - Outbound
 *     responses:
 *       200:
 *         description: 출고 지시 목록과 서버 시각
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
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OutboundOrder'
 */
export async function GET() {
  return NextResponse.json(getOutbound());
}
