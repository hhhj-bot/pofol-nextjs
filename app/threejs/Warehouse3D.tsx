"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { LOCS, LEVELS, BAYS, ALLOWABLE, levelLoad, loadColor } from "./LoadPreview";

// 스텝들을 합친 실제 three.js 뷰어(최종 결과물).
// 랙 빔은 레벨별 하중으로 색이 바뀌고, 적재된 SKU는 파란 박스로 올라간다.

const LW = 1.2; // 베이(가로) 간격
const LH = 1.0; // 레벨(높이) 간격
const LD = 1.2; // 깊이

function cellPos(level: number, bay: number): [number, number, number] {
  const x = (bay - 1) * LW - ((BAYS - 1) * LW) / 2;
  const y = (level - 1) * LH + LH / 2;
  return [x, y, 0];
}

function Beams() {
  const width = BAYS * LW + 0.3;
  return (
    <group>
      {Array.from({ length: LEVELS + 1 }).map((_, i) => {
        const color = i >= 1 ? loadColor(levelLoad(i) / ALLOWABLE) : "#94a3b8";
        return (
          <mesh key={i} position={[0, i * LH, 0]}>
            <boxGeometry args={[width, 0.08, LD + 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

function Uprights() {
  const half = (BAYS * LW) / 2;
  const posX = [-half - 0.05, half + 0.05];
  const posZ = [-LD / 2 - 0.15, LD / 2 + 0.15];
  const h = LEVELS * LH;
  const cols: [number, number][] = [];
  posX.forEach((x) => posZ.forEach((z) => cols.push([x, z])));
  return (
    <group>
      {cols.map(([x, z], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <boxGeometry args={[0.08, h, 0.08]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
    </group>
  );
}

function Pallets() {
  return (
    <group>
      {LOCS.filter((l) => l.sku).map((l) => (
        <mesh key={l.code} position={cellPos(l.level, l.bay)}>
          <boxGeometry args={[LW * 0.8, LH * 0.6, LD * 0.8]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      ))}
    </group>
  );
}

export function Warehouse3D() {
  return (
    <div style={{ height: 440 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Canvas camera={{ position: [6, 5, 8], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[8, 12, 6]} intensity={0.8} />
        {/* 창고 바닥 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[BAYS * LW + 3, LD + 3]} />
          <meshStandardMaterial color="#eef2f7" />
        </mesh>
        <Uprights />
        <Beams />
        <Pallets />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
