// GTL(마스터/싱글) 라벨 목업 — 창고 PDA가 스캔하는 바코드 값을 흉내낸다.
// 마스터 라벨은 팔레트/박스 단위 라벨(여러 싱글 박스를 묶음), 싱글 라벨은 낱개 박스 단위 라벨이다.
// API Route(GET /api/labels, GET /api/labels/[code])가 이 데이터를 그대로 내려준다.
export type LabelType = "MASTER" | "SINGLE";

export type LabelRecord = {
  labelCode: string; // 스캔되는 바코드 값 (GTL 라벨 코드)
  labelType: LabelType;
  sku: string; // app/lib/data.ts의 ITEMS.sku 와 매칭
  partName: string;
  lotNo: string;
  qty: number;
  boxCount?: number; // 마스터 라벨에만 존재: 묶인 싱글 박스 수
  palletNo?: string; // 마스터 라벨에만 존재
  packedAt: string; // 포장(라벨 발행) 시각
  destination: string; // 목적지 거점
};

export const LABELS: LabelRecord[] = [
  {
    labelCode: "GTL-MSTR-0001",
    labelType: "MASTER",
    sku: "FIN-3001",
    partName: "완제품 도어트림",
    lotNo: "LOT-20260630-01",
    qty: 210,
    boxCount: 14,
    palletNo: "PLT-8801",
    packedAt: "2026-06-30T09:15:00.000Z",
    destination: "아산",
  },
  {
    labelCode: "GTL-SGL-0001",
    labelType: "SINGLE",
    sku: "FIN-3001",
    partName: "완제품 도어트림",
    lotNo: "LOT-20260630-01",
    qty: 15,
    packedAt: "2026-06-30T09:16:00.000Z",
    destination: "아산",
  },
  {
    labelCode: "GTL-MSTR-0002",
    labelType: "MASTER",
    sku: "WIP-2010",
    partName: "사출 성형품 A",
    lotNo: "LOT-20260701-02",
    qty: 430,
    boxCount: 20,
    palletNo: "PLT-8802",
    packedAt: "2026-07-01T08:40:00.000Z",
    destination: "이천",
  },
  {
    labelCode: "GTL-SGL-0002",
    labelType: "SINGLE",
    sku: "WIP-2010",
    partName: "사출 성형품 A",
    lotNo: "LOT-20260701-02",
    qty: 22,
    packedAt: "2026-07-01T08:41:00.000Z",
    destination: "이천",
  },
  {
    labelCode: "GTL-SGL-0003",
    labelType: "SINGLE",
    sku: "RAW-1002",
    partName: "안료 마스터배치",
    lotNo: "LOT-20260628-05",
    qty: 5,
    packedAt: "2026-06-28T14:05:00.000Z",
    destination: "청주",
  },
];

// 라벨 코드 단건 조회 — PDA가 바코드를 스캔한 상황을 흉내낸다.
export function findLabel(code: string): LabelRecord | undefined {
  return LABELS.find((l) => l.labelCode.toLowerCase() === code.toLowerCase());
}
