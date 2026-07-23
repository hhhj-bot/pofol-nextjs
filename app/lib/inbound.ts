// 입고 — 관제/업무의 기본 단위는 [입고건]이다.
// 업무번호(입고번호)와 Invoice(송장번호)로 식별하고, 공급처·도크·상태·수량으로 관리한다.
//
// 마스터/싱글 라벨(app/lib/labels.ts)은 이 입고건을 실제로 검수할 때 쓰는
// "스캔 대상 데이터"일 뿐이라, 관제 화면 전면에는 노출하지 않고 scanTargets로만 연결한다.

export type InboundStatus = "입고예정" | "도착" | "검수중" | "입고완료";

export type InboundReceipt = {
  receiptNo: string; // 업무번호 (입고번호)
  invoiceNo: string; // 송장/Invoice 번호
  supplier: string; // 공급처 / 발송처
  origin: string; // 출발지
  dock: string; // 접안 도크
  eta: string; // 도착 예정
  arrivedAt?: string; // 실제 도착
  status: InboundStatus;
  itemCount: number; // 품목 종수
  totalQty: number; // 총 수량(EA)
  totalWeightKg: number;
  scanTargets: string[]; // 검수 시 스캔할 마스터 라벨 (전면 노출 X)
};

export const RECEIPTS: InboundReceipt[] = [
  {
    receiptNo: "RCV-20260713-01",
    invoiceNo: "INV-KR-260713-001",
    supplier: "자체생산 (공장동)",
    origin: "아산",
    dock: "D1",
    eta: "2026-07-13T08:00:00.000Z",
    arrivedAt: "2026-07-13T07:52:00.000Z",
    status: "입고완료",
    itemCount: 1,
    totalQty: 45,
    totalWeightKg: 540,
    scanTargets: ["GTL-MSTR-0001"],
  },
  {
    receiptNo: "RCV-20260713-02",
    invoiceNo: "INV-KR-260713-002",
    supplier: "HL만도",
    origin: "이천",
    dock: "D2",
    eta: "2026-07-13T09:30:00.000Z",
    arrivedAt: "2026-07-13T09:41:00.000Z",
    status: "검수중",
    itemCount: 1,
    totalQty: 43,
    totalWeightKg: 366,
    scanTargets: ["GTL-MSTR-0002"],
  },
  {
    receiptNo: "RCV-20260713-03",
    invoiceNo: "INV-KR-260713-003",
    supplier: "자체생산 (공장동)",
    origin: "아산",
    dock: "D1",
    eta: "2026-07-13T10:20:00.000Z",
    arrivedAt: "2026-07-13T10:15:00.000Z",
    status: "도착",
    itemCount: 1,
    totalQty: 31,
    totalWeightKg: 465,
    scanTargets: ["GTL-MSTR-0003"],
  },
  {
    receiptNo: "RCV-20260713-04",
    invoiceNo: "INV-KR-260713-004",
    supplier: "현대모비스",
    origin: "청주",
    dock: "D3",
    eta: "2026-07-13T13:40:00.000Z",
    status: "입고예정",
    itemCount: 1,
    totalQty: 70,
    totalWeightKg: 448,
    scanTargets: ["GTL-MSTR-0004"],
  },
  {
    receiptNo: "RCV-20260713-05",
    invoiceNo: "INV-KR-260713-005",
    supplier: "유라코퍼레이션",
    origin: "경주",
    dock: "D3",
    eta: "2026-07-13T14:20:00.000Z",
    status: "입고예정",
    itemCount: 1,
    totalQty: 38,
    totalWeightKg: 285,
    scanTargets: [],
  },
];

export type InboundList = { serverTime: string; generatedBy: string; receipts: InboundReceipt[] };

export function getInbound(): InboundList {
  return {
    serverTime: new Date().toISOString(),
    generatedBy: "server data source (getInbound)",
    receipts: RECEIPTS,
  };
}

export function getReceipt(receiptNo: string): InboundReceipt | undefined {
  return RECEIPTS.find((r) => r.receiptNo.toLowerCase() === receiptNo.toLowerCase());
}
