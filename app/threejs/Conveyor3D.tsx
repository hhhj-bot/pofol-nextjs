"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// 컨베이어 위를 마스터(아우터박스)가 이동하며,
//  1) RFID 게이트를 통과할 때 "인식"되어 회색(?)에서 목적지 색·글자(A/B/C)로 바뀌고
//  2) 목적지 슈트 앞에서 디버터(푸셔)가 밀어내 옆 슈트로 분기되는 모습을 보여준다.

const HALF = 4;            // 벨트 x: -4 ~ 4
const GATE_X = -2.2;       // RFID 게이트 위치
const CHUTE: Record<string, number> = { A: 0, B: 1.6, C: 3.2 };
const DEST = ["A", "B", "C"] as const;
const COLOR: Record<string, string> = { A: "#2563eb", B: "#16a34a", C: "#d97706", "?": "#94a3b8" };
const SPEED = 1.1;

// 캔버스로 글자 텍스처(색 배경 + 흰 글자)를 만든다 — 폰트 로딩 없이 자체 렌더
function labelTexture(letter: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 88px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 64, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

type BoxState = { dest: string; x: number; z: number; recognized: boolean; diverting: boolean };

function Scene() {
  const N = 6;
  const boxes = useMemo<BoxState[]>(
    () =>
      Array.from({ length: N }, (_, i) => ({
        dest: DEST[i % 3],
        x: -HALF - i * 1.5,
        z: 0,
        recognized: false,
        diverting: false,
      })),
    []
  );
  const st = useRef<BoxState[]>(boxes.map((b) => ({ ...b })));

  const textures = useMemo<Record<string, THREE.CanvasTexture>>(
    () => ({
      "?": labelTexture("?", COLOR["?"]),
      A: labelTexture("A", COLOR.A),
      B: labelTexture("B", COLOR.B),
      C: labelTexture("C", COLOR.C),
    }),
    []
  );
  const mats = useMemo(
    () => st.current.map(() => new THREE.MeshStandardMaterial({ map: textures["?"] })),
    [textures]
  );

  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const paddleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const gateMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    let gateGlow = 0;
    const paddleActive: Record<string, boolean> = { A: false, B: false, C: false };

    st.current.forEach((b, i) => {
      if (b.diverting) {
        b.z += dt * 1.6; // 슈트 쪽(+z)으로 밀려남
        paddleActive[b.dest] = b.z < 1.2;
        if (b.z > 1.9) {
          // 재투입: 가장 왼쪽 뒤로 보내고 다시 미인식 상태
          const minX = Math.min(...st.current.map((o) => o.x));
          b.x = minX - 1.5;
          b.z = 0;
          b.recognized = false;
          b.diverting = false;
          mats[i].map = textures["?"];
          mats[i].needsUpdate = true;
        }
      } else {
        b.x += dt * SPEED;
        if (!b.recognized && b.x >= GATE_X) {
          b.recognized = true; // RFID 인식 순간 → 색·글자 부여
          mats[i].map = textures[b.dest];
          mats[i].needsUpdate = true;
        }
        if (b.recognized && b.x >= CHUTE[b.dest]) b.diverting = true;
      }
      if (Math.abs(b.x - GATE_X) < 0.3 && !b.recognized) gateGlow = 1;

      const m = meshRefs.current[i];
      if (m) m.position.set(b.x, 0.7, b.z);
    });

    if (gateMat.current) {
      const cur = gateMat.current.emissiveIntensity;
      gateMat.current.emissiveIntensity = cur + (gateGlow * 1.4 + 0.15 - cur) * 0.25;
    }
    DEST.forEach((d, i) => {
      const p = paddleRefs.current[i];
      if (p) {
        const target = paddleActive[d] ? -0.05 : -0.75;
        p.position.z = p.position.z + (target - p.position.z) * 0.3;
      }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 12, 6]} intensity={0.85} />

      {/* 벨트 */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[HALF * 2, 0.15, 1.2]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      {/* 롤러 */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[-HALF + i * (HALF * 2) / 8, 0.22, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 1.3, 16]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}

      {/* RFID 게이트 (인식 시 발광) */}
      <group position={[GATE_X, 0, 0]}>
        <mesh position={[0, 0.9, 0.75]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.9, -0.75]}>
          <boxGeometry args={[0.12, 1.4, 0.12]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.14, 0.14, 1.62]} />
          <meshStandardMaterial ref={gateMat} color="#1e293b" emissive="#2563eb" emissiveIntensity={0.15} />
        </mesh>
      </group>

      {/* 슈트(빈) + 디버터 */}
      {DEST.map((d, i) => (
        <group key={d}>
          {/* 슈트 빈 (+z 쪽) */}
          <mesh position={[CHUTE[d], 0.35, 1.9]}>
            <boxGeometry args={[1, 0.7, 0.9]} />
            <meshStandardMaterial color={COLOR[d]} transparent opacity={0.35} />
          </mesh>
          <mesh position={[CHUTE[d], 0.72, 1.9]}>
            <boxGeometry args={[0.8, 0.02, 0.8]} />
            <meshStandardMaterial map={textures[d]} />
          </mesh>
          {/* 디버터 푸셔 (-z 쪽에서 밀어냄) */}
          <mesh ref={(el) => { paddleRefs.current[i] = el; }} position={[CHUTE[d], 0.6, -0.75]}>
            <boxGeometry args={[0.5, 0.5, 0.25]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      ))}

      {/* 마스터 박스 (A/B/C, 인식 전엔 회색 ?) */}
      {st.current.map((b, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el; }} material={mats[i]} position={[b.x, 0.7, b.z]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
        </mesh>
      ))}

      <OrbitControls enableDamping />
    </group>
  );
}

export function Conveyor3D() {
  return (
    <div style={{ height: 440 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Canvas camera={{ position: [4.5, 5.5, 8.5], fov: 45 }}>
        <Scene />
      </Canvas>
    </div>
  );
}
