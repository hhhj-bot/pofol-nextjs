import type { Config } from "tailwindcss";

/**
 * Tailwind 설정 — "라이트/브라이트" 디자인 시스템.
 * 기존 mfg 포트폴리오(딥 네이비 #1F4E79)와 의도적으로 톤을 분리:
 * 화이트 여백을 넓게 쓰고, 브라이트 블루(brand) + 스카이(accent) 그라데이션을 액센트로.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 밝은 블루 스케일 — 메인 브랜드 컬러
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        // 스카이/시안 — 그라데이션 보조 액센트
        accent: {
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        // 밝은 톤에 맞춘 은은한 그림자
        soft: "0 1px 3px rgba(15,23,42,.05), 0 8px 24px rgba(37,99,235,.06)",
        lift: "0 14px 34px rgba(37,99,235,.16)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#2563eb 0%,#0ea5e9 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
