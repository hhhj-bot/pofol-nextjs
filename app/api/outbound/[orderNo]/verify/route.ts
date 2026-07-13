import { NextResponse } from "next/server";
import { verifyOutbound } from "../../../../lib/outbound";

// 출고 스캔 검증 — PDA가 스캔한 싱글 라벨 목록을 주문과 대조해 출고가능 여부를 판정한다.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/outbound/{orderNo}/verify:
 *   post:
 *     summary: 출고 스캔 검증 (확인완료 → 출고가능)
 *     description: PDA가 스캔한 SINGLE 라벨 목록을 해당 고객사 주문과 대조한다. 주문의 모든 싱글이 스캔되면 status가 "출고가능"이 된다.
 *     tags:
 *       - Outbound
 *     parameters:
 *       - in: path
 *         name: orderNo
 *         required: true
 *         schema:
 *           type: string
 *         example: OUT-20260713-01
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scannedCodes]
 *             properties:
 *               scannedCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["GTL-SGL-0001", "GTL-SGL-0006", "GTL-SGL-0011"]
 *     responses:
 *       200:
 *         description: 검증 결과
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyResult'
 *       400:
 *         description: 요청 형식 오류 (scannedCodes 배열 필요)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 주문을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "JSON 본문을 읽을 수 없습니다." },
      { status: 400 }
    );
  }

  const codes = (body as { scannedCodes?: unknown })?.scannedCodes;
  if (!Array.isArray(codes) || codes.some((c) => typeof c !== "string")) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "scannedCodes는 문자열 배열이어야 합니다." },
      { status: 400 }
    );
  }

  const result = verifyOutbound(params.orderNo, codes as string[]);
  if (!result) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `출고 주문 '${params.orderNo}'를 찾을 수 없습니다.` },
      { status: 404 }
    );
  }
  return NextResponse.json(result);
}
