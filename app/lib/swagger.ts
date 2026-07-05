import { createSwaggerSpec } from "next-swagger-doc";

// app/api 아래 route.ts의 JSDoc(@swagger) 주석을 모아 OpenAPI 스펙으로 만든다.
// /swagger 페이지가 이 스펙을 SwaggerUI에 그대로 넘긴다.
export const getApiDocs = () => {
  return createSwaggerSpec({
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
};
