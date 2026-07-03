"use client";

import { useState } from "react";

// 오른쪽 파일 목록에서 하나 고르면 왼쪽에 그 소스를 보여주는 간단한 코드 뷰어.
// 페이지의 데이터패칭 코드뿐 아니라 실제로 쓰는 공유 컴포넌트 소스까지 같이 훑어볼 수 있게 했다.
export type CodeFile = {
  name: string; // 파일 경로나 이름 (목록과 헤더에 표시)
  desc?: string; // 한 줄 설명
  code: string; // 소스 문자열
};

export function CodeExplorer({
  files,
  title = "코드 보기",
}: {
  files: CodeFile[];
  title?: string;
}) {
  const [i, setI] = useState(0);
  const active = files[i] ?? files[0];

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span className="font-mono text-brand-600">{"</>"}</span>
        {title}
        <span className="text-xs font-normal text-slate-400">— 오른쪽에서 파일을 선택하세요</span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_230px]">
        {/* 왼쪽: 고른 파일의 소스 */}
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
              {active.name}
            </span>
            {active.desc && (
              <span className="text-xs text-slate-400">{active.desc}</span>
            )}
          </div>
          <pre className="code-pre m-0 max-h-[540px] overflow-auto">
            <code>{active.code}</code>
          </pre>
        </div>

        {/* 오른쪽: 파일 목록 */}
        <aside className="flex flex-col gap-1.5">
          {files.map((f, idx) => {
            const on = idx === i;
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => setI(idx)}
                aria-pressed={on}
                className={
                  "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors " +
                  (on
                    ? "border-brand-300 bg-brand-50"
                    : "border-slate-200 bg-white hover:bg-slate-50")
                }
              >
                <span
                  className={
                    "font-mono text-[13px] font-semibold " +
                    (on ? "text-brand-700" : "text-slate-700")
                  }
                >
                  {f.name}
                </span>
                {f.desc && (
                  <span className="mt-0.5 text-[11px] leading-snug text-slate-400">
                    {f.desc}
                  </span>
                )}
              </button>
            );
          })}
        </aside>
      </div>
    </section>
  );
}
