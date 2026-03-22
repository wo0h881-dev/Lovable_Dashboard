import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  Star,
  MessageCircle,
  BookOpen,
  Calendar,
  ArrowRightLeft,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, type Novel } from "@/data/mockData";
import { computeNovelStats } from "@/lib/novelStats";
// KakaoPromotionBox는 안 쓰므로 import 제거해도 됨

interface Props {
  novel: Novel | null;
  onClose: () => void;
}

export function NovelDetailDrawer({ novel, onClose }: Props) {
  const stats = useMemo(
    () => (novel ? computeNovelStats(novel) : null),
    [novel],
  );

  const hasPromotion =
    !!novel?.promotion &&
    ((novel.promotion.timeFreeType &&
      novel.promotion.timeFreeType !== "none") ||
      (novel.promotion.notices &&
        novel.promotion.notices.length > 0) ||
      novel.promotion.eventTitle);

  const { rankData, viewsData } = useMemo(() => {
    if (!novel) return { rankData: [], viewsData: [] };

    const sortedRanks = [...(novel.rankHistory || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const sortedViews = [...(novel.viewsHistory || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return { rankData: sortedRanks, viewsData: sortedViews };
  }, [novel]);

  return (
    <AnimatePresence>
      {novel && stats && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-border shadow-2xl bg-[#121214] text-slate-200"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/5 bg-[#121214]/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-sm font-bold opacity-80">
                  작품 분석 리포트
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Cover & Title */}
              <div className="flex gap-4">
                <NovelCover
                  novel={novel}
                  size="lg"
                  className="shadow-2xl shrink-0 ring-1 ring-white/10"
                />
                <div className="flex-1 min-w-0">
                  {hasPromotion && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/30 mb-2 inline-flex items-center gap-1">
                      <Zap size={10} className="text-red-400" />
                      PROMOTION
                    </span>
                  )}

                  <h2 className="font-bold text-lg leading-tight line-clamp-2 mb-1 text-white">
                    {novel.title}
                  </h2>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{novel.author}</span>
                    <span className="opacity-30">·</span>
                    <span className="text-primary">{novel.genre}</span>
                    <span className="opacity-30">·</span>
                    <div className="flex items-center gap-0.5 text-yellow-400 font-bold">
                      <Star size={12} fill="currentColor" />
                      {novel.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <RankChange novel={novel} />
                    <span className="font-mono text-sm font-black text-white bg-white/5 px-2 py-0.5 rounded">
                      #{novel.todayRank}위
                    </span>
                  </div>
                </div>
              </div>

              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: "오늘 조회/평가",
                    value: formatViews(novel.platform, novel.todayViews),
                    icon: TrendingUp,
                    color: "text-emerald-400",
                  },
                  {
                    label: "댓글 수",
                    value: Number(
                      novel.commentCount || 0,
                    ).toLocaleString(),
                    icon: MessageCircle,
                    color: "text-sky-400",
                  },
                  {
                    label: "총 회차",
                    value: `${novel.episodeCount}화`,
                    icon: BookOpen,
                    color: "text-primary",
                  },
                  {
                    label: "연속 진입",
                    value: `${stats.currentStreakDays}일`,
                    icon: Calendar,
                    color: "text-orange-400",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/5 rounded-xl p-3 border border-white/5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon size={12} className={item.color} />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.label}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-200">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 순위 추이 */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={14} /> 순위 변동 추이
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rankData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#ffffff10"
                      />
                      <XAxis dataKey="date" hide />
                      <YAxis
                        reversed
                        domain={[1, "auto"]}
                        tick={{
                          fontSize: 10,
                          fill: "#64748b",
                        }}
                        width={20}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1e1e22",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#fff",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rank"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 조회/평가 추이 */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageCircle size={14} /> 누적{" "}
                  {novel.platform === "ridi" ? "평가수" : "조회수"} 추이
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#ffffff10"
                      />
                      <XAxis dataKey="date" hide />
                      <YAxis
                        tick={{
                          fontSize: 10,
                          fill: "#64748b",
                        }}
                        width={35}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) =>
                          v >= 10000
                            ? `${(v / 10000).toFixed(1)}만`
                            : v
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1e1e22",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => [
                          formatViews(novel.platform, value),
                          "누적 수치",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

   {/* 프로모션/소식 섹션 */}
{novel.promotion &&
  (novel.promotion.eventBanners?.length ||
    novel.promotion.notices?.length) && (
    <div className="space-y-2">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        <Zap size={14} /> 프로모션 / 소식
      </h3>
      <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-xs max-h-40 overflow-y-auto space-y-2">
        {/* 🔹 배너를 맨 위 한 줄 노란 강조 문구처럼 */}
        {novel.promotion.eventBanners &&
          novel.promotion.eventBanners.length > 0 && (
            <div className="border-b border-white/10 pb-2 mb-2">
              {novel.promotion.eventBanners.map((b, i) => (
                <div key={i} className="text-[11px]">
                  <span className="font-bold text-amber-300">
                    {b.title}
                  </span>
                  {b.subtitle && (
                    <span className="text-slate-300 ml-1">
                      · {b.subtitle}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

        {/* 🔹 안내 공지들 */}
        {novel.promotion.notices?.map((notice, idx) => (
          <div
            key={idx}
            className="border-b border-white/10 last:border-0 pb-2 last:pb-0"
          >
            {notice.date && (
              <div className="text-[10px] text-slate-500 mb-0.5">
                {notice.date}
              </div>
            )}
            <div className="font-semibold text-slate-100">
              {notice.title}
            </div>
            <div className="text-slate-400 text-[11px] line-clamp-2">
              {notice.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}


              {/* 차트인/아웃 기록 */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowRightLeft size={14} /> 차트 분석 기록
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-white/5">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">
                        역대 최고 순위
                      </p>
                      <p className="text-sm font-bold text-amber-400 font-mono">
                        #{stats.bestRank || novel.peakRank}위
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500">
                        역대 최저 순위
                      </p>
                      <p className="text-sm font-bold text-slate-400 font-mono">
                        #{stats.worstRank || "-"}위
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-500">첫 진입일</span>
                    <span className="text-slate-200 font-mono">
                      {stats.firstAppearDate || "기록 없음"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      총 차트인 횟수
                    </span>
                    <span className="text-primary font-bold">
                      {stats.chartInCount}회
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">
                      마지막 차트아웃
                    </span>
                    <span className="text-rose-400 font-mono">
                      {stats.lastChartOutDate || "현재 차트인"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white/5 rounded-lg p-3 text-[10px] text-slate-500 flex justify-between">
                <span>데이터 수집: Google Apps Script</span>
                <span>마지막 업데이트: {novel.date}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
