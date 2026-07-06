// Three.js(자재창고 뷰어) 페이지의 코드 샘플 문자열 모음.
// 아직 실제 캔버스를 붙이기 전이라, "이렇게 만든다"를 보여주는 참고 코드다.

// react-three-fiber 스택 설치
export const THREE_SETUP = `# react-three-fiber 스택 (React 개발자에게 순수 three보다 빠르다)
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# Next.js App Router에서는 캔버스를 "use client" 컴포넌트로 두고,
# 필요하면 dynamic(() => import(...), { ssr: false })로 클라이언트에서만 로드한다.`;

// 창고 씬(바닥 + 랙 배치 + 카메라 컨트롤)
export const THREE_WAREHOUSE = `// app/threejs/Warehouse.tsx — 창고 씬
"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Rack } from "./Rack";
import { RACKS } from "./data";

export function Warehouse() {
  return (
    <Canvas camera={{ position: [8, 8, 12], fov: 45 }} style={{ height: 480 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 12, 6]} intensity={0.8} />

      {/* 창고 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 16]} />
        <meshStandardMaterial color="#eef2f7" />
      </mesh>

      {/* 재고 데이터로 랙 열을 배치한다 */}
      {RACKS.map((r) => (
        <Rack key={r.id} rack={r} />
      ))}

      <OrbitControls enableDamping /> {/* 회전/확대 */}
    </Canvas>
  );
}`;

// 랙 하나 — 적재율에 따라 높이/색을 바꾼다
export const THREE_RACK = `// app/threejs/Rack.tsx — 랙 한 칸
"use client";
import type { RackData } from "./data";

// 적재율(0~1)에 따라 색을 바꾼다. 여유는 초록, 포화는 빨강.
function fillColor(rate: number) {
  if (rate < 0.7) return "#16a34a"; // 여유
  if (rate < 0.9) return "#d97706"; // 주의
  return "#dc2626";                 // 포화
}

export function Rack({ rack }: { rack: RackData }) {
  const height = 0.5 + rack.rate * 3; // 적재율이 높을수록 높게 쌓인 것처럼
  return (
    <mesh position={[rack.x, height / 2, rack.z]}>
      <boxGeometry args={[1.2, height, 1.2]} />
      <meshStandardMaterial color={fillColor(rack.rate)} />
    </mesh>
  );
}`;

// 랙 데이터 형태 + capacity 계산
export const THREE_DATA = `// app/threejs/data.ts — 랙 데이터와 capacity 계산
// rate(적재율), stayDays(평균 보관일수)는 ERP/WMS 재고 데이터에서 산출한다고 가정.
export type RackData = {
  id: string;
  x: number;
  z: number;
  rate: number;     // 적재율 0~1
  stayDays: number; // 평균 보관일수 (회전 느린 자재 판별)
};

export const RACKS: RackData[] = [
  { id: "A-01", x: -6, z: -4, rate: 0.42, stayDays: 12 },
  { id: "A-02", x: -6, z: -2, rate: 0.88, stayDays: 41 },
  { id: "B-01", x: -3, z: -4, rate: 0.95, stayDays: 63 },
  // ...재고 데이터만큼 이어진다
];

// 평치 vs 자동화(고층 랙) capacity 비교 — 자동화는 단수를 더 쌓는다
export function capacity(layout: "flat" | "auto", cells: number) {
  const perCell = layout === "auto" ? 6 : 2;
  return cells * perCell;
}`;
