"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react는 브라우저(window) 전용이라 서버에서 렌더하면 빌드가 깨진다.
// next/dynamic + ssr:false로 클라이언트에서만 로드해 서버 프리렌더를 피한다.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

// /swagger 페이지(서버 컴포넌트)가 스펙을 만들고, 이 클라이언트 컴포넌트에 내려준다.
function ReactSwagger({ spec }: { spec: object }) {
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
