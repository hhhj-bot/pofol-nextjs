import { NextResponse } from "next/server";
import { getVehicles } from "../../lib/vehicles";

// 운송 차량 현황 — 업무기획 관제화면과 Flutter 운송 화면이 호출한다.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: 운송 차량 현황 조회
 *     description: 배차된 차량의 상태(대기/상차중/운행중/도착), 목적지, 적재중량, 연결된 출고 주문을 반환한다.
 *     tags:
 *       - Vehicles
 *     responses:
 *       200:
 *         description: 차량 목록과 서버 시각
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
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 */
export async function GET() {
  return NextResponse.json(getVehicles());
}
