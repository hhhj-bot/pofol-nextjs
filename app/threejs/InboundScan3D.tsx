"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// 입고 검증 3D — 마스터(M1)를 PDA로 스캔·검증하고, 개봉해 안의 싱글(S1/S2/S3)을
// 하나씩 스캔·검수한다. 오른쪽 WMS/PDA 위젯이 스캔 진행 상태와 최종 배송지를 보여준다.
// 데이터: GTL-MSTR-0001(M1) = 싱글 3개.

const MASTER = { code: "M1", full: "GTL-MSTR-0001", dest: "아산 허브", boxes: 3 };
const SGL = [
  { key: "S1", x: -0.75, customer: "현대트랜시스" },
  { key: "S2", x: 0, customer: "유라코퍼레이션" },
  { key: "S3", x: 0.75, customer: "동희오토" },
];

// 타임라인(초)
const T_MASTER = 1.6;
const T_OPEN = 2.9;
const T_S0 = 3.1;
const T_STEP = 0.95;
const T_HOLD = T_S0 + 3 * T_STEP + 1.8;

type Status = { master: boolean; singles: boolean[]; active: string | null };

// 정면 라벨(흰 배경 + 테두리 + 검은 글자) — 배송 라벨 스티커 느낌
function labelTexture(text: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 112, 112);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 62px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

function applyStatus(mat: THREE.MeshStandardMaterial | null, scanning: boolean, done: boolean, t: number) {
  if (!mat) return;
  if (scanning) {
    mat.emissive.set("#dc2626");
    mat.emissiveIntensity = 0.35 + 0.35 * Math.abs(Math.sin(t * 9));
  } else if (done) {
    mat.emissive.set("#16a34a");
    mat.emissiveIntensity = 0.55;
  } else {
    mat.emissiveIntensity = Math.max(0, mat.emissiveIntensity - 0.05);
  }
}

function Scene({ onStatus }: { onStatus: (s: Status) => void }) {
  const textures = useMemo<Record<string, THREE.CanvasTexture>>(
    () => ({
      M1: labelTexture("M1"),
      S1: labelTexture("S1"),
      S2: labelTexture("S2"),
      S3: labelTexture("S3"),
    }),
    []
  );

  const masterMat = useRef<THREE.MeshStandardMaterial>(null);
  const lidRef = useRef<THREE.Group>(null);
  const singleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const singleMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const pdaRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const lastRef = useRef<string>("");
  const target = useMemo(() => new THREE.Vector3(0.4, 1.5, 1.2), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    timeRef.current += dt;
    if (timeRef.current > T_HOLD) timeRef.current = 0;
    const t = timeRef.current;

    // 마스터
    applyStatus(masterMat.current, t < T_MASTER, t >= T_MASTER, t);

    // 개봉(뚜껑)
    const open = lerp(0, 1, (t - T_MASTER) / (T_OPEN - T_MASTER));
    if (lidRef.current) {
      lidRef.current.position.set(lerp(0, -0.5, open), lerp(0.98, 1.95, open), lerp(0, -1.5, open));
      lidRef.current.rotation.x = lerp(0, -0.65, open);
    }

    // 싱글: 개봉되면 앞줄(+z)로 올라와 정렬
    const singleDone: boolean[] = [];
    SGL.forEach((s, i) => {
      const m = singleRefs.current[i];
      if (m) {
        m.position.set(lerp(s.x * 0.35, s.x, open), lerp(0.4, 0.35, open), lerp(0, 1.85, open));
        const sc = lerp(0.02, 1, open);
        m.scale.set(sc, sc, sc);
      }
      const startAt = T_S0 + i * T_STEP;
      const doneAt = T_S0 + (i + 1) * T_STEP;
      applyStatus(singleMats.current[i], t >= startAt && t < doneAt, t >= doneAt, t);
      singleDone.push(t >= doneAt);
    });

    // PDA 이동
    let active: string | null = null;
    if (t < T_MASTER) active = "master";
    if (t < T_OPEN) {
      target.set(0.4, 1.5, 1.2);
    } else {
      const idx = Math.min(2, Math.max(0, Math.floor((t - T_S0) / T_STEP)));
      target.set(SGL[idx].x + 0.45, 1.0, 2.3);
      if (t >= T_S0 && t < T_S0 + 3 * T_STEP) active = SGL[idx].key;
    }
    if (pdaRef.current) {
      pdaRef.current.position.lerp(target, 0.12);
      pdaRef.current.position.y += Math.sin(t * 6) * 0.01;
    }

    // 상태가 바뀔 때만 위젯에 통지
    const status: Status = { master: t >= T_MASTER, singles: singleDone, active };
    const key = JSON.stringify(status);
    if (key !== lastRef.current) {
      lastRef.current = key;
      onStatus(status);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 12, 8]} intensity={0.8} />

      {/* 작업대 */}
      <mesh position={[0, -0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>

      {/* 마스터 본체 (정면에 M1 라벨) + 뚜껑 */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.3, 0.9, 1.3]} />
        <meshStandardMaterial ref={masterMat} color="#c8a15a" emissive="#000000" emissiveIntensity={0} />
        <mesh position={[0, 0, 0.66]}>
          <planeGeometry args={[0.95, 0.62]} />
          <meshBasicMaterial map={textures.M1} toneMapped={false} />
        </mesh>
      </mesh>
      <group ref={lidRef} position={[0, 0.98, 0]}>
        <mesh>
          <boxGeometry args={[1.36, 0.14, 1.36]} />
          <meshStandardMaterial color="#b98a4a" />
        </mesh>
      </group>

      {/* 싱글 3개 (정면에 S1/S2/S3 라벨) */}
      {SGL.map((s, i) => (
        <mesh
          key={s.key}
          ref={(el) => { singleRefs.current[i] = el; }}
          position={[s.x * 0.35, 0.4, 0]}
          scale={[0.02, 0.02, 0.02]}
        >
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            ref={(el) => { singleMats.current[i] = el as THREE.MeshStandardMaterial; }}
            color="#93c5fd"
            emissive="#000000"
            emissiveIntensity={0}
          />
          <mesh position={[0, 0, 0.26]}>
            <planeGeometry args={[0.4, 0.4]} />
            <meshBasicMaterial map={textures[s.key]} toneMapped={false} />
          </mesh>
        </mesh>
      ))}

      {/* PDA 스캐너 */}
      <group ref={pdaRef} position={[0.4, 1.5, 1.2]}>
        <mesh>
          <boxGeometry args={[0.34, 0.5, 0.16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -0.33, 0]}>
          <boxGeometry args={[0.22, 0.18, 0.12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, -0.46, 0.02]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
        </mesh>
      </group>

      <OrbitControls enableDamping />
    </group>
  );
}

// 스캔 상태 배지
function Badge({ done, active }: { done: boolean; active: boolean }) {
  if (done) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">스캔완료</span>;
  if (active) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">스캔 중…</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">대기</span>;
}

export function InboundScan3D() {
  const [st, setSt] = useState<Status>({ master: false, singles: [false, false, false], active: null });
  const doneCount = (st.master ? 1 : 0) + st.singles.filter(Boolean).length;
  const allDone = doneCount === 4;

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {/* 3D */}
      <div className="min-w-0 md:flex-1">
        <div style={{ height: 440 }} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Canvas camera={{ position: [2.4, 2.9, 5.6], fov: 45 }}>
            <Scene onStatus={(s) => setSt(s)} />
          </Canvas>
        </div>
      </div>

      {/* WMS / PDA 연동 위젯 */}
      <aside className="shrink-0 md:w-72">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
            <span>WMS · 입고 검증 (PDA)</span>
            <span className={"rounded px-1.5 py-0.5 text-[10px] " + (allDone ? "bg-green-500" : "bg-amber-500")}>
              {allDone ? "검증 완료" : "진행 중"}
            </span>
          </div>

          <div className="space-y-3 p-3 text-sm">
            {/* 입고예정 마스터 */}
            <div className="rounded-lg border border-slate-200 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">입고예정 · 마스터</span>
                <Badge done={st.master} active={st.active === "master"} />
              </div>
              <div className="font-semibold text-slate-900">
                {MASTER.code} <span className="text-xs font-normal text-slate-400">{MASTER.full}</span>
              </div>
              <div className="text-xs text-slate-500">목적지 {MASTER.dest} · {MASTER.boxes}박스</div>
            </div>

            {/* 포함 싱글 · 최종 배송지 */}
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-500">포함 싱글 · 최종 배송지</div>
              <ul className="space-y-1.5">
                {SGL.map((s, i) => (
                  <li key={s.key} className="flex items-center justify-between rounded-lg border border-slate-100 px-2 py-1.5">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800">{s.key}</span>
                      <span className="ml-1.5 text-xs text-slate-500">{s.customer}</span>
                    </div>
                    <Badge done={st.singles[i]} active={st.active === s.key} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-2 text-xs text-slate-500">
              스캔 <span className="font-bold text-slate-700">{doneCount}</span> / 4 항목
              {allDone && <span className="ml-1 text-green-600">· 마스터+싱글 전량 일치</span>}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
