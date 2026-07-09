import { NextResponse } from "next/server";
import { getOutboundOrder } from "../../../lib/outbound";

// 출고 지시 단건 조회 — PDA가 출고 지시 번호를 스캔했을 때 상세.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/outbound/{orderNo}:
 *   get:
 *     summary: 출고 지시 단건 조회
 *     description: 출고 지시 번호로 지시 하나를 조회한다.
 *     tags:
 *       - Outbound
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         schema:
 *           type: string
 *         example: OUT-20260709-01
 *         description: 조회할 출고 지시 번호
 *     responses:
 *       200:
 *         description: 조회된 출고 지시
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OutboundOrder'
 *       404:
 *         description: 해당 출고 지시를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(
  _req: Request,
  { params }: { params: { orderNo: string } }
) {
  const order = getOutboundOrder(params.orderNo);
  if (!order) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `출고 지시 '${params.orderNo}'를 찾을 수 없습니다.` },
      { status: 404 }
    );
  }
  return NextResponse.json(order);
}
