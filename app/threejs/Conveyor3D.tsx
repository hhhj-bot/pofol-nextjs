"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { masters } from "../lib/labels";

// [미사용 · 추후 설비 연동 탭용 자산]
// 컨베이어 위에서 마스터(아우터박스)가 이동하는 3D. 자동 분류/설비 연동 업무를
// 별도 탭으로 도입할 때 재사용하기 위해 남겨둔다. (현재 입출고 탭에서는 쓰지 않음)
const LENGTH = 8;
const SPEED = 0.8;

function MasterBox({ index, count }: { index: number; count: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const offset = (index * LENGTH) / Math.max(count, 1);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * SPEED + offset) % LENGTH;
    if (ref.current) ref.current.position.x = -LENGTH / 2 + t;
  });
  return (
    <mesh ref={ref} position={[0, 0.7, 0]}>
      <boxGeometry args={[0.9, 0.7, 0.9]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
  );
}

export function Conveyor3D() {
  const ms = masters();
  return (
    <div style={{ height: 440 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Canvas camera={{ position: [7, 5, 9], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[8, 10, 6]} intensity={0.85} />
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[LENGTH, 0.15, 1]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[-LENGTH / 2 + i, 0.3, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        ))}
        {ms.map((m, i) => (
          <MasterBox key={m.labelCode} index={i} count={ms.length} />
        ))}
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
