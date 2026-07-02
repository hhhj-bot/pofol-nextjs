// 서버 컴포넌트에서 자기 자신의 API Route를 절대 URL로 호출하기 위한 베이스 URL.
// headers()를 쓰지 않아 ISR(정적 재생성)을 깨지 않는다.
//  · 로컬:  http://localhost:3000
//  · Vercel: https://<배포도메인>  (VERCEL_URL 자동 주입)
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
