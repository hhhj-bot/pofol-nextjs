// 출고(피킹·상차) 더미 데이터 — Flutter 출고 화면과 /api/outbound 가 공유한다.
// 재고(로케이션)에서 피킹해 도착지로 내보내는 출고 지시/이력.

export type OutboundStatus = "대기" | "피킹중" | "출고완료";

export type OutboundOrder = {
  orderNo: string; // 출고 지시 번호
  sku: string;
  name: string;
  qty: number; // 출고 수량
  fromLocation: string; // 피킹 로케이션 (재고 로케이션과 매칭)
  destination: string; // 도착 거점/고객사
  status: OutboundStatus;
  requestedAt: string; // 지시 시각
  picker?: string; // 담당자 (미배정이면 없음)
};

export const OUTBOUND: OutboundOrder[] = [
  {
    orderNo: "OUT-20260709-01",
    sku: "FIN-3001",
    name: "완제품 도어트림",
    qty: 60,
    fromLocation: "R1-1-1",
    destination: "현대트랜시스(아산)",
    status: "출고완료",
    requestedAt: "2026-07-09T08:10:00.000Z",
    picker: "김창고",
  },
  {
    orderNo: "OUT-20260709-02",
    sku: "WIP-2010",
    name: "사출 성형품 A",
    qty: 120,
    fromLocation: "B1-2-3",
    destination: "HL만도(이천)",
    status: "피킹중",
    requestedAt: "2026-07-09T08:35:00.000Z",
    picker: "박피킹",
  },
  {
    orderNo: "OUT-20260709-03",
    sku: "RAW-1001",
    name: "폴리프로필렌 수지",
    qty: 200,
    fromLocation: "A1-1-2",
    destination: "이천 2공장",
    status: "대기",
    requestedAt: "2026-07-09T09:00:00.000Z",
  },
];

export type OutboundList = { serverTime: string; generatedBy: string; orders: OutboundOrder[] };

export function getOutbound(): OutboundList {
  return {
    serverTime: new Date().toISOString(),
    generatedBy: "server data source (getOutbound)",
    orders: OUTBOUND,
  };
}

// 출고 지시 단건 조회 — PDA가 출고 지시 번호를 스캔했을 때 상세를 보여주는 용도.
export function getOutboundOrder(orderNo: string): OutboundOrder | undefined {
  return OUTBOUND.find((o) => o.orderNo.toLowerCase() === orderNo.toLowerCase());
}
