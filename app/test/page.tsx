"use client";

import { useState } from "react";
import Link from "next/link";
import { ITEMS } from "../lib/data";
import { LABELS } from "../lib/labels";

// /test — 창고 PDA가 바코드를 스캔하는 상황을 흉내내는 시뮬레이터.
// 버튼을 누르면 실제로 GET /api/hello, /api/inventory/{sku}, /api/labels/{code}를 호출한다.
type ScanKind = "hello" | "inventory" | "label";

type ScanResult = {
  url: string;
  status: number;
  ms: number;
  body: unknown;
};

function buildUrl(kind: ScanKind, code: string): string {
  if (kind === "hello") return "/api/hello";
  if (kind === "inventory") return `/api/inventory/${encodeURIComponent(code)}`;
  return `/api/labels/${encodeURIComponent(code)}`;
}

async function callApi(kind: ScanKind, code: string): Promise<ScanResult> {
  const url = buildUrl(kind, code);
  const startedAt = performance.now();
  const res = await fetch(url);
  const ms = Math.round(performance.now() - startedAt);
  const body = await res.json();
  return { url, status: res.status, ms, body };
}

export default function TestPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualKind, setManualKind] = useState<ScanKind>("label");

  async function handleScan(kind: ScanKind, code: string) {
    setLoading(true);
    try {
      const r = await callApi(kind, code);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <Link href="/" className="back">비교 홈으로</Link>
      <header className="mode-head">
        <span className="mode-badge">PDA 스캔 시뮬레이터</span>
        <h1>GTL 라벨 · 재고 스캔 테스트</h1>
        <p>
          아래 버튼은 실제 창고 PDA가 바코드를 스캔했을 때처럼{" "}
          <code className="font-mono">GET /api/inventory/{"{sku}"}</code>,{" "}
          <code className="font-mono">GET /api/labels/{"{code}"}</code>를 그대로 호출한다.
        </p>
        <div className="hint">
          존재하지 않는 코드를 스캔하면 404 응답을 그대로 보여준다 — Flutter PDA 앱이 처리할 에러 형태를
          미리 확인할 수 있다.
        </div>
      </header>

      <section>
        <h2>0. Hello World (가장 단순한 예시)</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleScan("hello", "")}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-sm text-brand-700 shadow-soft transition-colors hover:bg-brand-50"
          >
            GET /api/hello
          </button>
        </div>
      </section>

      <section>
        <h2>1. SKU 스캔 (품목 바코드)</h2>
        <div className="flex flex-wrap gap-2">
          {ITEMS.map((it) => (
            <button
              key={it.sku}
              onClick={() => handleScan("inventory", it.sku)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-sm text-brand-700 shadow-soft transition-colors hover:bg-brand-50"
            >
              {it.sku}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>2. GTL 라벨 스캔</h2>
        <div className="flex flex-wrap gap-2">
          {LABELS.map((l) => (
            <button
              key={l.labelCode}
              onClick={() => handleScan("label", l.labelCode)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-sm text-brand-700 shadow-soft transition-colors hover:bg-brand-50"
            >
              <span className={l.labelType === "MASTER" ? "badge badge-next mr-2" : "badge badge-vite mr-2"}>
                {l.labelType}
              </span>
              {l.labelCode}
            </button>
          ))}
          <button
            onClick={() => handleScan("label", "GTL-NOT-EXIST")}
            className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 font-mono text-sm text-rose-600 shadow-soft transition-colors hover:bg-rose-50"
          >
            존재하지 않는 코드 (404 테스트)
          </button>
        </div>
      </section>

      <section>
        <h2>3. 직접 입력</h2>
        <div className="card flex flex-wrap items-center gap-2">
          <select
            value={manualKind}
            onChange={(e) => setManualKind(e.target.value as ScanKind)}
            className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm"
          >
            <option value="label">라벨 코드</option>
            <option value="inventory">SKU</option>
          </select>
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder={manualKind === "label" ? "예: GTL-SGL-0003" : "예: RAW-1002"}
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
          />
          <button
            onClick={() => manualCode.trim() && handleScan(manualKind, manualCode.trim())}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            스캔
          </button>
        </div>
      </section>

      <section>
        <h2>4. 응답</h2>
        {loading && <div className="card">스캔 중…</div>}
        {!loading && !result && <div className="card dim">위 버튼을 눌러 스캔을 시작하라.</div>}
        {!loading && result && (
          <div className="card">
            <div className="stamp-row" style={{ marginTop: 0 }}>
              <div className="stamp">
                <span className="stamp-label">호출 URL</span>
                <span className="stamp-value" style={{ fontSize: 13 }}>{result.url}</span>
              </div>
              <div className={result.status < 300 ? "stamp" : "stamp stamp-muted"}>
                <span className="stamp-label">HTTP 상태</span>
                <span className="stamp-value">{result.status}</span>
              </div>
              <div className="stamp stamp-muted">
                <span className="stamp-label">응답 시간</span>
                <span className="stamp-value">{result.ms}ms</span>
              </div>
            </div>
            <pre className="code-pre mt-4">
              <code>{JSON.stringify(result.body, null, 2)}</code>
            </pre>
          </div>
        )}
      </section>
    </main>
  );
}
