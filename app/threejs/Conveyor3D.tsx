"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { LabelRecord } from "../lib/labels";
import type { InvItem } from "../components/InventoryTable";
import { plcColor, plcLabel, statusToPlc, type PlcState } from "./EquipmentPreview";

// 스텝들을 합친 실제 three.js 뷰어(최종 결과물).
// GET /api/labels · GET /api/inventory를 그대로 fetch해서, 컨베이어 위 박스 이동과
// IoT 센서/PLC 신호를 "실데이터"로 구동한다 — /test 페이지가 스캔했던 그 데이터다.

const LENGTH = 8; // 컨베이어 길이
const SPEED = 0.8; // 박스 이동 속도 (단위/초)
const RANK: Record<PlcState, number> = { RUN: 0, WARN: 1, ALARM: 2 };

function worstPlc(labels: LabelRecord[], items: InvItem[]): PlcState {
  let worst: PlcState = "RUN";
  for (const l of labels) {
    const item = items.find((i) => i.sku === l.sku);
    const s = item ? statusToPlc(item.status) : "RUN";
    if (RANK[s] > RANK[worst]) worst = s;
  }
  return worst;
}

function Belt() {
  return (
    <group>
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
      {/* 공정 투입 게이트 */}
      <mesh position={[LENGTH / 2 + 0.15, 0.8, 0]}>
        <boxGeometry args={[0.12, 1.6, 1.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}

function MovingBox({ label, offset }: { label: LabelRecord; offset: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * SPEED + offset) % LENGTH;
    if (ref.current) ref.current.position.x = -LENGTH / 2 + t;
  });
  const size = label.labelType === "MASTER" ? 0.55 : 0.38;
  const color = label.labelType === "MASTER" ? "#2563eb" : "#0ea5e9";
  return (
    <mesh ref={ref} position={[0, 0.3 + size / 2 + 0.08, 0]}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function SensorLight({ x, plc }: { x: number; plc: PlcState }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    if (plc === "ALARM") {
      matRef.current.emissiveIntensity = Math.sin(clock.elapsedTime * 8) > 0 ? 1.4 : 0.2;
    } else {
      matRef.current.emissiveIntensity = 0.6;
    }
  });
  const color = plcColor(plc);
  return (
    <mesh position={[x, 1.1, 0.6]}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={0.6} />
    </mesh>
  );
}

function Scene({ labels, plc }: { labels: LabelRecord[]; plc: PlcState }) {
  const sensorXs = [-LENGTH / 3, 0, LENGTH / 3];
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 10, 6]} intensity={0.85} />
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[LENGTH + 3, 4]} />
        <meshStandardMaterial color="#eef2f7" />
      </mesh>
      <Belt />
      {labels.map((l, i) => (
        <MovingBox key={l.labelCode} label={l} offset={(i * LENGTH) / Math.max(labels.length, 1)} />
      ))}
      {sensorXs.map((x, i) => (
        <SensorLight key={i} x={x} plc={plc} />
      ))}
      <OrbitControls enableDamping />
    </>
  );
}

export function Conveyor3D() {
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [items, setItems] = useState<InvItem[]>([]);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/labels").then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ]).then(([labelsRes, invRes]: [LabelRecord[], { items: InvItem[] }]) => {
      setLabels(labelsRes);
      setItems(invRes.items);
      setLoadedAt(new Date().toISOString());
    });
  }, []);

  const plc = useMemo(() => worstPlc(labels, items), [labels, items]);
  const cycleSec = LENGTH / SPEED;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white" style={{ height: 440 }}>
      <Canvas camera={{ position: [7, 5, 9], fov: 45 }}>
        <Scene labels={labels} plc={plc} />
      </Canvas>

      {/* HUD 오버레이 */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-xs shadow-soft backdrop-blur">
        <div className="flex items-center gap-1.5 font-semibold" style={{ color: plcColor(plc) }}>
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: plcColor(plc) }}
          />
          PLC 상태 · {plcLabel(plc)}
        </div>
        <div className="mt-1 text-slate-500">연동 라벨 {labels.length}건 (GET /api/labels)</div>
        <div className="text-slate-500">사이클 {cycleSec.toFixed(1)}초/바퀴</div>
        {loadedAt && <div className="mt-1 text-[10px] text-slate-400">데이터 수신 {loadedAt.slice(11, 19)} UTC</div>}
      </div>
    </div>
  );
}
