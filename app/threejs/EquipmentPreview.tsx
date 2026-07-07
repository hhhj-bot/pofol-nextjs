"use client";

import { masters, singlesOf, verifyMaster } from "../lib/labels";

// "입출고" 탭의 스텝별 결과 미리보기 (파이프라인 단계):
//   싱글 라벨(생산·프린터 부착) → 마스터(아우터박스) 포장 → 창고 픽업 →
//   컨베이어·배송 → 도착 검증(입고예정서) → 개봉·싱글별 고객사 배송
const STAGES = ["싱글", "마스터", "창고", "배송", "검증", "개봉"];

const MASTER = masters()[0];
const SINGLES = MASTER ? singlesOf(MASTER.labelCode) : [];
const N = SINGLES.length;

function Check({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="6" fill="#16a34a" />
      <path d={`M ${x - 2.6} ${y} l 1.8 2 l 3.4 -4`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function EquipmentPreview({ step }: { step: number }) {
  const active = step - 1;
  const verify = MASTER ? verifyMaster(MASTER.labelCode) : { ok: true, expected: N, actual: N };

  return (
    <svg viewBox="0 0 360 240" className="w-full rounded-xl border border-slate-200 bg-white">
      {/* 상단 단계 스트립 */}
      {STAGES.map((label, i) => {
        const on = i === active;
        const w = 54;
        const x = 8 + i * 58;
        return (
          <g key={label}>
            <rect x={x} y={12} width={w} height={22} rx={11} fill={on ? "#eff6ff" : "#f8fafc"} stroke={on ? "#93c5fd" : "#e2e8f0"} />
            <text x={x + w / 2} y={27} textAnchor="middle" fontSize="10" fontWeight={on ? 700 : 400} fill={on ? "#1d4ed8" : "#94a3b8"}>
              {label}
            </text>
            {i < STAGES.length - 1 && <line x1={x + w} y1={23} x2={x + w + 4} y2={23} stroke="#cbd5e1" strokeWidth="1.5" />}
          </g>
        );
      })}

      {/* 1. 생산 · 박스포장 · 라벨 프린터에서 싱글 라벨 출력·부착 */}
      {step === 1 && (
        <g>
          <text x={20} y={60} fontSize="10" fill="#94a3b8">생산 라인 →</text>

          {/* 라벨 프린터 */}
          <rect x={20} y={92} width={58} height={64} rx={6} fill="#334155" />
          <rect x={28} y={100} width={42} height={20} rx={2} fill="#0f172a" />
          <circle cx={31} cy={110} r="2" fill="#22c55e" />
          {/* 출력되는 라벨 */}
          <rect x={78} y={116} width={20} height={13} rx={2} fill="#0ea5e9" />
          <text x={49} y={172} textAnchor="middle" fontSize="10" fill="#64748b">라벨 프린터</text>

          {/* 박스포장된 제품 + 싱글 라벨 부착 */}
          {SINGLES.map((s, i) => {
            const bx = 138 + i * 70;
            return (
              <g key={s.labelCode}>
                {/* 라벨 배급(점선) */}
                <line x1={98} y1={122} x2={bx + 27} y2={120} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                {/* 제품 박스 */}
                <rect x={bx} y={118} width={54} height={46} rx={4} fill="#f1e3c8" stroke="#d6b784" />
                <path d={`M ${bx} 130 h 54`} stroke="#d6b784" strokeWidth="1" />
                {/* 부착된 싱글 라벨 */}
                <rect x={bx + 8} y={112} width={38} height={14} rx={2} fill="#0ea5e9" />
                <text x={bx + 27} y={122} textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="700">SINGLE</text>
                <text x={bx + 27} y={158} textAnchor="middle" fontSize="8" fill="#8a6d3b">{s.labelCode.replace("GTL-", "")}</text>
              </g>
            );
          })}
          <text x={210} y={186} textAnchor="middle" fontSize="10" fill="#64748b">박스포장 + 싱글 라벨 부착</text>

          <text x="180" y="212" textAnchor="middle" fontSize="11" fill="#475569">
            생산품을 박스포장하고, 라벨 프린터에서 싱글 라벨을 출력해 각 박스에 부착 ({N}박스)
          </text>
        </g>
      )}

      {/* 2. 마스터(아우터박스) 포장 */}
      {step === 2 && (
        <g>
          <rect x={96} y={92} width={168} height={82} rx={8} fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <rect x={112} y={82} width={90} height={14} rx={2} fill="#2563eb" />
          <text x={157} y={92} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">MASTER · {N}박스</text>
          {SINGLES.map((s, i) => (
            <rect key={s.labelCode} x={110 + i * 50} y={110} width={40} height={48} rx={3} fill="#0ea5e9" opacity="0.85" />
          ))}
          <text x="180" y="200" textAnchor="middle" fontSize="11" fill="#64748b">싱글 {N}개를 아우터박스에 담고 마스터 라벨 부착</text>
        </g>
      )}

      {/* 3. 창고 보관·픽업 */}
      {step === 3 && (
        <g>
          {[0, 1].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}-${c}`} x={40 + c * 56} y={96 + r * 40} width={50} height={34} rx={3} fill="#f1f5f9" stroke="#cbd5e1" />
            ))
          )}
          <rect x={96} y={96} width={50} height={34} rx={3} fill="#2563eb" />
          <text x={121} y={117} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">MSTR</text>
          <text x={230} y={116} fontSize="20" fill="#64748b">→</text>
          <rect x={252} y={100} width={40} height={30} rx={4} fill="#334155" />
          <text x="180" y="200" textAnchor="middle" fontSize="11" fill="#64748b">창고에 보관 후 마스터 단위로 픽업 (지게차)</text>
        </g>
      )}

      {/* 4. 컨베이어 이송 → 트럭 상차 → 배송 */}
      {step === 4 && (
        <g>
          {/* 컨베이어 벨트 (좌측) */}
          <rect x={16} y={150} width={172} height={12} rx={4} fill="#94a3b8" />
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx={30 + i * 38} cy={156} r="4" fill="#64748b" />
          ))}
          {/* 벨트 위 마스터가 트럭으로 이송 */}
          <rect x={70} y={124} width={48} height={26} rx={3} fill="#2563eb" />
          <text x={94} y={141} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">MASTER</text>
          <text x={128} y={142} fontSize="16" fill="#94a3b8">→</text>
          <text x={152} y={116} fontSize="9" fill="#64748b">상차</text>

          {/* 트럭 (캡이 오른쪽) */}
          <rect x={196} y={100} width={100} height={58} rx={4} fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <rect x={206} y={122} width={38} height={30} rx={2} fill="#2563eb" opacity="0.9" />
          <rect x={250} y={122} width={38} height={30} rx={2} fill="#2563eb" opacity="0.5" />
          <path d="M 296 122 h 22 a 6 6 0 0 1 6 6 v 30 h -28 z" fill="#2563eb" />
          <rect x={300} y={126} width={16} height={12} rx={2} fill="#bfdbfe" />
          <circle cx={224} cy={162} r="10" fill="#334155" />
          <circle cx={224} cy={162} r="4" fill="#94a3b8" />
          <circle cx={272} cy={162} r="10" fill="#334155" />
          <circle cx={272} cy={162} r="4" fill="#94a3b8" />
          <circle cx={312} cy={162} r="10" fill="#334155" />
          <circle cx={312} cy={162} r="4" fill="#94a3b8" />

          <text x="180" y="212" textAnchor="middle" fontSize="11" fill="#475569">
            마스터를 컨베이어로 이송해 트럭에 상차 → 도착지 허브({MASTER?.destination})로 배송
          </text>
        </g>
      )}

      {/* 5. 도착지 검증: PDA로 마스터 라벨 ↔ 송장 라벨 대조 */}
      {step === 5 && (
        <g>
          {/* 마스터 박스 + 라벨(바코드) */}
          <rect x={14} y={104} width={64} height={56} rx={5} fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <rect x={20} y={110} width={52} height={22} rx={2} fill="#fff" stroke="#94a3b8" />
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={24 + i * 5} y={113} width={i % 3 === 0 ? 2.4 : 1.2} height={12} fill="#0f172a" />
          ))}
          <text x={46} y={150} textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="700">MASTER</text>

          {/* 송장(거래명세서) + 라벨(바코드) */}
          <rect x={280} y={92} width={68} height={80} rx={4} fill="#fff" stroke="#cbd5e1" />
          <text x={314} y={106} textAnchor="middle" fontSize="9" fill="#334155" fontWeight="700">송장</text>
          <rect x={288} y={112} width={52} height={20} rx={2} fill="#fff" stroke="#94a3b8" />
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={292 + i * 5} y={115} width={i % 3 === 1 ? 2.4 : 1.2} height={11} fill="#0f172a" />
          ))}
          <line x1={286} y1={144} x2={342} y2={144} stroke="#e2e8f0" strokeWidth="2" />
          <line x1={286} y1={152} x2={342} y2={152} stroke="#e2e8f0" strokeWidth="2" />
          <line x1={286} y1={160} x2={330} y2={160} stroke="#e2e8f0" strokeWidth="2" />

          {/* PDA 스캐너 */}
          <rect x={150} y={98} width={46} height={74} rx={6} fill="#334155" />
          <rect x={156} y={106} width={34} height={26} rx={2} fill="#0f172a" />
          <text x={173} y={122} textAnchor="middle" fontSize="8" fill="#22c55e" fontWeight="700">MATCH</text>
          <rect x={166} y={158} width={14} height={6} rx={1} fill="#0ea5e9" />

          {/* 스캔 빔 (양쪽 라벨로) */}
          <line x1={150} y1={122} x2={72} y2={121} stroke="#ef4444" strokeWidth="1.4" strokeDasharray="4 3" />
          <line x1={196} y1={122} x2={288} y2={122} stroke="#ef4444" strokeWidth="1.4" strokeDasharray="4 3" />

          <text x="180" y="200" textAnchor="middle" fontSize="11" fill="#475569">
            PDA로 마스터 라벨과 송장(거래명세서) 라벨을 스캔·대조
          </text>
          <text x="180" y="216" textAnchor="middle" fontSize="10" fill="#64748b">
            라벨 일치 · 수량 {verify.actual}/{verify.expected} 확인
          </text>
        </g>
      )}

      {/* 6. 개봉 → 싱글 검수 → 싱글별 각 고객사 배송 */}
      {step === 6 && (
        <g>
          {/* 개봉된 마스터 */}
          <rect x={24} y={108} width={80} height={56} rx={6} fill="#eff6ff" stroke="#93c5fd" />
          <rect x={22} y={98} width={84} height={12} rx={2} fill="#93c5fd" opacity="0.55" transform="rotate(-10 22 104)" />
          <text x={64} y={176} textAnchor="middle" fontSize="9" fill="#64748b">개봉</text>

          {SINGLES.map((s, i) => {
            const y = 96 + i * 34;
            return (
              <g key={s.labelCode}>
                <rect x={132} y={y} width={30} height={24} rx={3} fill="#0ea5e9" />
                <Check x={160} y={y} />
                <text x={172} y={y + 16} fontSize="14" fill="#94a3b8">→</text>
                <rect x={190} y={y - 2} width={140} height={28} rx={6} fill="#dcfce7" stroke="#16a34a" />
                <text x={202} y={y + 16} fontSize="10" fill="#166534" fontWeight="600">{s.customer}</text>
              </g>
            );
          })}
          <text x="180" y="214" textAnchor="middle" fontSize="11" fill="#475569">
            아우터박스 개봉 → 싱글 검수 → 싱글마다 각 고객사로 개별 배송
          </text>
        </g>
      )}
    </svg>
  );
}
