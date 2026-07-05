import { NextResponse, type NextRequest } from "next/server";

// 이 API는 추후 Flutter PDA 앱, 그리고 별도로 배포되는 다른 Vercel 프런트에서
// 크로스 오리진으로 호출될 예정이라 /api/* 전역에 CORS를 허용한다.
// 라우트 핸들러마다 헤더를 반복하지 않도록 미들웨어 한 곳에서 처리한다.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(req: NextRequest) {
  // 브라우저(Flutter web)나 일부 클라이언트가 보내는 프리플라이트 요청은
  // 라우트 핸들러까지 가지 않고 여기서 바로 응답한다.
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const res = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
