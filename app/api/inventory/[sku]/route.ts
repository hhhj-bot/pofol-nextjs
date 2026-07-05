import { NextResponse } from "next/server";
import { getInventoryItem } from "../../../lib/inventory";

// SKU 단건 조회 — PDA가 품목 바코드를 스캔했을 때 상세를 보여주는 용도.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/inventory/{sku}:
 *   get:
 *     summary: 재고 단건 조회
 *     description: SKU로 재고 항목 하나를 조회한다. PDA가 품목 바코드를 스캔했을 때 상세 정보를 보여주는 용도.
 *     tags:
 *       - Inventory
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *         example: FIN-3001
 *         description: 조회할 품목 SKU
 *     responses:
 *       200:
 *         description: 조회된 재고 항목
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: 해당 SKU를 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET(
  _req: Request,
  { params }: { params: { sku: string } }
) {
  const item = getInventoryItem(params.sku);
  if (!item) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: `SKU '${params.sku}' 재고를 찾을 수 없습니다.` },
      { status: 404 }
    );
  }
  return NextResponse.json(item);
}
