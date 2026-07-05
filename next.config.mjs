/** @type {import('next').NextConfig} */
const nextConfig = {
  // 최소 설정 — 기본값만 사용
  reactStrictMode: true,
  experimental: {
    // next-swagger-doc이 app/api/**/*.ts를 런타임에 glob으로 읽어 스펙을 만든다.
    // Vercel의 output file tracing은 이런 동적 fs 접근을 자동으로 못 잡아내므로
    // /swagger 라우트가 배포 번들에 route.ts들을 포함하도록 명시한다.
    outputFileTracingIncludes: {
      "/swagger": ["./app/api/**/*.ts"],
    },
  },
};

export default nextConfig;
