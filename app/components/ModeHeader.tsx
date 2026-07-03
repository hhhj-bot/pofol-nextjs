import Link from "next/link";
import type { ReactNode } from "react";

// 각 렌더링 데모 페이지 맨 위에 들어가는 헤더.
// 뒤로가기, 모드 배지, 제목, 설명, 그리고 확인 팁까지 묶어서 보여준다.
export function ModeHeader({
  badge,
  title,
  desc,
  hint,
}: {
  badge: string;
  title: string;
  desc: ReactNode;
  hint: string;
}) {
  return (
    <>
      <Link href="/" className="back">비교 홈으로</Link>
      <header className="mode-head">
        <span className="mode-badge">{badge}</span>
        <h1>{title}</h1>
        <p>{desc}</p>
        <div className="hint">{hint}</div>
      </header>
    </>
  );
}

// 처리 시각을 보여주는 작은 스탬프 박스. tone="muted"면 회색 톤으로.
export function TimeStamp({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "muted";
}) {
  return (
    <div className={`stamp ${tone === "muted" ? "stamp-muted" : ""}`}>
      <span className="stamp-label">{label}</span>
      <span className="stamp-value">{value}</span>
    </div>
  );
}
