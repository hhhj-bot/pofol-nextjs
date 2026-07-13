// GTL 라벨 목업 — 창고 PDA가 스캔하는 바코드 값을 흉내낸다.
//
// 실제 물류 흐름:
//   생산된 제품이 박스포장되며 [싱글 라벨]이 붙는다(라벨 프린터에서 출력해 각 박스에 부착).
//   싱글 N개를 하나의 아우터박스에 담고 [마스터 라벨]을 붙인다(= 마스터가 싱글 N개를 포장).
//   마스터 단위로 창고 보관·픽업·배송되고, 도착지에서 개봉해 안의 싱글을 확인한 뒤
//   각 싱글은 서로 다른 [고객사]로 개별 배송된다.
//
// 출고는 이 싱글들을 [고객사 주문] 단위로 묶어 진행한다(app/lib/outbound.ts).
export type LabelType = "MASTER" | "SINGLE";

export type LabelRecord = {
  labelCode: string; // 스캔되는 바코드 값 (GTL 라벨 코드)
  labelType: LabelType;
  sku: string; // app/lib/data.ts의 ITEMS.sku 와 매칭
  partName: string;
  lotNo: string;
  qty: number;
  packedAt: string; // 포장(라벨 발행) 시각
  destination: string; // 마스터의 도착 거점(허브)
  // 마스터 전용
  boxCount?: number; // 이 마스터에 묶인 싱글 박스 수
  palletNo?: string;
  // 싱글 전용
  masterCode?: string; // 이 싱글이 속한 마스터 라벨 코드
  customer?: string; // 이 싱글의 최종 고객사 (싱글마다 다를 수 있음)
  location?: string; // 입고 후 보관 로케이션 (랙이름-행-열)
  weightKg?: number; // 싱글 박스 중량
};

export const LABELS: LabelRecord[] = [
  // ── 마스터 0001 (도어트림) = 싱글 3개 묶음 → 아산 허브 ──
  {
    labelCode: "GTL-MSTR-0001",
    labelType: "MASTER",
    sku: "FIN-3001",
    partName: "완제품 도어트림",
    lotNo: "LOT-20260630-01",
    qty: 45,
    boxCount: 3,
    palletNo: "PLT-8801",
    packedAt: "2026-06-30T09:20:00.000Z",
    destination: "아산",
  },
  { labelCode: "GTL-SGL-0001", labelType: "SINGLE", masterCode: "GTL-MSTR-0001", sku: "FIN-3001", partName: "완제품 도어트림", lotNo: "LOT-20260630-01", qty: 15, packedAt: "2026-06-30T09:15:00.000Z", destination: "아산", customer: "현대트랜시스", location: "R1-1-1", weightKg: 12 },
  { labelCode: "GTL-SGL-0002", labelType: "SINGLE", masterCode: "GTL-MSTR-0001", sku: "FIN-3001", partName: "완제품 도어트림", lotNo: "LOT-20260630-01", qty: 15, packedAt: "2026-06-30T09:16:00.000Z", destination: "아산", customer: "서연이화", location: "R1-1-2", weightKg: 12 },
  { labelCode: "GTL-SGL-0003", labelType: "SINGLE", masterCode: "GTL-MSTR-0001", sku: "FIN-3001", partName: "완제품 도어트림", lotNo: "LOT-20260630-01", qty: 15, packedAt: "2026-06-30T09:17:00.000Z", destination: "아산", customer: "동희오토", location: "R1-1-3", weightKg: 12 },

  // ── 마스터 0002 (성형품 A) = 싱글 2개 묶음 → 이천 허브 ──
  {
    labelCode: "GTL-MSTR-0002",
    labelType: "MASTER",
    sku: "WIP-2010",
    partName: "사출 성형품 A",
    lotNo: "LOT-20260701-02",
    qty: 43,
    boxCount: 2,
    palletNo: "PLT-8802",
    packedAt: "2026-07-01T08:45:00.000Z",
    destination: "이천",
  },
  { labelCode: "GTL-SGL-0004", labelType: "SINGLE", masterCode: "GTL-MSTR-0002", sku: "WIP-2010", partName: "사출 성형품 A", lotNo: "LOT-20260701-02", qty: 22, packedAt: "2026-07-01T08:40:00.000Z", destination: "이천", customer: "HL만도", location: "B1-2-1", weightKg: 8.5 },
  { labelCode: "GTL-SGL-0005", labelType: "SINGLE", masterCode: "GTL-MSTR-0002", sku: "WIP-2010", partName: "사출 성형품 A", lotNo: "LOT-20260701-02", qty: 21, packedAt: "2026-07-01T08:41:00.000Z", destination: "이천", customer: "현대모비스", location: "B1-2-2", weightKg: 8.5 },

  // ── 마스터 0003 (콘솔) = 싱글 3개 묶음 → 아산 허브 ──
  {
    labelCode: "GTL-MSTR-0003",
    labelType: "MASTER",
    sku: "FIN-3002",
    partName: "완제품 콘솔",
    lotNo: "LOT-20260702-03",
    qty: 31,
    boxCount: 3,
    palletNo: "PLT-8803",
    packedAt: "2026-07-02T10:05:00.000Z",
    destination: "아산",
  },
  { labelCode: "GTL-SGL-0006", labelType: "SINGLE", masterCode: "GTL-MSTR-0003", sku: "FIN-3002", partName: "완제품 콘솔", lotNo: "LOT-20260702-03", qty: 11, packedAt: "2026-07-02T10:00:00.000Z", destination: "아산", customer: "현대트랜시스", location: "R1-2-1", weightKg: 15 },
  { labelCode: "GTL-SGL-0007", labelType: "SINGLE", masterCode: "GTL-MSTR-0003", sku: "FIN-3002", partName: "완제품 콘솔", lotNo: "LOT-20260702-03", qty: 10, packedAt: "2026-07-02T10:01:00.000Z", destination: "아산", customer: "서연이화", location: "R1-2-2", weightKg: 15 },
  { labelCode: "GTL-SGL-0008", labelType: "SINGLE", masterCode: "GTL-MSTR-0003", sku: "FIN-3002", partName: "완제품 콘솔", lotNo: "LOT-20260702-03", qty: 10, packedAt: "2026-07-02T10:02:00.000Z", destination: "아산", customer: "HL만도", location: "R1-2-3", weightKg: 15 },

  // ── 마스터 0004 (범퍼 브라켓) = 싱글 3개 묶음 → 청주 허브 ──
  {
    labelCode: "GTL-MSTR-0004",
    labelType: "MASTER",
    sku: "WIP-2011",
    partName: "범퍼 브라켓",
    lotNo: "LOT-20260703-04",
    qty: 54,
    boxCount: 3,
    palletNo: "PLT-8804",
    packedAt: "2026-07-03T09:30:00.000Z",
    destination: "청주",
  },
  { labelCode: "GTL-SGL-0009", labelType: "SINGLE", masterCode: "GTL-MSTR-0004", sku: "WIP-2011", partName: "범퍼 브라켓", lotNo: "LOT-20260703-04", qty: 20, packedAt: "2026-07-03T09:25:00.000Z", destination: "청주", customer: "동희오토", location: "A2-1-2", weightKg: 6.4 },
  { labelCode: "GTL-SGL-0010", labelType: "SINGLE", masterCode: "GTL-MSTR-0004", sku: "WIP-2011", partName: "범퍼 브라켓", lotNo: "LOT-20260703-04", qty: 18, packedAt: "2026-07-03T09:26:00.000Z", destination: "청주", customer: "현대모비스", location: "A2-1-3", weightKg: 6.4 },
  { labelCode: "GTL-SGL-0011", labelType: "SINGLE", masterCode: "GTL-MSTR-0004", sku: "WIP-2011", partName: "범퍼 브라켓", lotNo: "LOT-20260703-04", qty: 16, packedAt: "2026-07-03T09:27:00.000Z", destination: "청주", customer: "현대트랜시스", location: "A2-1-4", weightKg: 6.4 },
];

// 라벨 코드 단건 조회 — PDA가 바코드를 스캔한 상황을 흉내낸다.
export function findLabel(code: string): LabelRecord | undefined {
  return LABELS.find((l) => l.labelCode.toLowerCase() === code.toLowerCase());
}

// 마스터 라벨만
export function masters(): LabelRecord[] {
  return LABELS.filter((l) => l.labelType === "MASTER");
}

// 싱글 라벨만
export function singles(): LabelRecord[] {
  return LABELS.filter((l) => l.labelType === "SINGLE");
}

// 특정 마스터에 묶인 싱글들
export function singlesOf(masterCode: string): LabelRecord[] {
  return LABELS.filter((l) => l.labelType === "SINGLE" && l.masterCode === masterCode);
}

// 도착지 입고예정서(ASN) 검증: 마스터 코드 존재 + 실제 싱글 수 == boxCount
export function verifyMaster(masterCode: string): { ok: boolean; expected: number; actual: number } {
  const m = findLabel(masterCode);
  const actual = singlesOf(masterCode).length;
  const expected = m?.boxCount ?? 0;
  return { ok: !!m && actual === expected, expected, actual };
}
