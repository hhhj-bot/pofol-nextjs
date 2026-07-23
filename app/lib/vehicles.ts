// 운송 차량 목업 — 관제화면(업무기획)과 /api/vehicles 가 공유한다.
// 출고 주문(OutboundOrder.orderNo)과 연결해 "어느 차가 어느 고객사 물량을 싣고 가는지" 보여준다.

export type VehicleStatus = "대기" | "상차중" | "운행중" | "도착";

export type Vehicle = {
  plateNo: string; // 차량번호
  driver: string;
  status: VehicleStatus;
  destination: string;
  orderNo?: string; // 연결된 출고 주문
  loadKg: number; // 현재 적재중량
  capacityKg: number; // 최대 적재중량
  eta?: string; // 도착 예정
};

export const VEHICLES: Vehicle[] = [
  { plateNo: "12가 3456", driver: "김운송", status: "운행중", destination: "아산 1공장", orderNo: "OUT-20260713-01", loadKg: 1850, capacityKg: 5000, eta: "2026-07-13T11:20:00.000Z" },
  { plateNo: "34나 7890", driver: "박기사", status: "상차중", destination: "천안 공장", orderNo: "OUT-20260713-02", loadKg: 900, capacityKg: 3500, eta: "2026-07-13T12:40:00.000Z" },
  { plateNo: "56다 1234", driver: "이배송", status: "대기", destination: "서산 공장", orderNo: "OUT-20260713-03", loadKg: 0, capacityKg: 3500 },
  { plateNo: "78라 5678", driver: "최물류", status: "운행중", destination: "평택 공장", orderNo: "OUT-20260713-04", loadKg: 2600, capacityKg: 5000, eta: "2026-07-13T10:50:00.000Z" },
  { plateNo: "90마 2345", driver: "정운행", status: "도착", destination: "진천 공장", orderNo: "OUT-20260713-05", loadKg: 1200, capacityKg: 3500 },
  { plateNo: "11바 6789", driver: "한대기", status: "상차중", destination: "유라 경주공장", orderNo: "OUT-20260713-02", loadKg: 1400, capacityKg: 5000, eta: "2026-07-13T13:10:00.000Z" },
];

export type VehicleList = { serverTime: string; generatedBy: string; vehicles: Vehicle[] };

export function getVehicles(): VehicleList {
  return {
    serverTime: new Date().toISOString(),
    generatedBy: "server data source (getVehicles)",
    vehicles: VEHICLES,
  };
}

export function getVehicle(plateNo: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.plateNo.replace(/\s/g, "") === plateNo.replace(/\s/g, ""));
}
