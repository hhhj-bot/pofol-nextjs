import { NextResponse } from "next/server";
import { findLabel } from "../../../lib/labels";
import { getInventoryItem } from "../../../lib/inventory";

// GTL 라벨 스캔 시뮬레이션 — PDA가 바코드를 읽었을 때 호출하는 엔드포인트.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/labels/{code}:
 *   get:
 *     summary: GTL 라벨 스캔(단건 조회)
 *     description: PDA가 GTL 마스터/싱글 라벨 바코드를 스캔했을 때 호출하는 엔드포인트. 라벨 정보와 매칭된 재고 항목을 함께 반환한다.
 *     tags:
 *       - Labels
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: GTL-MSTR-0001
 *         description: 스캔된 라벨 바코드 값
 *     responses:
 *       200:
 *         description: 라벨 상세 + 매칭 재고
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 label:
 *                   $ref: '#/components/schemas/LabelRecord'
 *                 item:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: 라벨을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const label = findLabel(params.code);
  if (!label) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `라벨 코드 '${params.code}'를 찾을 수 없습니다.` },
      { status: 404 }
    );
  }
  const item = getInventoryItem(label.sku) ?? null;
  return NextResponse.json({ label, item });
}
