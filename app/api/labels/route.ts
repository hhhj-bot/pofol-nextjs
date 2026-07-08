import { NextResponse } from "next/server";
import { LABELS } from "../../lib/labels";

// 창고 PDA 스캔 시뮬레이션용 GTL(마스터/싱글) 라벨 목록.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/labels:
 *   get:
 *     summary: GTL 라벨 목록 조회
 *     description: 창고 PDA 스캔 시뮬레이션용 GTL(마스터/싱글) 라벨 목록. Flutter PDA 앱에서 테스트용 스캔 코드 목록으로 사용한다.
 *     tags:
 *       - Labels
 *     responses:
 *       200:
 *         description: 라벨 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LabelRecord'
 */
export async function GET() {
  // CORS는 middleware.ts 에서 /api/* 전역으로 처리한다(여기선 데이터만 반환).
  return NextResponse.json(LABELS);
}
