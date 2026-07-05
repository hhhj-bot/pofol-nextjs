"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react는 브라우저(window) 전용이라 서버 컴포넌트에서 바로 못 쓴다.
// /swagger 페이지(서버 컴포넌트)가 스펙을 만들고, 이 클라이언트 컴포넌트에 내려준다.
function ReactSwagger({ spec }: { spec: object }) {
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
