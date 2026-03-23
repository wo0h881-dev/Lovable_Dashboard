// src/components/shared/NovelDetailDrawer.tsx
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  Star,
  MessageCircle,
  BookOpen,
  Calendar,
  Zap,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Cell,
} from "recharts";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, type Novel } from "@/data/mockData";
import { computeNovelStats } from "@/lib/novelStats";

interface Props {
  novel: Novel | null;
  onClose: () => void;
  latestDate?: string;
  allNovels?: Novel[]; // ← 경쟁작 실데이터용
}

// ── 섹션 헤더 ────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
      <Icon size={13} />
      {label}
    </h3>
  );
}

// ── 통합 차트 커스텀 툴팁 ────────────────────────────────
function CombinedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="text-slate-400 font-mono mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span style={{ color: p.color }} className="font-mono font-semibold">
            {p.name === "rank"
              ? `순위 #${p.value}위`
              : `조회 ${Number(p.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NovelDetailDrawer({ novel, onClose, latestDate, allNovels = [] }: Props) {
  const stats = useMemo(
    () => (novel ? computeNovelStats(novel) : null),
    [novel],
  );

  // ── 통합 차트 데이터 ─────────────────────────────────
  const combinedChartData = useMemo(() => {
    if (!novel) return [];
    const rankMap = new Map(
      (novel.rankHistory || []).map((r) => [r.date, r.rank]),
    );
    const viewsMap = new Map(
      (novel.viewsHistory || []).map((v) => [v.date, v.views]),
    );
    const allDates = Array.from(
      new Set([...rankMap.keys(), ...viewsMap.keys()]),
    ).sort();
    return allDates.map((date) => ({
      date: date.slice(5),
      rank: rankMap.get(date) ?? null,
      views: viewsMap.get(date) ?? null,
    }));
  }, [novel]);

  // ── 경쟁작: allNovels 실데이터 사용 ──────────────────
  const competitors = useMemo(() => {
    if (!novel) return [];
    return allNovels
      .filter((n) => n.genre === novel.genre && n.id !== novel.id)
      .sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999))
      .slice(0, 4);
  }, [novel, allNovels]);

  const competitorBarData = useMemo(() => {
    if (!novel) return [];
    return [novel, ...competitors].map((n) => ({
      name: n.title.length > 8 ? n.title.slice(0, 8) + "…" : n.title,
      rank: n.todayRank ?? 0,
      views: n.todayViews,
      streak: n.consecutiveDays,
      isCurrent: n.id === novel.id,
    }));
  }, [novel, competitors]);

  // ── 타임라인: rankHistory 기반으로 첫진입/재진입 구분 ──
  const timelineEvents = useMemo(() => {
    if (!novel) return [];
    const events: { date: string; type: "in" | "out" | "peak"; label: string }[] = [];

    const sorted = [...(novel.rankHistory || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let prevRank: number | null | undefined = undefined;
    let isFirstEntry = true;

    for (const entry of sorted) {
      const curr = entry.rank;
      if (prevRank === undefined) {
        if (curr !== null) {
          events.push({ date: entry.date, type: "in", label: "첫 차트 진입" });
          isFirstEntry = false;
        }
      } else if (prevRank === null && curr !== null) {
        const label = isFirstEntry ? "첫 차트 진입" : "차트 재진입";
        events.push({ date: entry.date, type: "in", label });
        isFirstEntry = false;
      } else if (prevRank !== null && curr === null) {
        events.push({ date: entry.date, type: "out", label: "차트 이탈" });
      }
      prevRank = curr;
    }

    // 최고 순위 달성 이벤트
    if (stats?.bestRank) {
      const peakEntry = sorted.find((r) => r.rank === stats.bestRank);
      if (peakEntry) {
        events.push({
          date: peakEntry.date,
          type: "peak",
          label: `최고 순위 #${stats.bestRank}위 달성`,
        });
      }
    }

    // rankHistory 없을 때 fallback
    if (events.length === 0 && novel.firstAppeared) {
      events.push({ date: novel.firstAppeared, type: "in", label: "첫 차트 진입" });
    }

    return events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [novel, stats]);

  // PROMOTION 배지: 기다무/3다무, 이벤트배너 있을 때만
  const hasPromotion =
    !!novel?.promotion &&
    ((novel.promotion.timeFreeType &&
      novel.promotion.timeFreeType !== "none") ||
      (novel.promotion.eventBanners &&
        novel.promotion.eventBanners.length > 0));

  return (
    <AnimatePresence>
      {novel && stats && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-white/8 shadow-2xl bg-[#0f0f12] text-slate-200"
          >
            {/* ── 헤더 ─────────────────────────────────── */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-xs font-bold text-slate-400 tracking-wide">
                  작품 분석 리포트
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-7">

              {/* ── 커버 & 제목 ───────────────────────── */}
              <div className="flex gap-4">
                <NovelCover
                  novel={novel}
                  size="lg"
                  className="shadow-2xl shrink-0 ring-1 ring-white/10 rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  {hasPromotion && (
                    <span className="bg-red-500/15 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/25 mb-2 inline-flex items-center gap-1">
                      <Zap size={9} />
                      PROMOTION
                    </span>
                  )}
                  <h2 className="font-bold text-base leading-snug line-clamp-2 mb-1.5 text-white">
                    {novel.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span>{novel.author}</span>
                    <span className="opacity-30">·</span>
                    <span className="text-primary font-medium">{novel.genre}</span>
                    <span className="opacity-30">·</span>
                    <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                      <Star size={11} fill="currentColor" />
                      {novel.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <RankChange novel={novel} />
                    <span className="font-mono text-sm font-black text-white bg-white/8 px-2 py-0.5 rounded-md">
                      #{novel.todayRank}위
                    </span>
                  </div>
                </div>
              </div>

              {/* ── 핵심 지표 카드 4개 ─────────────────── */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: novel.platform === "ridi" ? "오늘 평가수" : "오늘 조회수",
                    value: formatViews(novel.platform, novel.todayViews),
                    icon: TrendingUp,
                    color: "text-emerald-400",
                    bg: "from-emerald-500/8",
                  },
                  {
                    label: "댓글 수",
                    value: Number(novel.commentCount || 0).toLocaleString(),
                    icon: MessageCircle,
                    color: "text-sky-400",
                    bg: "from-sky-500/8",
                  },
                  {
                    label: "총 회차",
                    value: `${novel.episodeCount}화`,
                    icon: BookOpen,
                    color: "text-violet-400",
                    bg: "from-violet-500/8",
                  },
                  {
                    label: "연속 차트인",
                    value: `${stats.currentStreakDays}일`,
                    icon: Calendar,
                    color: "text-orange-400",
                    bg: "from-orange-500/8",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`bg-gradient-to-br ${item.bg} to-transparent rounded-xl p-3.5 border border-white/5`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <item.icon size={11} className={item.color} />
                      <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                        {item.label}
                      </span>
                    </div>
                    <div className="font-mono text-base font-extrabold text-white">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 통합 차트: 순위(스카이블루 꺾은선) + 조회수(에메랄드 막대) ── */}
              {combinedChartData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SectionHeader icon={TrendingUp} label="순위 & 조회 추이" />
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <span className="w-4 h-0.5 bg-sky-400 inline-block rounded" />
                        순위
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-3 h-2.5 bg-emerald-400/40 inline-block rounded-sm border border-emerald-400/50" />
                        조회수
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={combinedChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: "#475569" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        {/* 왼쪽 Y축: 순위 (역방향, 스카이블루) */}
                        <YAxis
                          yAxisId="rank"
                          reversed
                          domain={[1, "auto"]}
                          tick={{ fontSize: 9, fill: "#38bdf8" }}
                          width={22}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}위`}
                        />
                        {/* 오른쪽 Y축: 조회수 (에메랄드) */}
                        <YAxis
                          yAxisId="views"
                          orientation="right"
                          tick={{ fontSize: 9, fill: "#34d399" }}
                          width={38}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) =>
                            v >= 100000000
                              ? `${(v / 100000000).toFixed(1)}억`
                              : v >= 10000
                              ? `${(v / 10000).toFixed(0)}만`
                              : String(v)
                          }
                        />
                        <Tooltip content={<CombinedTooltip />} />
                        {/* 조회수: 에메랄드 막대 */}
                        <Bar
                          yAxisId="views"
                          dataKey="views"
                          fill="#10b981"
                          fillOpacity={0.35}
                          stroke="#10b981"
                          strokeOpacity={0.5}
                          strokeWidth={1}
                          radius={[3, 3, 0, 0]}
                          name="views"
                        />
                        {/* 순위: 스카이블루 꺾은선 */}
                        <Line
                          yAxisId="rank"
                          type="monotone"
                          dataKey="rank"
                          stroke="#38bdf8"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#38bdf8", stroke: "#0f0f12", strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: "#38bdf8", stroke: "#0f0f12", strokeWidth: 2 }}
                          name="rank"
                          connectNulls
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── 프로모션/소식: 배너 느낌 디자인 + 공지 레이아웃 개선 ── */}
              {novel.promotion &&
                ((novel.promotion.eventBanners && novel.promotion.eventBanners.length > 0) ||
                  (novel.promotion.notices && novel.promotion.notices.length > 0)) && (
                  <div className="space-y-3">
                    <SectionHeader icon={Zap} label="프로모션 / 소식" />
                    <div className="rounded-xl overflow-hidden border border-white/8 space-y-px bg-white/[0.02]">

                      {/* 이벤트 배너: 왼쪽 강조바 + 풀 배너 스타일 */}
                      {novel.promotion.eventBanners && novel.promotion.eventBanners.length > 0 && (
                        <div className="space-y-px">
                          {novel.promotion.eventBanners.map((b, i) => (
                            <div
                              key={i}
                              className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent px-4 py-3 flex items-center gap-3"
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                              <Zap size={14} className="text-amber-400 shrink-0 ml-1" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-extrabold text-amber-300 leading-tight">
                                  {b.title}
                                </p>
                                {b.subtitle && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                                    {b.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 공지 리스트: 본문(body) 크게 위에, 태그+날짜 작게 아래 */}
                      {novel.promotion.notices && novel.promotion.notices.length > 0 && (
                        <div className="max-h-44 overflow-y-auto divide-y divide-white/5">
                          {novel.promotion.notices.map((notice, idx) => (
                            <div
                              key={idx}
                              className="px-4 py-3 hover:bg-white/[0.03] transition-colors"
                            >
                              {/* 본문/제목 크게 */}
                              <p className="text-xs font-bold text-slate-100 leading-snug">
                                {notice.body || notice.title}
                              </p>
                              {/* 태그 + 날짜 작게 */}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-semibold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                                  {notice.title}
                                </span>
                                {notice.date && (
                                  <span className="text-[10px] text-slate-600">
                                    {notice.date}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* ── 타임라인: rankHistory 기반 + 최고·최저 순위 4칸 요약 ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Calendar} label="차트 진입/이탈 타임라인" />
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      진입
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                      이탈
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      최고순위
                    </span>
                  </div>
                </div>

                {/* 요약 수치 4칸: 최고순위 + 최저순위 + 총차트인 + 연속진입 */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      label: "최고 순위",
                      value: stats.bestRank ? `#${stats.bestRank}위` : "-",
                      color: "text-amber-400",
                    },
                    {
                      label: "최저 순위",
                      value: stats.worstRank ? `#${stats.worstRank}위` : "-",
                      color: "text-slate-400",
                    },
                    {
                      label: "총 차트인",
                      value: `${stats.chartInCount}회`,
                      color: "text-primary",
                    },
                    {
                      label: "연속 진입",
                      value: `${stats.currentStreakDays}일`,
                      color: "text-emerald-400",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white/[0.03] rounded-lg p-2 border border-white/5 text-center"
                    >
                      <p className="text-[9px] text-slate-500 mb-1 leading-tight">{item.label}</p>
                      <p className={`font-mono text-xs font-extrabold ${item.color}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 타임라인 본체 */}
                <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                  {timelineEvents.length === 0 ? (
                    <div className="text-center text-[11px] text-slate-600 py-4">
                      타임라인 데이터가 없습니다
                    </div>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/8" />
                      <div className="space-y-4">
                        {timelineEvents.map((event, idx) => {
                          const dotColor =
                            event.type === "in"
                              ? "bg-emerald-400"
                              : event.type === "out"
                              ? "bg-rose-400"
                              : "bg-amber-400";
                          const Icon =
                            event.type === "in"
                              ? ArrowUp
                              : event.type === "out"
                              ? ArrowDown
                              : Star;
                          return (
                            <div key={idx} className="flex items-start gap-3 relative">
                              <div
                                className={`absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full ${dotColor} flex items-center justify-center ring-2 ring-[#0f0f12]`}
                              >
                                <Icon size={7} className="text-black" />
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-200">
                                  {event.label}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  {event.date}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {/* 현재 차트인 중 (pulse) */}
                        <div className="flex items-start gap-3 relative">
                          <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-[#0f0f12] animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary">
                              현재 #{novel.todayRank}위 차트인 중
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {latestDate || "오늘"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 경쟁작 비교 (allNovels 실데이터) ─────────── */}
              {competitors.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader icon={TrendingUp} label={`장르 경쟁작 비교 (${novel.genre})`} />

                  {/* 비교 표 */}
                  <div className="rounded-xl border border-white/8 overflow-hidden text-xs">
                    <div className="grid grid-cols-[1fr_44px_60px_44px] bg-white/[0.04] px-3 py-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wide border-b border-white/5">
                      <span>작품</span>
                      <span className="text-right">순위</span>
                      <span className="text-right">조회/평가</span>
                      <span className="text-right">연속</span>
                    </div>
                    <div className="grid grid-cols-[1fr_44px_60px_44px] px-3 py-2.5 bg-primary/8 border-b border-white/5 items-center">
                      <span className="font-bold text-white truncate pr-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 bg-primary rounded-full shrink-0" />
                        {novel.title.length > 10 ? novel.title.slice(0, 10) + "…" : novel.title}
                      </span>
                      <span className="text-right font-mono font-bold text-primary">#{novel.todayRank}</span>
                      <span className="text-right font-mono text-slate-200 text-[11px]">
                        {formatViews(novel.platform, novel.todayViews)}
                      </span>
                      <span className="text-right font-mono text-emerald-400 font-bold">
                        {novel.consecutiveDays}일
                      </span>
                    </div>
                    {competitors.map((c, idx) => (
                      <div
                        key={c.id}
                        className={`grid grid-cols-[1fr_44px_60px_44px] px-3 py-2.5 items-center ${
                          idx < competitors.length - 1 ? "border-b border-white/5" : ""
                        } hover:bg-white/[0.02] transition-colors`}
                      >
                        <span className="text-slate-300 truncate pr-2">
                          {c.title.length > 10 ? c.title.slice(0, 10) + "…" : c.title}
                        </span>
                        <span className="text-right font-mono text-slate-400">#{c.todayRank}</span>
                        <span className="text-right font-mono text-slate-400 text-[11px]">
                          {formatViews(c.platform, c.todayViews)}
                        </span>
                        <span className="text-right font-mono text-slate-500">{c.consecutiveDays}일</span>
                      </div>
                    ))}
                  </div>

                  {/* 순위 비교 막대 차트 */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">
                      순위 비교 (낮을수록 상위)
                    </p>
                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={competitorBarData} layout="vertical" margin={{ left: 4, right: 28 }}>
                          <XAxis type="number" reversed domain={[0, "auto"]} hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={72} />
                          <Tooltip contentStyle={{ background: "#1a1a1f", border: "none", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`#${v}위`, "순위"]} />
                          <Bar dataKey="rank" radius={[0, 3, 3, 0]}>
                            {competitorBarData.map((entry, index) => (
                              <Cell key={index} fill={entry.isCurrent ? "#38bdf8" : "#334155"} fillOpacity={entry.isCurrent ? 1 : 0.6} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 연속 차트인 비교 막대 차트 */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">
                      연속 차트인 일수 비교
                    </p>
                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={competitorBarData} layout="vertical" margin={{ left: 4, right: 28 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={72} />
                          <Tooltip contentStyle={{ background: "#1a1a1f", border: "none", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`${v}일`, "연속 차트인"]} />
                          <Bar dataKey="streak" radius={[0, 3, 3, 0]}>
                            {competitorBarData.map((entry, index) => (
                              <Cell key={index} fill={entry.isCurrent ? "#10b981" : "#334155"} fillOpacity={entry.isCurrent ? 1 : 0.6} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 푸터 ──────────────────────────────── */}
              <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 text-[10px] text-slate-600 flex justify-between border border-white/5">
                <span>데이터 수집: Google Apps Script</span>
                <span>업데이트: {latestDate || "-"}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
