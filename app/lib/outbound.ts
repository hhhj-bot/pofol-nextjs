// 출고 — 입고된 SINGLE 라벨을 고객사 주문 단위로 묶어 피킹하고, PDA 스캔으로 검증한다.
//
// 흐름:
//   1) 입고된 싱글들이 각자의 고객사(customer)를 갖는다 (app/lib/labels.ts)
//   2) 같은 고객사의 싱글들을 하나의 출고 주문(OutboundOrder)으로 배열한다
//   3) 피커가 각 싱글 라벨을 PDA로 스캔한다
//   4) 주문의 모든 싱글이 스캔되면 "확인완료" → 출고가능
//
// 스캔 상태는 서버에 저장하지 않고(서버리스라 인스턴스마다 메모리가 다름),
// 클라이언트(Flutter)가 스캔한 코드 목록을 보내면 서버가 대조해 판정한다(무상태 검증).

import { LABELS, type LabelRecord } from "./labels";

export type OutboundLine = {
  labelCode: string; // 스캔 대상 SINGLE 라벨
  sku: string;
  partName: string;
  qty: number;
  location: string; // 피킹 로케이션
  weightKg: number;
  masterCode: string; // 어느 마스터로 입고됐는지 (추적용)
};

export type OutboundStatus = "출고예정" | "진행" | "배송중" | "완료";

export type OutboundOrder = {
  orderNo: string;
  customer: string; // 고객사
  destination: string; // 배송지
  status: OutboundStatus;
  requestedAt: string;
  lineCount: number; // 주문에 포함된 싱글 수
  totalQty: number;
  totalWeightKg: number;
  lines: OutboundLine[];
};

// 고객사별 주문 메타 (주문번호/배송지/지시시각)
const ORDER_META: Record<string, { orderNo: string; destination: string; requestedAt: string; status: OutboundStatus }> = {
  현대트랜시스: { orderNo: "OUT-20260713-01", destination: "아산 1공장", requestedAt: "2026-07-13T08:10:00.000Z", status: "배송중" },
  동희오토: { orderNo: "OUT-20260713-03", destination: "서산 공장", requestedAt: "2026-07-13T08:30:00.000Z", status: "출고예정" },
  HL만도: { orderNo: "OUT-20260713-04", destination: "평택 공장", requestedAt: "2026-07-13T08:40:00.000Z", status: "배송중" },
  현대모비스: { orderNo: "OUT-20260713-05", destination: "진천 공장", requestedAt: "2026-07-13T08:50:00.000Z", status: "완료" },
  유라코퍼레이션: { orderNo: "OUT-20260713-02", destination: "유라 경주공장", requestedAt: "2026-07-13T09:05:00.000Z", status: "진행" },
};

function toLine(l: LabelRecord): OutboundLine {
  return {
    labelCode: l.labelCode,
    sku: l.sku,
    partName: l.partName,
    qty: l.qty,
    location: l.location ?? "-",
    weightKg: l.weightKg ?? 0,
    masterCode: l.masterCode ?? "-",
  };
}

// 입고된 싱글을 고객사 주문 단위로 배열한다.
export function getOutboundOrders(): OutboundOrder[] {
  const singleLabels = LABELS.filter((l) => l.labelType === "SINGLE" && l.customer);
  const byCustomer: Record<string, LabelRecord[]> = {};
  for (const item of singleLabels) {
    const c = item.customer as string;
    if (!byCustomer[c]) byCustomer[c] = [];
    byCustomer[c].push(item);
  }

  const orders: OutboundOrder[] = [];
  for (const customer of Object.keys(byCustomer)) {
    const meta = ORDER_META[customer];
    if (!meta) continue;
    const lines: OutboundLine[] = byCustomer[customer].map(toLine);
    orders.push({
      orderNo: meta.orderNo,
      customer,
      destination: meta.destination,
      status: meta.status,
      requestedAt: meta.requestedAt,
      lineCount: lines.length,
      totalQty: lines.reduce((sum, l) => sum + l.qty, 0),
      totalWeightKg: Math.round(lines.reduce((sum, l) => sum + l.weightKg, 0) * 10) / 10,
      lines,
    });
  }
  orders.sort((a, b) => a.orderNo.localeCompare(b.orderNo));
  return orders;
}

export type OutboundList = { serverTime: string; generatedBy: string; orders: OutboundOrder[] };

export function getOutbound(): OutboundList {
  return {
    serverTime: new Date().toISOString(),
    generatedBy: "server data source (getOutbound)",
    orders: getOutboundOrders(),
  };
}

export function getOutboundOrder(orderNo: string): OutboundOrder | undefined {
  return getOutboundOrders().find((o) => o.orderNo.toLowerCase() === orderNo.toLowerCase());
}

export type VerifyResult = {
  orderNo: string;
  customer: string;
  status: "출고가능" | "미완료";
  ok: boolean; // 전량 스캔 확인완료 → 출고가능
  expected: number; // 주문에 포함된 싱글 수
  scanned: number; // 그중 스캔된 수
  missing: string[]; // 아직 스캔 안 된 싱글 라벨
  unexpected: string[]; // 이 주문에 속하지 않는데 스캔된 코드
};

// PDA가 스캔한 싱글 라벨 목록을 주문과 대조한다.
export function verifyOutbound(orderNo: string, scannedCodes: string[]): VerifyResult | undefined {
  const order = getOutboundOrder(orderNo);
  if (!order) return undefined;

  const expectedCodes = order.lines.map((l) => l.labelCode);
  const scannedNorm = scannedCodes.map((c) => c.trim().toUpperCase());
  const expectedNorm = expectedCodes.map((c) => c.toUpperCase());

  const missing = expectedCodes.filter((c) => scannedNorm.indexOf(c.toUpperCase()) === -1);
  const unexpected = scannedNorm.filter(
    (c, i) => expectedNorm.indexOf(c) === -1 && scannedNorm.indexOf(c) === i
  );

  const scanned = expectedCodes.length - missing.length;
  const ok = missing.length === 0 && unexpected.length === 0;

  return {
    orderNo: order.orderNo,
    customer: order.customer,
    status: ok ? "출고가능" : "미완료",
    ok,
    expected: expectedCodes.length,
    scanned,
    missing,
    unexpected,
  };
}
