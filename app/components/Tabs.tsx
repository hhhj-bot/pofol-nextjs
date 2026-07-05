"use client";

import { useState, type ReactNode } from "react";

// 범용 탭 컴포넌트. 서버 컴포넌트(예: /rest-api 페이지)가 각 탭의 내용을
// 미리 렌더링해서 props로 넘기고, 여기서는 어떤 탭을 보여줄지만 클라이언트 상태로 다룬다.
export type TabItem = {
  id: string;
  label: string;
  content: ReactNode;
};

export function Tabs({ items }: { items: TabItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);
  const active = items.find((it) => it.id === activeId) ?? items[0];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3">
        {items.map((it) => {
          const isActive = it.id === active?.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => setActiveId(it.id)}
              className={
                isActive
                  ? "rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft"
                  : "rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600"
              }
            >
              {it.label}
            </button>
          );
        })}
      </div>
      <div className="mt-5">{active?.content}</div>
    </div>
  );
}
