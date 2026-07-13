"use client";

import { useEffect, useState } from "react";

// 업무리포트 탭 — 같은 데이터를 두 가지 양식으로 낸다.
//   리포트 양식   : 인쇄/보고용 문서 (요약 + 내역표 + 특이사항)
//   대시보드 양식 : 지표 카드 + 차트(의존성 없는 SVG)

type InvItem = { sku: string; name: string; qty: number; status: string; location: string; totalWeightKg: number };
type OutOrder = { orderNo: string; customer: string; destination: string; status: string; lineCount: number; totalQty: number; totalWeightKg: number };
type Vehicle = { plateNo: string; driver: string; status: string; destination: string; loadKg: number; capacityKg: number };
type Receipt = { receiptNo: string; invoiceNo: string; supplier: string; dock: string; status: string; totalQty: number; totalWeightKg: number };

const RSTATUS = ["입고예정", "도착", "검수중", "입고완료"];
const OSTATUS = ["출고예정", "진행", "배송중", "완료"];
const RCOLOR: Record<string, string> = { 입고예정: "#94a3b8", 도착: "#d97706", 검수중: "#2563eb", 입고완료: "#16a34a" };
const OCOLOR: Record<string, string> = { 출고예정: "#94a3b8", 진행: "#d97706", 배송중: "#2563eb", 완료: "#16a34a" };
const BADGE: Record<string, string> = {
  입고예정: "bg-slate-100 text-slate-500",
  도착: "bg-amber-100 text-amber-700",
  검수중: "bg-blue-100 text-blue-700",
  입고완료: "bg-green-100 text-green-700",
  출고예정: "bg-slate-100 text-slate-500",
  진행: "bg-amber-100 text-amber-700",
  배송중: "bg-blue-100 text-blue-700",
  완료: "bg-green-100 text-green-700",
  정상: "bg-green-100 text-green-700",
  부족: "bg-amber-100 text-amber-700",
  이상: "bg-red-100 text-red-700",
};

type ViewKey = "report" | "dash";

// 가로 막대 차트 (상태 분포)
function StatusBars({ title, keys, counts, colors }: { title: string; keys: string[]; counts: Record<string, number>; colors: Record<string, string> }) {
  const max = Math.max(1, ...keys.map((k) => counts[k] ?? 0));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>
      <ul className="space-y-2">
        {keys.map((k) => {
          const v = counts[k] ?? 0;
          return (
            <li key={k} className="flex items-center gap-2">
              <span className="w-16 text-xs text-slate-500">{k}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: (v / max) * 100 + "%", background: colors[k] }} />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-slate-700">{v}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReportTab() {
  const [view, setView] = useState<ViewKey>("report");
  const [inv, setInv] = useState<InvItem[]>([]);
  const [orders, setOrders] = useState<OutOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [i, o, v, b] = await Promise.all([
          fetch("/api/inventory").then((r) => r.json()),
          fetch("/api/outbound").then((r) => r.json()),
          fetch("/api/vehicles").then((r) => r.json()),
          fetch("/api/inbound").then((r) => r.json()),
        ]);
        if (!alive) return;
        setInv(i.items ?? []);
        setOrders(o.orders ?? []);
        setVehicles(v.vehicles ?? []);
        setReceipts(b.receipts ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div className="grid h-48 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">리포트 데이터 불러오는 중…</div>;
  }

  const today = new Date().toLocaleDateString("ko-KR");
  const rCounts = Object.fromEntries(RSTATUS.map((k) => [k, receipts.filter((r) => r.status === k).length]));
  const oCounts = Object.fromEntries(OSTATUS.map((k) => [k, orders.filter((o) => o.status === k).length]));
  const inQty = receipts.reduce((s, r) => s + r.totalQty, 0);
  const inKg = receipts.reduce((s, r) => s + r.totalWeightKg, 0);
  const outQty = orders.reduce((s, o) => s + o.totalQty, 0);
  const outKg = orders.reduce((s, o) => s + o.totalWeightKg, 0);
  const stockKg = inv.reduce((s, i) => s + i.totalWeightKg, 0);
  const abnormal = inv.filter((i) => i.status !== "정상");
  const running = vehicles.filter((v) => v.status === "운행중").length;
  const maxSkuKg = Math.max(1, ...inv.map((i) => i.totalWeightKg));

  return (
    <div>
      {/* 양식 전환 */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {([
          { k: "report", label: "리포트 양식", desc: "인쇄·보고용 문서" },
          { k: "dash", label: "대시보드 양식", desc: "지표 카드 · 차트" },
        ] as { k: ViewKey; label: string; desc: string }[]).map((t) => {
          const on = t.k === view;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => setView(t.k)}
              className={
                "flex flex-col items-start rounded-xl border px-4 py-2 text-left transition-colors " +
                (on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
              }
            >
              <span className="text-sm font-semibold">{t.label}</span>
              <span className="text-[11px] text-slate-400">{t.desc}</span>
            </button>
          );
        })}
        {view === "report" && (
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            인쇄 / PDF 저장
          </button>
        )}
      </div>

      {view === "report" ? (
        /* ── 리포트 양식 ── */
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <header className="border-b-2 border-slate-800 pb-3">
            <h3 className="m-0 text-lg font-bold text-slate-900">제조물류 일일 업무 리포트</h3>
            <div className="mt-1 flex flex-wrap gap-x-6 text-xs text-slate-500">
              <span>작성일: {today}</span>
              <span>대상: 창고동 (아산)</span>
              <span>작성: WMS 자동집계</span>
            </div>
          </header>

          <section className="mt-4">
            <h4 className="mb-2 text-sm font-bold text-slate-800">1. 요약</h4>
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="border-t border-slate-200">
                  <th className="w-32 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">입고</th>
                  <td className="px-3 py-2 text-slate-700">
                    총 {receipts.length}건 · {inQty.toLocaleString()}EA · {inKg.toLocaleString()}kg
                    <span className="ml-2 text-slate-400">(완료 {rCounts["입고완료"]} / 진행 {receipts.length - rCounts["입고완료"]})</span>
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">출고</th>
                  <td className="px-3 py-2 text-slate-700">
                    총 {orders.length}건 · {outQty.toLocaleString()}EA · {outKg.toLocaleString()}kg
                    <span className="ml-2 text-slate-400">(완료 {oCounts["완료"]} / 배송중 {oCounts["배송중"]})</span>
                  </td>
                </tr>
                <tr className="border-t border-slate-200">
                  <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">재고</th>
                  <td className="px-3 py-2 text-slate-700">
                    {inv.length}종 · 총 {stockKg.toLocaleString()}kg
                    <span className="ml-2 text-slate-400">(이상 {abnormal.length}건)</span>
                  </td>
                </tr>
                <tr className="border-t border-b border-slate-200">
                  <th className="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">차량</th>
                  <td className="px-3 py-2 text-slate-700">
                    {vehicles.length}대 · 운행중 {running}대
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 text-sm font-bold text-slate-800">2. 입고 내역</h4>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-y border-slate-300 bg-slate-50 text-left text-slate-600">
                  <th className="px-2 py-1.5 font-semibold">업무번호</th>
                  <th className="px-2 py-1.5 font-semibold">Invoice</th>
                  <th className="px-2 py-1.5 font-semibold">공급처</th>
                  <th className="px-2 py-1.5 font-semibold">도크</th>
                  <th className="px-2 py-1.5 text-right font-semibold">수량</th>
                  <th className="px-2 py-1.5 text-right font-semibold">중량</th>
                  <th className="px-2 py-1.5 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {receipts.map((r) => (
                  <tr key={r.receiptNo} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-mono">{r.receiptNo}</td>
                    <td className="px-2 py-1.5 font-mono text-slate-500">{r.invoiceNo}</td>
                    <td className="px-2 py-1.5">{r.supplier}</td>
                    <td className="px-2 py-1.5 text-slate-500">{r.dock}</td>
                    <td className="px-2 py-1.5 text-right">{r.totalQty.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right">{r.totalWeightKg.toLocaleString()}kg</td>
                    <td className="px-2 py-1.5">
                      <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + BADGE[r.status]}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 text-sm font-bold text-slate-800">3. 출고 내역</h4>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-y border-slate-300 bg-slate-50 text-left text-slate-600">
                  <th className="px-2 py-1.5 font-semibold">주문번호</th>
                  <th className="px-2 py-1.5 font-semibold">고객사</th>
                  <th className="px-2 py-1.5 font-semibold">배송지</th>
                  <th className="px-2 py-1.5 text-right font-semibold">라인</th>
                  <th className="px-2 py-1.5 text-right font-semibold">수량</th>
                  <th className="px-2 py-1.5 text-right font-semibold">중량</th>
                  <th className="px-2 py-1.5 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {orders.map((o) => (
                  <tr key={o.orderNo} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-mono">{o.orderNo}</td>
                    <td className="px-2 py-1.5 font-semibold">{o.customer}</td>
                    <td className="px-2 py-1.5 text-slate-500">{o.destination}</td>
                    <td className="px-2 py-1.5 text-right">{o.lineCount}</td>
                    <td className="px-2 py-1.5 text-right">{o.totalQty.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right">{o.totalWeightKg.toLocaleString()}kg</td>
                    <td className="px-2 py-1.5">
                      <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + BADGE[o.status]}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 text-sm font-bold text-slate-800">4. 재고 요약</h4>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-y border-slate-300 bg-slate-50 text-left text-slate-600">
                  <th className="px-2 py-1.5 font-semibold">SKU</th>
                  <th className="px-2 py-1.5 font-semibold">품목</th>
                  <th className="px-2 py-1.5 font-semibold">로케이션</th>
                  <th className="px-2 py-1.5 text-right font-semibold">수량</th>
                  <th className="px-2 py-1.5 text-right font-semibold">총중량</th>
                  <th className="px-2 py-1.5 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {inv.map((i) => (
                  <tr key={i.sku} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 font-mono">{i.sku}</td>
                    <td className="px-2 py-1.5">{i.name}</td>
                    <td className="px-2 py-1.5 font-mono text-slate-500">{i.location}</td>
                    <td className="px-2 py-1.5 text-right">{i.qty.toLocaleString()}</td>
                    <td className="px-2 py-1.5 text-right">{i.totalWeightKg.toLocaleString()}kg</td>
                    <td className="px-2 py-1.5">
                      <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + BADGE[i.status]}>{i.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-5">
            <h4 className="mb-2 text-sm font-bold text-slate-800">5. 특이사항</h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
              {abnormal.length > 0 ? (
                abnormal.map((i) => (
                  <li key={i.sku}>
                    <strong>{i.sku}</strong> {i.name} — 재고 상태 <strong className="text-red-600">{i.status}</strong> (로케이션 {i.location}, 수량 {i.qty})
                  </li>
                ))
              ) : (
                <li>이상 재고 없음</li>
              )}
              {oCounts["출고예정"] > 0 && <li>출고예정 {oCounts["출고예정"]}건 — 배차 및 피킹 지시 필요</li>}
              {rCounts["검수중"] > 0 && <li>검수중 입고건 {rCounts["검수중"]}건 — PDA 스캔 검증 진행 중</li>}
            </ul>
          </section>

          <footer className="mt-6 border-t border-slate-200 pt-2 text-[11px] text-slate-400">
            본 리포트는 WMS API(/api/inbound, /api/inventory, /api/outbound, /api/vehicles)에서 자동 집계되었습니다.
          </footer>
        </article>
      ) : (
        /* ── 대시보드 양식 ── */
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "입고", v: receipts.length, u: "건", s: inKg.toLocaleString() + "kg", t: "text-amber-600" },
              { l: "출고", v: orders.length, u: "건", s: outKg.toLocaleString() + "kg", t: "text-brand-700" },
              { l: "재고", v: inv.length, u: "종", s: stockKg.toLocaleString() + "kg", t: "text-slate-900" },
              { l: "차량 운행", v: running, u: "대", s: "전체 " + vehicles.length + "대", t: "text-blue-600" },
            ].map((c) => (
              <div key={c.l} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <div className="text-xs font-medium text-slate-400">{c.l}</div>
                <div className={"mt-1 text-2xl font-bold " + c.t}>
                  {c.v}
                  <span className="ml-0.5 text-sm font-medium text-slate-400">{c.u}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">{c.s}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <StatusBars title="입고 상태 분포" keys={RSTATUS} counts={rCounts} colors={RCOLOR} />
            <StatusBars title="출고 상태 분포" keys={OSTATUS} counts={oCounts} colors={OCOLOR} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* SKU별 총중량 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">SKU별 재고 총중량</h4>
              <ul className="space-y-2">
                {inv.map((i) => (
                  <li key={i.sku} className="flex items-center gap-2">
                    <span className="w-24 truncate text-xs text-slate-500" title={i.name}>{i.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: (i.totalWeightKg / maxSkuKg) * 100 + "%",
                          background: i.status === "이상" ? "#dc2626" : i.status === "부족" ? "#d97706" : "#2563eb",
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-semibold text-slate-700">{i.totalWeightKg.toLocaleString()}kg</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 차량 적재율 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <h4 className="mb-3 text-sm font-semibold text-slate-900">차량별 적재율</h4>
              <ul className="space-y-2">
                {vehicles.map((v) => {
                  const rate = v.capacityKg ? v.loadKg / v.capacityKg : 0;
                  return (
                    <li key={v.plateNo} className="flex items-center gap-2">
                      <span className="w-20 font-mono text-[11px] text-slate-500">{v.plateNo}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={"h-full rounded-full " + (rate > 0.9 ? "bg-red-500" : rate > 0 ? "bg-brand-500" : "")}
                          style={{ width: Math.round(rate * 100) + "%" }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-slate-700">{Math.round(rate * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
