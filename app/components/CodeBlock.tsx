"use client";

import { useState } from "react";

// 접었다 펴지는 "코드 보기" 뷰어 — 각 페이지의 실제 데이터패칭 코드를 보여준다.
export function CodeBlock({ code, label = "코드 보기" }: { code: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="codeblock">
      <button
        type="button"
        className="code-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="code-toggle-label">{"</>"} {label}</span>
        <span className={`chev ${open ? "open" : ""}`}>▾</span>
      </button>
      {open && (
        <pre className="code-pre">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
