"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LOCS, settleAll, levelLoadOf, loadColor, ALLOWABLE, type Loc } from "../threejs/LoadPreview";
import { SorterHMI } from "./SorterHMI";

// 입출고 · 생산 섹션 — 제조물류의 실제 진행 순서대로 구현한다.
//   입고 → 생산(설비연동) → 출고
// 각 단계: 왼쪽 프로그램 화면 / 오른쪽 3D 화면.

const Loading = () => (
  <div className="grid h-[440px] place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
    3D 불러오는 중…
  </div>
);

const InboundScan3D = dynamic(() => import("../threejs/InboundScan3D").then((m) => m.InboundScan3D), { ssr: false, loading: Loading });
const Warehouse3D = dynamic(() => import("../threejs/Warehouse3D").then((m) => m.Warehouse3D), { ssr: false, loading: Loading });

type Receipt = { receiptNo: string; invoiceNo: string; supplier: string; dock: string; status: string; totalQty: number; totalWeightKg: number };
type OutOrder = { orderNo: string; customer: string; destination: string; lineCount: number; totalQty: number; totalWeightKg: number };

const RSTATUS: Record<string, string> = {
  입고예정: "bg-slate-100 text-slate-500",
  도착: "bg-amber-100 text-amber-700",
  검수중: "bg-blue-100 text-blue-700",
  입고완료: "bg-green-100 text-green-700",
};

type StageKey = "in" | "prod" | "store" | "out" | "ship";
const STAGES: { key: StageKey; n: number; title: string; desc: string }[] = [
  { key: "in", n: 1, title: "입고", desc: "업무번호·Invoice 기준 입고건 접수 → 도크 접안 → PDA 검수(마스터/싱글 스캔)" },
  { key: "prod", n: 2, title: "생산 (설비연동)", desc: "제조·창고에서 인입된 화물이 컨베이어 메인 라인을 타고 이동 → 스캔 게이트(RFID/바코드) 인식 → 목적지 슈트로 분기 → 도크에서 차량 상차" },
  { key: "store", n: 3, title: "보관", desc: "검수된 화물을 랙 로케이션에 적치 → 단(레벨)별 하중과 적재율을 확인하며 보관" },
  { key: "out", n: 4, title: "출고", desc: "고객사 주문 단위로 싱글 배열 → 피킹 → 스캔 확인완료 → 출고가능" },
  { key: "ship", n: 5, title: "배송", desc: "배차된 차량에 상차 → 운행 → 도착. 차량별 적재율과 ETA로 배송 현황을 관제" },
];

// ── 입고 프로그램 화면 ──
function InboundProgram() {
  const [rows, setRows] = useState<Receipt[]>([]);
  useEffect(() => {
    fetch("/api/inbound")
      .then((r) => r.json())
      .then((d) => setRows(d.receipts ?? []))
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-900">입고 접수 · 검수</span>
        <span className="text-[11px] text-slate-400">{rows.length}건</span>
      </div>
      <div className="thin-scroll max-h-[380px] overflow-auto p-2">
        <table className="w-full min-w-[520px] whitespace-nowrap text-xs">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-1 pr-4 font-medium">업무번호</th>
              <th className="pb-1 pr-4 font-medium">공급처</th>
              <th className="pb-1 pr-4 font-medium">도크</th>
              <th className="pb-1 pr-4 text-right font-medium">수량/중량</th>
              <th className="pb-1 pr-4 text-center font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="text-slate-600">
            {rows.map((r) => (
              <tr key={r.receiptNo} className="border-t border-slate-100">
                <td className="py-1.5">
                  <div className="font-mono text-[11px] font-semibold text-slate-800">{r.receiptNo}</div>
                  <div className="font-mono text-[10px] text-slate-400">{r.invoiceNo}</div>
                </td>
                <td className="py-1.5">{r.supplier}</td>
                <td className="py-1.5 text-slate-400">{r.dock}</td>
                <td className="py-1.5 text-right text-[11px]">
                  {r.totalQty.toLocaleString()}EA
                  <div className="text-slate-400">{r.totalWeightKg.toLocaleString()}kg</div>
                </td>
                <td className="py-1.5 text-center">
                  <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (RSTATUS[r.status] ?? "bg-slate-100")}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
        검수 단계에서만 마스터/싱글 라벨을 스캔합니다 → 오른쪽 3D
      </div>
    </div>
  );
}

// ── 생산(설비연동) 프로그램 화면 ──
function ProductionProgram() {
  const logs = [
    { t: "09:12:03", msg: "LINE-1 생산완료 · 박스포장 → 컨베이어 투입", tone: "text-slate-600" },
    { t: "09:12:05", msg: "RFID READ · EPC E280-11AA → 목적지 A", tone: "text-slate-600" },
    { t: "09:12:06", msg: "ROUTE · A → 슈트 1 (PLC 룩업)", tone: "text-slate-600" },
    { t: "09:12:07", msg: "DIVERTER_1 ON → OFF", tone: "text-brand-700" },
    { t: "09:12:11", msg: "RFID READ · EPC E280-11AB → 목적지 B", tone: "text-slate-600" },
    { t: "09:12:13", msg: "DIVERTER_2 ON → OFF", tone: "text-brand-700" },
    { t: "09:12:18", msg: "NoRead · 예외 슈트로 이송 (재처리)", tone: "text-red-600" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-900">설비 연동 · PLC/RFID 로그</span>
        <span className="text-[11px] text-slate-400">슈트 A 2 · B 1 · C 1 · NoRead 1</span>
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-center">
        {[
          { k: "생산라인", v: "3", u: "가동" },
          { k: "분류 처리", v: "4", u: "건/분" },
          { k: "인식 실패", v: "1", u: "건" },
        ].map((c) => (
          <div key={c.k} className="rounded-lg bg-slate-50 p-2">
            <div className="text-[10px] text-slate-400">{c.k}</div>
            <div className="text-base font-bold text-slate-900">{c.v} <span className="text-[10px] font-medium text-slate-400">{c.u}</span></div>
          </div>
        ))}
      </div>
      <ul className="thin-scroll max-h-[280px] space-y-1 overflow-auto border-t border-slate-100 p-3 font-mono text-[11px]">
        {logs.map((l, i) => (
          <li key={i} className={l.tone}>
            <span className="text-slate-400">{l.t}</span> {l.msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 출고 프로그램 화면 ──
function OutboundProgram() {
  const [rows, setRows] = useState<OutOrder[]>([]);
  useEffect(() => {
    fetch("/api/outbound")
      .then((r) => r.json())
      .then((d) => setRows(d.orders ?? []))
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-900">출고 주문 · 피킹 검증</span>
        <span className="text-[11px] text-slate-400">{rows.length}건</span>
      </div>
      <div className="thin-scroll max-h-[380px] overflow-auto p-2">
        <table className="w-full min-w-[520px] whitespace-nowrap text-xs">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-1 pr-4 font-medium">주문번호</th>
              <th className="pb-1 pr-4 font-medium">고객사</th>
              <th className="pb-1 pr-4 font-medium">배송지</th>
              <th className="pb-1 pr-4 text-right font-medium">수량/중량</th>
              <th className="pb-1 pr-4 text-center font-medium">검증</th>
            </tr>
          </thead>
          <tbody className="text-slate-600">
            {rows.map((o) => (
              <tr key={o.orderNo} className="border-t border-slate-100">
                <td className="py-1.5 font-mono text-[11px]">{o.orderNo}</td>
                <td className="py-1.5 font-semibold text-slate-800">{o.customer}</td>
                <td className="py-1.5 text-slate-400">{o.destination}</td>
                <td className="py-1.5 text-right text-[11px]">
                  {o.totalQty.toLocaleString()}EA
                  <div className="text-slate-400">{o.totalWeightKg.toLocaleString()}kg</div>
                </td>
                <td className="py-1.5 text-center">
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    미완료
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
        주문의 모든 라인을 스캔하면 <code>POST /api/outbound/&#123;orderNo&#125;/verify</code> → <strong>출고가능</strong>
      </div>
    </div>
  );
}

// ── 보관 프로그램 화면 ──
function StorageProgram({ locs }: { locs: Loc[] }) {
  const filled = locs.filter((l) => l.sku).length;
  const rate = Math.round((filled / locs.length) * 100);
  const totalKg = locs.reduce((s, l) => s + (l.weight ?? 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-900">랙 보관 현황</span>
        <span className="text-[11px] text-slate-400">적재율 {rate}% · {totalKg.toLocaleString()}kg</span>
      </div>
      <ul className="space-y-1.5 px-3 py-2">
        {[3, 2, 1].map((level) => {
          const lv = levelLoadOf(locs, level);
          const ratio = lv / ALLOWABLE;
          const over = lv > ALLOWABLE;
          return (
            <li key={level} className="flex items-center gap-2">
              <span className={"w-8 text-xs font-bold " + (over ? "text-red-600" : "text-slate-500")}>L{level}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: Math.min(100, ratio * 100) + "%", background: loadColor(ratio) }} />
              </div>
              <span className={"w-24 text-right text-xs " + (over ? "font-bold text-red-600" : "text-slate-500")}>
                {lv.toLocaleString()}kg{over ? " 초과" : ""}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="thin-scroll max-h-[240px] overflow-auto border-t border-slate-100 p-2">
        <table className="w-full min-w-[420px] whitespace-nowrap text-xs">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-1 pr-4 font-medium">로케이션</th>
              <th className="pb-1 pr-4 font-medium">SKU</th>
              <th className="pb-1 pr-4 text-right font-medium">수량</th>
              <th className="pb-1 pr-4 text-right font-medium">중량</th>
            </tr>
          </thead>
          <tbody className="text-slate-600">
            {locs.filter((l) => l.sku).map((l) => (
              <tr key={l.code} className="border-t border-slate-100">
                <td className="py-1.5 pr-4 font-mono text-[11px]">{l.code}</td>
                <td className="py-1.5 pr-4">{l.sku}</td>
                <td className="py-1.5 pr-4 text-right">{l.qty}</td>
                <td className="py-1.5 pr-4 text-right text-slate-400">{l.weight}kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400">
        허용하중 {ALLOWABLE.toLocaleString()}kg/단 · 초과 시 해당 단이 빨갛게 표시됩니다
      </div>
    </div>
  );
}

// ── 배송 프로그램 화면 ──
type Veh = { plateNo: string; driver: string; status: string; destination: string; orderNo?: string; loadKg: number; capacityKg: number; eta?: string };
const VSTATUS: Record<string, string> = {
  운행중: "bg-blue-100 text-blue-700",
  상차중: "bg-amber-100 text-amber-700",
  대기: "bg-slate-100 text-slate-500",
  도착: "bg-green-100 text-green-700",
};

function ShippingProgram() {
  const [rows, setRows] = useState<Veh[]>([]);
  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => setRows(d.vehicles ?? []))
      .catch(() => setRows([]));
  }, []);
  const running = rows.filter((v) => v.status === "운행중").length;
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
        <span className="text-sm font-semibold text-slate-900">배송 · 차량 관제</span>
        <span className="text-[11px] text-slate-400">운행 {running} / {rows.length}대</span>
      </div>
      <div className="thin-scroll max-h-[380px] overflow-auto p-2">
        <table className="w-full min-w-[560px] whitespace-nowrap text-xs">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-1 pr-4 font-medium">차량번호</th>
              <th className="pb-1 pr-4 font-medium">기사</th>
              <th className="pb-1 pr-4 font-medium">상태</th>
              <th className="pb-1 pr-4 font-medium">목적지</th>
              <th className="pb-1 pr-4 font-medium">적재율</th>
              <th className="pb-1 pr-4 font-medium">ETA</th>
            </tr>
          </thead>
          <tbody className="text-slate-600">
            {rows.map((v) => {
              const rate = v.capacityKg ? v.loadKg / v.capacityKg : 0;
              return (
                <tr key={v.plateNo} className="border-t border-slate-100">
                  <td className="py-1.5 pr-4 font-mono text-[11px] font-semibold text-slate-800">{v.plateNo}</td>
                  <td className="py-1.5 pr-4">{v.driver}</td>
                  <td className="py-1.5 pr-4">
                    <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " + (VSTATUS[v.status] ?? "bg-slate-100")}>{v.status}</span>
                  </td>
                  <td className="py-1.5 pr-4 text-slate-500">{v.destination}</td>
                  <td className="py-1.5 pr-4">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div className={"h-full rounded-full " + (rate > 0.9 ? "bg-red-500" : "bg-brand-500")} style={{ width: Math.round(rate * 100) + "%" }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{Math.round(rate * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-4 text-[11px] text-slate-400">
                    {v.eta ? new Date(v.eta).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OpsStages() {
  const [stage, setStage] = useState<StageKey>("in");
  const [locs] = useState<Loc[]>(() => settleAll(LOCS));
  const s = STAGES.find((x) => x.key === stage)!;

  return (
    <div>
      {/* 진행 순서 */}
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((st, i) => {
          const on = st.key === stage;
          return (
            <div key={st.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStage(st.key)}
                className={
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors " +
                  (on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                <span className={"grid h-5 w-5 place-items-center rounded-full text-xs font-bold " + (on ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-500")}>
                  {st.n}
                </span>
                {st.title}
              </button>
              {i < STAGES.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
        <span className="font-semibold text-brand-700">{s.n}. {s.title} — </span>
        {s.desc}
      </div>

      {stage === "prod" ? (
        <div className="mt-4">
          <SorterHMI />
        </div>
      ) : stage === "ship" ? (
        <div className="mt-4">
          <ShippingProgram />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">프로그램 화면</div>
            {stage === "in" && <InboundProgram />}
            {stage === "store" && <StorageProgram locs={locs} />}
            {stage === "out" && <OutboundProgram />}
          </div>
          <div className="min-w-0">
            <div className="mb-1.5 text-xs font-semibold text-slate-500">3D 화면</div>
            {stage === "in" ? <InboundScan3D /> : <Warehouse3D locs={locs} />}
          </div>
        </div>
      )}
    </div>
  );
}
