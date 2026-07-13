import { NextResponse } from "next/server";
import { getInbound } from "../../lib/inbound";

// 입고건 목록 — 업무번호(입고번호)/Invoice 기준. 관제화면과 Flutter 입고 화면이 호출한다.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/inbound:
 *   get:
 *     summary: 입고건 목록 조회
 *     description: 업무번호(입고번호)와 Invoice 기준의 입고건 목록. 마스터/싱글 라벨은 검수 스캔 대상(scanTargets)으로만 연결된다.
 *     tags:
 *       - Inbound
 *     responses:
 *       200:
 *         description: 입고건 목록과 서버 시각
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
 *                 receipts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InboundReceipt'
 */
export async function GET() {
  return NextResponse.json(getInbound());
}
