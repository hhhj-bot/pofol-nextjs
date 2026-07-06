"use client";

// "설비 연동" 탭의 스텝별 결과 미리보기.
// 컨베이어 위에서 GTL 라벨(박스)이 이동하고, IoT 센서/PLC 신호가 창고 재고 상태에 반응한다.
// (스텝 1: 컨베이어 프레임 / 2: 라벨 박스 이동 / 3: IoT 센서·PLC 신호 / 4: 처리량 HUD)

export type PlcState = "RUN" | "WARN" | "ALARM";

export function plcColor(state: PlcState) {
  if (state === "RUN") return "#16a34a"; // 가동중
  if (state === "WARN") return "#d97706"; // 주의
  return "#dc2626"; // 알람
}

export function plcLabel(state: PlcState) {
  if (state === "RUN") return "가동중";
  if (state === "WARN") return "주의";
  return "알람";
}

// 창고 재고 상태(WMS) -> 설비 PLC 상태로 매핑. 재고 이상이 설비 알람으로 이어지는 흐름을 보여준다.
export function statusToPlc(status: string): PlcState {
  if (status === "이상") return "ALARM";
  if (status === "부족") return "WARN";
  return "RUN";
}

type MockBox = { code: string; type: "MASTER" | "SINGLE"; x: number; plc: PlcState };

const MOCK_BOXES: MockBox[] = [
  { code: "GTL-MSTR-0001", type: "MASTER", x: 40, plc: "RUN" },
  { code: "GTL-SGL-0002", type: "SINGLE", x: 140, plc: "RUN" },
  { code: "GTL-SGL-0003", type: "SINGLE", x: 230, plc: "WARN" },
  { code: "GTL-MSTR-0002", type: "MASTER", x: 300, plc: "ALARM" },
];

const BELT_Y = 140;
const BELT_X1 = 20;
const BELT_X2 = 320;

export function EquipmentPreview({ step }: { step: number }) {
  const showBoxes = step >= 2;
  const showSensors = step >= 3;
  const showHud = step >= 4;

  const throughput = MOCK_BOXES.length;
  const worst: PlcState = MOCK_BOXES.some((b) => b.plc === "ALARM")
    ? "ALARM"
    : MOCK_BOXES.some((b) => b.plc === "WARN")
      ? "WARN"
      : "RUN";

  return (
    <svg viewBox="0 0 340 240" className="w-full rounded-xl border border-slate-200 bg-white">
      {/* 바닥 */}
      <rect x="10" y="18" width="320" height="206" rx="8" fill="#f1f5f9" stroke="#e2e8f0" />

      {/* 컨베이어 벨트 + 롤러 */}
      <rect x={BELT_X1} y={BELT_Y - 8} width={BELT_X2 - BELT_X1} height="16" rx="4" fill="#94a3b8" />
      {Array.from({ length: 9 }).map((_, i) => (
        <circle key={i} cx={BELT_X1 + 10 + i * 35} cy={BELT_Y} r="5" fill="#64748b" />
      ))}
      {/* 공정 투입 게이트 */}
      <rect x={BELT_X2 - 4} y={BELT_Y - 34} width="10" height="60" fill="#334155" />
      <text x={BELT_X2 + 4} y={BELT_Y - 40} fontSize="10" className="fill-slate-500">
        공정 투입
      </text>

      {!showBoxes && (
        <text x="170" y="70" textAnchor="middle" fontSize="12" className="fill-slate-400">
          컨베이어 프레임만 · 아직 이동하는 박스 없음
        </text>
      )}

      {/* 라벨 박스 (이동 스냅샷) */}
      {showBoxes &&
        MOCK_BOXES.map((b) => {
          const w = b.type === "MASTER" ? 34 : 22;
          const color = b.type === "MASTER" ? "#2563eb" : "#0ea5e9";
          return (
            <g key={b.code}>
              <rect x={b.x - w / 2} y={BELT_Y - 26} width={w} height="18" rx="3" fill={color} />
              <text x={b.x} y={BELT_Y - 30} textAnchor="middle" fontSize="8" className="fill-slate-500">
                {b.code.replace("GTL-", "")}
              </text>
              {/* 진행 방향 화살표 */}
              <text x={b.x + w / 2 + 6} y={BELT_Y - 15} fontSize="10" className="fill-slate-400">
                →
              </text>
            </g>
          );
        })}

      {/* IoT 센서 / PLC 신호등 */}
      {showSensors &&
        MOCK_BOXES.map((b, i) => (
          <g key={`sensor-${i}`}>
            <circle cx={b.x} cy={BELT_Y + 22} r="6" fill={plcColor(b.plc)} opacity={b.plc === "RUN" ? 0.9 : 1} />
            {b.plc !== "RUN" && (
              <circle cx={b.x} cy={BELT_Y + 22} r="9" fill="none" stroke={plcColor(b.plc)} strokeWidth="1.5" opacity="0.5" />
            )}
          </g>
        ))}

      {/* 처리량 / PLC 상태 HUD */}
      {showHud && (
        <g>
          <rect x="182" y="26" width="146" height="66" rx="8" fill="#ffffff" opacity="0.94" stroke="#bfdbfe" />
          <text x="192" y="44" fontSize="11" className="fill-slate-500">
            PLC 상태 · <tspan fontWeight="700" fill={plcColor(worst)}>{plcLabel(worst)}</tspan>
          </text>
          <text x="192" y="62" fontSize="11" className="fill-slate-500">
            누적 처리량 {throughput}개
          </text>
          <text x="192" y="80" fontSize="11" className="fill-slate-500">
            센서 {MOCK_BOXES.length}개 연동
          </text>
        </g>
      )}
    </svg>
  );
}
