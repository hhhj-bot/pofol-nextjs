"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LOCS, settleAll, levelLoadOf, loadColor, ALLOWABLE, LEVELS, type Loc } from "../threejs/LoadPreview";

// 섹션별 상세화면 — 왼쪽은 "프로그램 화면"(운영자가 보는 UI), 오른쪽은 그 결과를 보여주는 3D.
// 3D는 모두 클라이언트 전용으로 로드한다.

const Loading = () => (
  <div className="grid h-[360px] place-items-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
    3D 불러오는 중…
  </div>
);

const Warehouse3D = dynamic(() => import("../threejs/Warehouse3D").then((m) => m.Warehouse3D), { ssr: false, loading: Loading });
const InboundScan3D = dynamic(() => import("../threejs/InboundScan3D").then((m) => m.InboundScan3D), { ssr: false, loading: Loading });
const Conveyor3D = dynamic(() => import("../threejs/Conveyor3D").then((m) => m.Conveyor3D), { ssr: false, loading: Loading });

function SectionShell({
  no,
  title,
  desc,
  program,
  viewer,
}: {
  no: number;
  title: string;
  desc: string;
  program: React.ReactNode;
  viewer: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">{no}</span>
        <h2 className="m-0">{title}</h2>
      </div>
      <p className="mb-3 text-sm text-slate-500">{desc}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-1.5 text-xs font-semibold text-slate-500">프로그램 화면</div>
          {program}
        </div>
        <div className="min-w-0">
          <div className="mb-1.5 text-xs font-semibold text-slate-500">3D 화면</div>
          {viewer}
        </div>
      </div>
    </section>
  );
}

// ── 1. 재고·적치 (프로그램: 레벨 하중 패널 / 3D: 랙) ──
function StockProgram({ locs }: { locs: Loc[] }) {
  const filled = locs.filter((l) => l.sku).length;
  const rate = Math.round((filled / locs.length) * 100);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-900">랙 적재 현황</span>
        <span className="text-slate-500">적재율 <strong className="text-brand-700">{rate}%</strong> ({filled}/{locs.length})</span>
      </div>
      <ul className="space-y-1.5">
        {Array.from({ length: LEVELS }).map((_, i) => {
          const level = LEVELS - i;
          const lv = levelLoadOf(locs, level);
          const ratio = lv / ALLOWABLE;
          const over = lv > ALLOWABLE;
          return (
            <li key={level} className="flex items-center gap-2">
              <span className={"w-8 text-xs font-bold " + (over ? "text-red-600" : "text-slate-500")}>L{level}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: Math.min(100, ratio * 100) + "%", background: loadColor(ratio) }} />
              </div>
              <span className={"w-20 text-right text-xs " + (over ? "font-bold text-red-600" : "text-slate-500")}>
                {lv.toLocaleString()}kg{over ? " 초과" : ""}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-400">
        허용하중 {ALLOWABLE.toLocaleString()}kg/단 · 상세 조작은{" "}
        <Link href="/threejs" className="font-semibold text-brand-600 underline">업무PoC · 적재/하중</Link>
      </div>
    </div>
  );
}

// ── 2. 입출고 (프로그램: 스캔 체크리스트 / 3D: 마스터 개봉·싱글 스캔) ──
function InboundProgram() {
  const rows = [
    { code: "M1 · GTL-MSTR-0001", note: "입고예정 마스터 · 아산" },
    { code: "S1 · 현대트랜시스", note: "싱글 검수" },
    { code: "S2 · 유라코퍼레이션", note: "싱글 검수" },
    { code: "S3 · 동희오토", note: "싱글 검수" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
        <span>WMS · 입고 검증 (PDA)</span>
        <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px]">스캔 진행</span>
      </div>
      <ul className="divide-y divide-slate-100 p-2 text-sm">
        {rows.map((r) => (
          <li key={r.code} className="flex items-center justify-between px-1 py-2">
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">{r.code}</div>
              <div className="text-[11px] text-slate-400">{r.note}</div>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">대기</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
        마스터 스캔 → 개봉 → 싱글 스캔. 실제 동작은 오른쪽 3D에서 재생됩니다.
      </div>
    </div>
  );
}

// ── 3. 설비연동 (프로그램: RFID 분기 로그 / 3D: 컨베이어) ──
function ConveyorProgram() {
  const logs = [
    { t: "09:12:03", msg: "RFID READ · EPC E280-11AA → 목적지 A", tone: "text-slate-600" },
    { t: "09:12:04", msg: "ROUTE · A → 슈트 1", tone: "text-slate-600" },
    { t: "09:12:05", msg: "DIVERTER_1 ON → OFF", tone: "text-brand-700" },
    { t: "09:12:09", msg: "RFID READ · EPC E280-11AB → 목적지 B", tone: "text-slate-600" },
    { t: "09:12:11", msg: "DIVERTER_2 ON → OFF", tone: "text-brand-700" },
    { t: "09:12:15", msg: "NoRead · 재처리 슈트로 이송", tone: "text-red-600" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm">
        <span className="font-semibold text-slate-900">PLC · RFID 분기 로그</span>
        <span className="text-xs text-slate-400">슈트 A 2 · B 1 · C 1 · NoRead 1</span>
      </div>
      <ul className="max-h-64 space-y-1 overflow-auto p-3 font-mono text-[11px]">
        {logs.map((l, i) => (
          <li key={i} className={l.tone}>
            <span className="text-slate-400">{l.t}</span> {l.msg}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlanningSections() {
  const [locs] = useState<Loc[]>(() => settleAll(LOCS));

  return (
    <div>
      <SectionShell
        no={1}
        title="재고 · 적치"
        desc="랙 로케이션별 적재 상태와 단(레벨)별 하중을 확인합니다. 허용하중을 넘으면 해당 단이 빨갛게 경고됩니다."
        program={<StockProgram locs={locs} />}
        viewer={<Warehouse3D locs={locs} />}
      />

      <SectionShell
        no={2}
        title="입출고 · 검증"
        desc="도착한 마스터를 PDA로 스캔해 검증하고, 개봉해 안의 싱글을 하나씩 검수합니다. 싱글은 각 고객사로 개별 출고됩니다."
        program={<InboundProgram />}
        viewer={<InboundScan3D />}
      />

      <SectionShell
        no={3}
        title="설비연동 · 자동분류"
        desc="컨베이어의 RFID 게이트가 태그를 읽어 목적지를 인식하고, 디버터가 해당 슈트로 자동 분기합니다."
        program={<ConveyorProgram />}
        viewer={<Conveyor3D />}
      />
    </div>
  );
}
