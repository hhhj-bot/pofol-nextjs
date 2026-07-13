// 빌드/개발 서버 시작 전에 한 번 실행되는 스크립트 (package.json의 predev/prebuild).
// next-swagger-doc(swagger-jsdoc → swagger-parser → @swagger-api/apidom-*, 62MB+)을
// 여기서만 쓰고 public/openapi.json으로 결과만 남긴다.
// 이유: 이 무거운 라이브러리를 서버 컴포넌트(app/swagger/page.tsx)에서 직접 호출하면
// Next.js가 그 의존성 전체를 서버리스 함수 트레이싱에 포함시켜 Vercel의 함수 용량
// 제한(100MB)을 넘겨버린다. 빌드 타임에 정적 JSON으로 미리 뽑아두면 런타임에는
// 이 라이브러리가 아예 번들에 들어가지 않는다.
import { createSwaggerSpec } from "next-swagger-doc";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const spec = createSwaggerSpec({
  apiFolder: "app/api",
  definition: {
    openapi: "3.0.0",
    info: {
      title: "창고 PDA 시뮬레이션 API",
      version: "1.0.0",
      description:
        "WMS 창고에서 PDA(핸디터미널)가 GTL 마스터/싱글 라벨을 스캔하는 상황을 흉내낸 조회 전용 REST API. " +
        "지금은 GET만 제공하며, 이후 Flutter PDA 앱과 별도로 배포되는 다른 Vercel 프런트에서 이 API를 그대로 호출할 예정이다.",
    },
    servers: [{ url: "/", description: "현재 배포" }],
    tags: [
      { name: "Hello", description: "가장 단순한 예시 엔드포인트" },
      { name: "Inventory", description: "재고 조회" },
      { name: "Labels", description: "GTL 라벨 스캔 시뮬레이션" },
      { name: "Outbound", description: "고객사 주문 단위 출고 · 싱글 라벨 스캔 검증" },
      { name: "Vehicles", description: "운송 차량 관제" },
      { name: "Inbound", description: "입고건 (업무번호 · Invoice)" },
    ],
    components: {
      schemas: {
        InventoryItem: {
          type: "object",
          properties: {
            sku: { type: "string", example: "FIN-3001" },
            name: { type: "string", example: "완제품 도어트림" },
            qty: { type: "number", example: 210 },
            site: { type: "string", example: "아산" },
            status: { type: "string", example: "정상" },
            location: { type: "string", example: "R1-1-1", description: "로케이션 코드(랙이름-행-열)" },
            unitWeightKg: { type: "number", example: 12, description: "단위 중량(kg)" },
            totalWeightKg: { type: "number", example: 2520, description: "총중량(kg) = 수량 x 단위중량" },
          },
        },
        OutboundLine: {
          type: "object",
          description: "출고 주문에 포함된 SINGLE 라벨 한 줄 (스캔 대상)",
          properties: {
            labelCode: { type: "string", example: "GTL-SGL-0001" },
            sku: { type: "string", example: "FIN-3001" },
            partName: { type: "string", example: "완제품 도어트림" },
            qty: { type: "number", example: 15 },
            location: { type: "string", example: "R1-1-1", description: "피킹 로케이션" },
            weightKg: { type: "number", example: 12 },
            masterCode: { type: "string", example: "GTL-MSTR-0001", description: "입고된 마스터(추적용)" },
          },
        },
        OutboundOrder: {
          type: "object",
          description: "고객사 주문 단위로 배열된 출고 주문 (입고 싱글들을 고객사별로 묶음)",
          properties: {
            orderNo: { type: "string", example: "OUT-20260713-01" },
            customer: { type: "string", example: "현대트랜시스" },
            destination: { type: "string", example: "아산 1공장" },
            status: { type: "string", enum: ["출고예정", "진행", "배송중", "완료"] },
            requestedAt: { type: "string", format: "date-time" },
            lineCount: { type: "number", example: 3 },
            totalQty: { type: "number", example: 42 },
            totalWeightKg: { type: "number", example: 33.4 },
            lines: { type: "array", items: { $ref: "#/components/schemas/OutboundLine" } },
          },
        },
        VerifyResult: {
          type: "object",
          description: "PDA 스캔 대조 결과 — 전량 스캔되면 출고가능",
          properties: {
            orderNo: { type: "string", example: "OUT-20260713-01" },
            customer: { type: "string", example: "현대트랜시스" },
            status: { type: "string", enum: ["출고가능", "미완료"] },
            ok: { type: "boolean", example: true },
            expected: { type: "number", example: 3 },
            scanned: { type: "number", example: 3 },
            missing: { type: "array", items: { type: "string" }, description: "아직 스캔 안 된 싱글" },
            unexpected: { type: "array", items: { type: "string" }, description: "주문에 없는데 스캔된 코드" },
          },
        },
        LabelRecord: {
          type: "object",
          properties: {
            labelCode: { type: "string", example: "GTL-MSTR-0001" },
            labelType: { type: "string", enum: ["MASTER", "SINGLE"] },
            sku: { type: "string", example: "FIN-3001" },
            partName: { type: "string", example: "완제품 도어트림" },
            lotNo: { type: "string", example: "LOT-20260630-01" },
            qty: { type: "number", example: 210 },
            boxCount: { type: "number", example: 14, nullable: true },
            palletNo: { type: "string", example: "PLT-8801", nullable: true },
            packedAt: { type: "string", format: "date-time" },
            destination: { type: "string", example: "아산" },
          },
        },
        InboundReceipt: {
          type: "object",
          description: "입고건 — 업무번호(입고번호)와 Invoice로 식별",
          properties: {
            receiptNo: { type: "string", example: "RCV-20260713-01" },
            invoiceNo: { type: "string", example: "INV-KR-260713-001" },
            supplier: { type: "string", example: "HL만도" },
            origin: { type: "string", example: "이천" },
            dock: { type: "string", example: "D2" },
            eta: { type: "string", format: "date-time" },
            arrivedAt: { type: "string", format: "date-time", nullable: true },
            status: { type: "string", enum: ["입고예정", "도착", "검수중", "입고완료"] },
            itemCount: { type: "number", example: 1 },
            totalQty: { type: "number", example: 43 },
            totalWeightKg: { type: "number", example: 366 },
            scanTargets: { type: "array", items: { type: "string" }, description: "검수 시 스캔할 마스터 라벨" },
          },
        },
        Vehicle: {
          type: "object",
          properties: {
            plateNo: { type: "string", example: "12가 3456" },
            driver: { type: "string", example: "김운송" },
            status: { type: "string", enum: ["대기", "상차중", "운행중", "도착"] },
            destination: { type: "string", example: "아산 1공장" },
            orderNo: { type: "string", example: "OUT-20260713-01", nullable: true },
            loadKg: { type: "number", example: 1850 },
            capacityKg: { type: "number", example: 5000 },
            eta: { type: "string", format: "date-time", nullable: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "NOT_FOUND" },
            message: {
              type: "string",
              example: "SKU 'XXX' 재고를 찾을 수 없습니다.",
            },
          },
        },
      },
    },
  },
});

const outDir = path.join(root, "public");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "openapi.json"), JSON.stringify(spec, null, 2));
console.log("[generate-openapi] public/openapi.json 생성 완료");
