// src/components/shared/LoadingScreen.tsx
import { motion } from "framer-motion";

const BOOK_EMOJIS = ["📚", "✨", "📖", "🏆", "⭐", "💫", "📊", "🎯"];
const MESSAGES = [
  "순위 데이터 분석 중...",
  "오늘의 트렌드 수집 중...",
  "플랫폼 데이터 취합 중...",
  "랭킹 계산 중...",
];

interface Props {
  message?: string;
}

export function LoadingScreen({ message }: Props) {
  const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* 배경 장식 - 떠다니는 이모지들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {BOOK_EMOJIS.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl select-none opacity-10"
            style={{
              left: `${10 + (i * 11) % 80}%`,
              top: `${10 + (i * 17) % 75}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [-5, 5, -5],
              opacity: [0.06, 0.15, 0.06],
            }}
            transition={{
              duration: 2.5 + i * 0.4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* 메인 로딩 콘텐츠 */}
      <div className="relative flex flex-col items-center gap-6">

        {/* 책 스택 애니메이션 */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* 원형 트랙 */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
            <motion.circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="213.6"
              animate={{ strokeDashoffset: [213.6, 0, 213.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
          {/* 중앙 이모지 */}
          <motion.span
            className="text-3xl relative z-10"
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, -8, 8, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            📚
          </motion.span>
        </div>

        {/* 로고 텍스트 */}
        <div className="text-center">
          <motion.h1
            className="text-lg font-black tracking-tight text-foreground"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            웹소설 PD 대시보드
          </motion.h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {message || randomMsg}
          </p>
        </div>

        {/* 점 3개 로딩 인디케이터 */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        {/* 플랫폼 뱃지들 */}
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          {[
            { label: "네이버", color: "bg-naver text-black" },
            { label: "카카오", color: "bg-kakao text-black" },
            { label: "리디", color: "bg-ridi text-white" },
          ].map((p) => (
            <span key={p.label} className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.color}`}>
              {p.label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
