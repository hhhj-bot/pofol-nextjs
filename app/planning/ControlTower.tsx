"use client";

import { useEffect, useState } from "react";

// 전체 관제화면 — 3열 그리드.
//   1행: 입고현황(1) | 재고현황(2span)  ← 입고건 클릭 시 [입고건 상세]로 교체
//   2행: 출고현황(1) | 차량관제(2span)  ← 출고건 클릭 시 [출고건 상세]로 교체
//
// 업무의 기본 단위는 [입고건](업무번호+Invoice)과 [출고건](고객사 주문)이다.
// 마스터/싱글 라벨은 검수/피킹 스캔 시점에만 쓰는 하위 데이터라, 상세화면에서만 노출한다.

type InvItem = { sku: string; name: string; qty: number; status: string; location: string; unitWeightKg: number; totalWeightKg: number };
type OutLine = { labelCode: string; sku: string; partName: string; qty: number; location: string; weightKg: number; masterCode: string };
type OutOrder = { orderNo: string; customer: string; destination: string; status: string; requestedAt: string; lineCount: number; totalQty: number; totalWeightKg: number; lines: OutLine[] };
type Vehicle = { plateNo: string; driver: string; status: string; destination: string; orderNo?: string; loadKg: number; capacityKg: number; eta?: string };
type Receipt = { receiptNo: string; invoiceNo: string; supplier: string; origin: string; dock: string; eta: string; arrivedAt?: string; status: string; itemCount: number; totalQty: number; totalWeightKg: number; scanTargets: string[] };
type Label = { labelCode: string; labelType: "MASTER" | "SINGLE"; masterCode?: string; sku: string; partName: string; qty: number; customer?: string; location?: string; weightKg?: number; destination: string; boxCount?: number; palletNo?: string };

const VSTATUS: Record<string, string> = { 운행중: "bg-blue-100 text-blue-700", 상차중: "bg-amber-100 text-amber-700", 대기: "bg-slate-100 text-slate-500", 도착: "bg-green-100 text-green-700" };
const ISTATUS: Record<string, string> = { 정상: "bg-green-100 text-green-700", 부족: "bg-amber-100 text-amber-700", 이상: "bg-red-100 text-red-700" };
const RSTATUS: Record<string, string> = { 입고예정: "bg-slate-100 text-slate-500", 도착: "bg-amber-100 text-amber-700", 검수중: "bg-blue-100 text-blue-700", 입고완료: "bg-green-100 text-green-700" };
const OSTATUS: Record<string, string> = { 출고예정: "bg-slate-100 text-slate-500", 진행: "bg-amber-100 text-amber-700", 배송중: "bg-blue-100 text-blue-700", 완료: "bg-green-100 text-green-700" };
const OUT_GROUPS = ["출고예정", "진행", "배송중", "완료"];

const hm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-");

function Kpi({ label, value, unit, tone }: { label: string; value: string | number; unit?: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
      <div className="text-[11px] font-medium text-slate-400">{label}</div>
      <div className={"mt-0.5 text-xl font-bold " + (tone ?? "text-slate-900")}>
        {value}
        {unit && <span className="ml-0.5 text-xs font-medium text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function Panel({ title, right, span, children }: { title: string; right?: React.ReactNode; span?: boolean; children: React.ReactNode }) {
  return (
    <section className={"flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-soft " + (span ? "lg:col-span-2" : "")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      <div className="thin-scroll h-64 overflow-auto">{children}</div>
    </section>
  );
}

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-50"
    >
      ← 목록
    </button>
  );
}

export function ControlTower() {
  const [inv, setInv] = useState<InvItem[]>([]);
  const [orders, setOrders] = useState<OutOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [serverTime, setServerTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selReceipt, setSelReceipt] = useState<string | null>(null);
  const [selOrder, setSelOrder] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [i, o, v, b, l] = await Promise.all([
          fetch("/api/inventory").then((r) => r.json()),
          fetch("/api/outbound").then((r) => r.json()),
          fetch("/api/vehicles").then((r) => r.json()),
          fetch("/api/inbound").then((r) => r.json()),
          fetch("/api/labels").then((r) => r.json()),
        ]);
        if (!alive) return;
        setInv(i.items ?? []);
        setOrders(o.orders ?? []);
        setVehicles(v.vehicles ?? []);
        setReceipts(b.receipts ?? []);
        setLabels(Array.isArray(l) ? l : []);
        setServerTime(i.serverTime ?? "");
      } catch {
        if (alive) setErr("관제 데이터를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className="grid h-48 place-items-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">관제 데이터 불러오는 중…</div>;
  if (err) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{err}</div>;

  const totalQty = inv.reduce((s, i) => s + i.qty, 0);
  const totalWeight = inv.reduce((s, i) => s + i.totalWeightKg, 0);
  const abnormal = inv.filter((i) => i.status !== "정상").length;
  const running = vehicles.filter((v) => v.status === "운행중").length;
  const pending = receipts.filter((r) => r.status !== "입고완료").length;

  const receipt = receipts.find((r) => r.receiptNo === selReceipt);
  const order = orders.find((o) => o.orderNo === selOrder);
  const orderVehicle = order ? vehicles.find((v) => v.orderNo === order.orderNo) : undefined;

  // 입고건 검수 대상 (마스터 → 싱글) — 스캔 시점에만 쓰이는 하위 데이터
  const scanMasters = receipt ? labels.filter((l) => l.labelType === "MASTER" && receipt.scanTargets.includes(l.labelCode)) : [];
  const scanSingles = (masterCode: string) => labels.filter((l) => l.labelType === "SINGLE" && l.masterCode === masterCode);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="재고 SKU" value={inv.length} unit="종" />
        <Kpi label="총 재고수량" value={totalQty.toLocaleString()} unit="EA" />
        <Kpi label="총 중량" value={totalWeight.toLocaleString()} unit="kg" />
        <Kpi label="이상 재고" value={abnormal} unit="건" tone={abnormal ? "text-red-600" : "text-slate-900"} />
        <Kpi label="입고 진행" value={pending} unit={"/ " + receipts.length + "건"} tone="text-amber-600" />
        <Kpi label="차량 운행중" value={running} unit={"/ " + vehicles.length + "대"} tone="text-brand-700" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {/* 입고현황 */}
        <Panel title="입고현황" right={<span className="text-[11px] text-slate-400">{receipts.length}건</span>}>
          <ul className="space-y-1.5 pr-1">
            {receipts.map((r) => {
              const on = r.receiptNo === selReceipt;
              return (
                <li key={r.receiptNo}>
                  <button
                    type="button"
                    onClick={() => setSelReceipt(on ? null : r.receiptNo)}
                    className={
                      "w-full rounded-lg border px-2 py-1.5 text-left transition-colors " +
                      (on ? "border-brand-300 bg-brand-50" : "border-slate-100 hover:bg-slate-50")
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-slate-800">{r.receiptNo}</span>
                      <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (RSTATUS[r.status] ?? "bg-slate-100")}>{r.status}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">{r.invoiceNo}</div>
                    <div className="text-[11px] text-slate-600">{r.supplier}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>DOCK {r.dock}</span>
                      <span>{r.totalQty.toLocaleString()}EA · {r.totalWeightKg.toLocaleString()}kg</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* 재고현황 ↔ 입고건 상세 */}
        {receipt ? (
          <Panel title={"입고건 상세 · " + receipt.receiptNo} span right={<CloseBtn onClick={() => setSelReceipt(null)} />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-2 text-xs sm:grid-cols-4">
              {[
                ["Invoice", receipt.invoiceNo],
                ["공급처", receipt.supplier],
                ["출발지", receipt.origin],
                ["도크", receipt.dock],
                ["ETA", hm(receipt.eta)],
                ["도착", hm(receipt.arrivedAt)],
                ["수량", receipt.totalQty.toLocaleString() + " EA"],
                ["중량", receipt.totalWeightKg.toLocaleString() + " kg"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-50 py-0.5">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-medium text-slate-700">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 mb-1 text-[11px] font-semibold text-slate-500">검수 스캔 대상 (마스터 → 싱글)</div>
            {scanMasters.map((m) => (
              <div key={m.labelCode} className="mb-2 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-2 py-1">
                  <span className="font-mono text-[11px] font-semibold text-slate-700">{m.labelCode}</span>
                  <span className="text-[10px] text-slate-400">{m.partName} · {m.palletNo}</span>
                </div>
                <table className="w-full min-w-[480px] whitespace-nowrap text-xs">
                  <tbody className="text-slate-600">
                    {scanSingles(m.labelCode).map((s) => (
                      <tr key={s.labelCode} className="border-t border-slate-50">
                        <td className="px-2 py-1 font-mono text-[10px]">{s.labelCode}</td>
                        <td className="py-1">{s.customer}</td>
                        <td className="py-1 font-mono text-[10px] text-slate-400">{s.location}</td>
                        <td className="py-1 text-right">{s.qty}</td>
                        <td className="py-1 pr-2 text-right text-slate-400">{s.weightKg}kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </Panel>
        ) : (
          <Panel title="재고현황 (WMS)" span right={<span className="text-[11px] text-slate-400">{inv.length}종 · {totalWeight.toLocaleString()}kg</span>}>
            <table className="w-full min-w-[560px] whitespace-nowrap text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-slate-400">
                  <th className="pb-1 pr-4 font-medium">SKU</th>
                  <th className="pb-1 pr-4 font-medium">품목</th>
                  <th className="pb-1 pr-4 font-medium">로케이션</th>
                  <th className="pb-1 pr-4 text-right font-medium">수량</th>
                  <th className="pb-1 pr-4 text-right font-medium">총중량</th>
                  <th className="pb-1 pr-4 text-center font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {inv.map((i) => (
                  <tr key={i.sku} className="border-t border-slate-100">
                    <td className="py-1.5 font-mono text-[11px]">{i.sku}</td>
                    <td className="py-1.5 pr-2">{i.name}</td>
                    <td className="py-1.5 font-mono text-[11px] text-slate-400">{i.location}</td>
                    <td className="py-1.5 text-right">{i.qty.toLocaleString()}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-700">{i.totalWeightKg.toLocaleString()}kg</td>
                    <td className="py-1.5 text-center">
                      <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (ISTATUS[i.status] ?? "bg-slate-100")}>{i.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {/* 출고현황 — 상태별 그룹 */}
        <Panel title="출고현황" right={<span className="text-[11px] text-slate-400">{orders.length}건</span>}>
          <div className="space-y-2 pr-1">
            {OUT_GROUPS.map((g) => {
              const list = orders.filter((o) => o.status === g);
              if (!list.length) return null;
              return (
                <div key={g}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + OSTATUS[g]}>{g}</span>
                    <span className="text-[10px] text-slate-400">{list.length}건</span>
                  </div>
                  <ul className="space-y-1.5">
                    {list.map((o) => {
                      const on = o.orderNo === selOrder;
                      return (
                        <li key={o.orderNo}>
                          <button
                            type="button"
                            onClick={() => setSelOrder(on ? null : o.orderNo)}
                            className={
                              "w-full rounded-lg border px-2 py-1.5 text-left transition-colors " +
                              (on ? "border-brand-300 bg-brand-50" : "border-slate-100 hover:bg-slate-50")
                            }
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800">{o.customer}</span>
                              <span className="font-mono text-[10px] text-slate-400">{o.orderNo}</span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-400">
                              <span>{o.destination}</span>
                              <span>{o.totalQty.toLocaleString()}EA · {o.totalWeightKg.toLocaleString()}kg</span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* 차량관제 ↔ 출고건 상세 */}
        {order ? (
          <Panel title={"출고건 상세 · " + order.orderNo} span right={<CloseBtn onClick={() => setSelOrder(null)} />}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pb-2 text-xs sm:grid-cols-4">
              {[
                ["고객사", order.customer],
                ["배송지", order.destination],
                ["상태", order.status],
                ["지시시각", hm(order.requestedAt)],
                ["라인", order.lineCount + " 건"],
                ["수량", order.totalQty.toLocaleString() + " EA"],
                ["중량", order.totalWeightKg.toLocaleString() + " kg"],
                ["배차", orderVehicle ? orderVehicle.plateNo : "미배차"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-slate-50 py-0.5">
                  <span className="text-slate-400">{k}</span>
                  <span className="font-medium text-slate-700">{v}</span>
                </div>
              ))}
            </div>

            {orderVehicle && (
              <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-2 py-1.5 text-xs">
                <span className="font-mono font-semibold text-slate-800">{orderVehicle.plateNo} · {orderVehicle.driver}</span>
                <span className="text-slate-500">
                  {orderVehicle.loadKg.toLocaleString()}/{orderVehicle.capacityKg.toLocaleString()}kg · ETA {hm(orderVehicle.eta)}
                </span>
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (VSTATUS[orderVehicle.status] ?? "bg-slate-100")}>
                  {orderVehicle.status}
                </span>
              </div>
            )}

            <div className="mb-1 text-[11px] font-semibold text-slate-500">피킹 · 스캔 대상 (싱글 라벨)</div>
            <table className="w-full min-w-[640px] whitespace-nowrap text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-slate-400">
                  <th className="pb-1 pr-4 font-medium">싱글 라벨</th>
                  <th className="pb-1 pr-4 font-medium">품목</th>
                  <th className="pb-1 pr-4 font-medium">로케이션</th>
                  <th className="pb-1 pr-4 font-medium">마스터</th>
                  <th className="pb-1 pr-4 text-right font-medium">수량</th>
                  <th className="pb-1 pr-4 text-right font-medium">중량</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {order.lines.map((l) => (
                  <tr key={l.labelCode} className="border-t border-slate-100">
                    <td className="py-1.5 font-mono text-[11px]">{l.labelCode}</td>
                    <td className="py-1.5 pr-2">{l.partName}</td>
                    <td className="py-1.5 font-mono text-[11px] text-slate-400">{l.location}</td>
                    <td className="py-1.5 font-mono text-[10px] text-slate-400">{l.masterCode}</td>
                    <td className="py-1.5 text-right">{l.qty}</td>
                    <td className="py-1.5 text-right text-slate-400">{l.weightKg}kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          <Panel title="차량관제 (운송)" span right={<span className="text-[11px] text-slate-400">운행 {running} / {vehicles.length}대</span>}>
            <table className="w-full min-w-[800px] whitespace-nowrap text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-slate-400">
                  <th className="pb-1 pr-4 font-medium">차량번호</th>
                  <th className="pb-1 pr-4 font-medium">기사</th>
                  <th className="pb-1 pr-4 font-medium">상태</th>
                  <th className="pb-1 pr-4 font-medium">목적지</th>
                  <th className="pb-1 pr-4 font-medium">연결 주문</th>
                  <th className="pb-1 pr-4 text-right font-medium">적재</th>
                  <th className="pb-1 pr-4 font-medium">적재율</th>
                  <th className="pb-1 pr-4 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {vehicles.map((v) => {
                  const rate = v.capacityKg ? v.loadKg / v.capacityKg : 0;
                  return (
                    <tr key={v.plateNo} className="border-t border-slate-100">
                      <td className="py-1.5 font-mono text-[11px] font-semibold text-slate-800">{v.plateNo}</td>
                      <td className="py-1.5">{v.driver}</td>
                      <td className="py-1.5">
                        <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (VSTATUS[v.status] ?? "bg-slate-100")}>{v.status}</span>
                      </td>
                      <td className="py-1.5 text-slate-500">{v.destination}</td>
                      <td className="py-1.5 font-mono text-[10px] text-slate-400">{v.orderNo ?? "-"}</td>
                      <td className="py-1.5 text-right text-[11px] text-slate-500">{v.loadKg.toLocaleString()}/{v.capacityKg.toLocaleString()}</td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div className={"h-full rounded-full " + (rate > 0.9 ? "bg-red-500" : "bg-brand-500")} style={{ width: Math.round(rate * 100) + "%" }} />
                          </div>
                          <span className="text-[10px] text-slate-400">{Math.round(rate * 100)}</span>
                        </div>
                      </td>
                      <td className="py-1.5 text-[11px] text-slate-400">{hm(v.eta)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        입고건·출고건을 클릭하면 옆 패널이 상세화면으로 바뀝니다 · 데이터: <code>/api/inbound</code>, <code>/api/inventory</code>, <code>/api/outbound</code>, <code>/api/vehicles</code>, <code>/api/labels</code>
        {serverTime && <> · 서버 시각 {new Date(serverTime).toLocaleTimeString("ko-KR")}</>}
      </p>
    </div>
  );
}
