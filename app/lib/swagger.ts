// 더 이상 쓰이지 않음(deprecated) — 이 파일을 어디서도 import하지 않는다.
//
// OpenAPI 스펙 생성은 scripts/generate-openapi.mjs로 옮겼다. 이유: next-swagger-doc이
// swagger-jsdoc → swagger-parser → @swagger-api/apidom-*(62MB+)을 끌고 오는데,
// 이 파일처럼 서버 컴포넌트(app/swagger/page.tsx)에서 직접 호출하면 Next.js가 그
// 무거운 의존성 전체를 서버리스 함수 트레이싱에 포함시켜 Vercel의 함수 용량 제한
// (100MB)을 넘겨버렸다(실제로 Vercel deploy에서 "File size limit exceeded" 발생).
//
// 지금은 scripts/generate-openapi.mjs가 빌드/개발 서버 시작 전에(prebuild/predev)
// public/openapi.json을 미리 생성하고, app/swagger/page.tsx는 그 정적 파일 경로만
// SwaggerUI(app/components/ReactSwagger.tsx)에 넘긴다. 그 결과 next-swagger-doc
// 계열 패키지는 devDependencies로만 남고 런타임 번들에는 전혀 포함되지 않는다.
export {};
