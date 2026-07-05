import { NextResponse } from "next/server";

// 가장 단순한 예시 엔드포인트. 설계 원칙(리소스 이름, 응답 포맷, 상태 코드 등)을
// 하나씩 쌓아 올리기 전의 출발점으로 남겨둔다 — /rest-api 학습 탭 "좋은 설계란"에서 참조.
export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Hello World
 *     description: 가장 단순한 형태의 GET 엔드포인트. API 설계 원칙을 설명할 때 기준점으로 쓴다.
 *     tags:
 *       - Hello
 *     responses:
 *       200:
 *         description: 인사 메시지
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hello, World!
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
export async function GET() {
  return NextResponse.json({
    message: "Hello, World!",
    timestamp: new Date().toISOString(),
  });
}
