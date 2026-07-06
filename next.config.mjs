/** @type {import('next').NextConfig} */
const nextConfig = {
  // 최소 설정 — 기본값만 사용
  reactStrictMode: true,
  // outputFileTracingIncludes(/swagger에 app/api/**/*.ts 강제 포함)는 제거함.
  // OpenAPI 스펙을 빌드 타임 스크립트(scripts/generate-openapi.mjs)로 옮기면서
  // /swagger 라우트가 더 이상 next-swagger-doc/swagger-jsdoc을 런타임에 참조하지
  // 않으므로 트레이싱 강제 포함이 필요 없어졌다.
};

export default nextConfig;
