import Link from "next/link";
import ReactSwagger from "../components/ReactSwagger";

// /swagger — route.ts들의 @swagger JSDoc 주석에서 만든 OpenAPI 스펙을 SwaggerUI로 렌더링.
// 스펙은 빌드 타임에 scripts/generate-openapi.mjs가 public/openapi.json으로 미리 만들어두고,
// 여기서는 그 정적 파일 경로만 클라이언트 컴포넌트에 넘긴다(서버리스 함수 용량 문제 회피).
export default function SwaggerPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-12">
      <Link href="/" className="back">비교 홈으로</Link>
      <header className="mode-head">
        <span className="mode-badge">Swagger · OpenAPI</span>
        <h1>창고 PDA API 문서</h1>
        <p>
          <code className="font-mono">app/api/**/*.ts</code>의 JSDoc(<code>@swagger</code>) 주석에서 자동
          생성된 스펙이다. 코드와 문서가 같은 파일에 있어 엔드포인트를 추가·수정할 때 문서가 어긋날 일이 없다.
        </p>
        <div className="hint">
          아래에서 각 엔드포인트를 펼쳐 "Try it out"으로 직접 호출해볼 수 있다. 실제 요청/응답을 눈으로 보려면{" "}
          <Link href="/test" className="font-semibold text-brand-600 underline">테스트 페이지</Link>도 참고.
        </div>
      </header>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <ReactSwagger url="/openapi.json" />
      </div>
    </main>
  );
}
