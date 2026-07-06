"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react는 브라우저(window) 전용이라 서버에서 렌더하면 빌드가 깨진다.
// next/dynamic + ssr:false로 클라이언트에서만 로드해 서버 프리렌더를 피한다.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

// 스펙은 빌드 타임에 public/openapi.json으로 미리 생성해둔다(scripts/generate-openapi.mjs).
// 여기서 서버가 아니라 브라우저가 그 정적 파일을 fetch하도록 url을 넘긴다 — next-swagger-doc/
// swagger-jsdoc(무거운 @swagger-api/apidom-* 포함, 62MB+)이 서버리스 함수에 트레이싱되는 걸 막기 위함.
function ReactSwagger({ url }: { url: string }) {
  return <SwaggerUI url={url} />;
}

export default ReactSwagger;
