import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  Star,
  MessageCircle,
  BookOpen,
  Calendar,
  Zap,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Clock,
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
  allNovels?: Novel[];
  onSelectNovel?: (novel: Novel) => void;
}

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
      <Icon size={13} />
      {label}
    </h3>
  );
}

function TruncatedTitle({
  title,
  maxLen,
  className = "",
}: {
  title: string;
  maxLen: number;
  className?: string;
}) {
  const isTruncated = title.length > maxLen;
  return (
    <span
      className={className}
      title={isTruncated ? title : undefined}
      style={{ cursor: isTruncated ? "help" : undefined }}
    >
      {isTruncated ? `${title.slice(0, maxLen)}…` : title}
    </span>
  );
}

function CombinedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2.5 text-xs shadow-xl space-y-1">
      <p className="text-muted-foreground font-mono mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color }}
          />
          <span
            style={{ color: p.color }}
            className="font-mono font-semibold"
          >
            {p.name === "rank"
              ? `순위 #${p.value}위`
              : `조회 ${Number(p.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function parseViewStr(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;

  const s = String(v).trim();
  if (!s || s === "-") return null;

  const regex = /([\d.,]+)\s*억|([\d.,]+)\s*만/g;
  let total = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += parseFloat(m[1].replace(/,/g, "")) * 100_000_000;
    if (m[2]) total += parseFloat(m[2].replace(/,/g, "")) * 10_000;
  }

  if (total > 0) return total;
  if (s.endsWith("억")) return parseFloat(s.replace("억", "")) * 100_000_000;
  if (s.endsWith("만")) return parseFloat(s.replace("만", "")) * 10_000;

  return parseFloat(s.replace(/,/g, "")) || null;
}

export function NovelDetailDrawer({
  novel,
  onClose,
  latestDate,
  allNovels = [],
  onSelectNovel,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stats = useMemo(() => (novel ? computeNovelStats(novel) : null), [novel]);

  const dedupedRankHistory = useMemo(() => {
    if (!novel?.rankHistory) return [];

    const seen = new Map<string, number | null>();
    for (const r of novel.rankHistory) {
      if (!seen.has(r.date) || (seen.get(r.date) === null && r.rank !== null)) {
        seen.set(r.date, r.rank);
      }
    }

    return Array.from(seen.entries())
      .map(([date, rank]) => ({ date, rank }))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [novel]);

  const combinedChartData = useMemo(() => {
    if (!novel) return [];

    const rankMap = new Map(dedupedRankHistory.map((r) => [r.date, r.rank]));
    const viewsMap = new Map(
      (novel.viewsHistory || []).map((v) => [v.date, v.views]),
    );

    const allDates = Array.from(
      new Set([...rankMap.keys(), ...viewsMap.keys()]),
    ).sort();

    return allDates.map((date) => ({
      date: date.slice(5),
      rank: rankMap.get(date) ?? null,
      views: parseViewStr(viewsMap.get(date) as string | number | null),
    }));
  }, [novel, dedupedRankHistory]);

  const viewsDomain = useMemo(() => {
    const vals = combinedChartData
      .map((d) => d.views)
      .filter((v): v is number => v !== null && v > 0);

    if (vals.length === 0) return ["auto", "auto"] as const;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const padding = (max - min) * 0.05 || max * 0.02;

    return [
      Math.max(0, Math.floor(min - padding)),
      Math.ceil(max + padding),
    ] as [number, number];
  }, [combinedChartData]);

  const rankAxisWidth = useMemo(() => {
    const maxRank = Math.max(
      ...dedupedRankHistory
        .map((r) => r.rank ?? 0)
        .filter((r) => r > 0),
      0,
    );

    if (maxRank >= 100) return 36;
    if (maxRank >= 10) return 30;
    return 24;
  }, [dedupedRankHistory]);

  const competitors = useMemo(() => {
    if (!novel) return [];
    return allNovels
      .filter((n) => n.genre === novel.genre && n.id !== novel.id)
      .sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999))
      .slice(0, 4);
  }, [novel, allNovels]);

  const timelineEvents = useMemo(() => {
    if (!novel) return [];

    const events: { date: string; type: "in" | "out" | "peak"; label: string }[] = [];
    let prevRank: number | null | undefined = undefined;
    let isFirstEntry = true;

    for (const entry of dedupedRankHistory) {
      const curr = entry.rank;

      if (prevRank === undefined) {
        if (curr !== null) {
          events.push({ date: entry.date, type: "in", label: "첫 차트 진입" });
          isFirstEntry = false;
        }
      } else if (prevRank === null && curr !== null) {
        events.push({
          date: entry.date,
          type: "in",
          label: isFirstEntry ? "첫 차트 진입" : "차트 재진입",
        });
        isFirstEntry = false;
      } else if (prevRank !== null && curr === null) {
        events.push({ date: entry.date, type: "out", label: "차트 이탈" });
      }

      prevRank = curr;
    }

    if (stats?.bestRank) {
      const peakEntry = dedupedRankHistory.find((r) => r.rank === stats.bestRank);
      if (peakEntry) {
        events.push({
          date: peakEntry.date,
          type: "peak",
          label: `최고 순위 #${stats.bestRank}위 달성`,
        });
      }
    }

    if (events.length === 0 && novel.firstAppeared) {
      events.push({
        date: novel.firstAppeared,
        type: "in",
        label: "첫 차트 진입",
      });
    }

    return events.sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [novel, dedupedRankHistory, stats]);

  const isCurrentlyCharted = useMemo(() => {
    if (!novel?.rankHistory?.length) return true;

    if (latestDate) {
      const entry = dedupedRankHistory.find((r) => r.date === latestDate);
      if (entry) return entry.rank !== null;
    }

    const last = dedupedRankHistory[dedupedRankHistory.length - 1];
    return last ? last.rank !== null : true;
  }, [novel, dedupedRankHistory, latestDate]);

  const hasPromotion =
    !!novel?.promotion &&
    ((novel.promotion.timeFreeType &&
      novel.promotion.timeFreeType !== "none") ||
      (novel.promotion.eventBanners &&
        novel.promotion.eventBanners.length > 0));

  const timeFreeLabel =
    novel?.promotion?.timeFreeType === "threeHour"
      ? "3다무"
      : novel?.promotion?.timeFreeType === "waitFree"
        ? "기다무"
        : null;

  const drawerWidth = isExpanded ? "max-w-4xl" : "max-w-md md:max-w-lg";

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
            className={cn(
              "fixed right-0 top-0 bottom-0 w-full z-50 overflow-y-auto border-l border-border shadow-2xl bg-surface text-foreground transition-all duration-300",
              drawerWidth,
            )}
          >
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-3 md:px-4 py-3 border-b border-border bg-surface/90 backdrop-blur-md">
              <div className="flex items-center gap-2 min-w-0">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground tracking-wide truncate">
                  작품 분석 리포트
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
                  title={isExpanded ? "축소" : "확장"}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={cn("p-4 md:p-5 space-y-6 md:space-y-7", isExpanded ? "max-w-3xl mx-auto" : "")}>
              {/* 커버 & 제목 */}
              <div className="flex gap-3 md:gap-4 items-start">
                <NovelCover
                  novel={novel}
                  size="lg"
                  className="shadow-2xl shrink-0 ring-1 ring-border rounded-xl w-20 md:w-auto"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {hasPromotion && (
                      <span className="bg-red-500/15 text-red-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/25 inline-flex items-center gap-1 whitespace-nowrap">
                        <Zap size={9} />
                        PROMOTION
                      </span>
                    )}
                    {timeFreeLabel && (
                      <span className="bg-amber-500/15 text-amber-600 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/25 inline-flex items-center gap-1 whitespace-nowrap">
                        <Clock size={9} />
                        {timeFreeLabel}
                      </span>
                    )}
                  </div>

                  <h2
                    className="font-bold text-[15px] md:text-base leading-snug line-clamp-2 mb-1.5 text-foreground"
                    title={novel.title}
                  >
                    {novel.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] md:text-xs text-muted-foreground">
                    <span>{novel.author}</span>
                    <span className="opacity-30">·</span>
                    <span className="text-primary font-medium">{novel.genre}</span>
                    <span className="opacity-30">·</span>
                    <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                      <Star size={11} fill="currentColor" />
                      {novel.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <RankChange novel={novel} />
                    <span className="font-mono text-sm font-black text-foreground bg-surface-elevated px-2 py-0.5 rounded-md whitespace-nowrap">
                      #{novel.todayRank}위
                    </span>
                  </div>
                </div>
              </div>

              {/* 핵심 지표 4개 */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {[
                  {
                    label: novel.platform === "ridi" ? "오늘 평가수" : "오늘 조회수",
                    value: formatViews(novel.platform, novel.todayViews),
                    icon: TrendingUp,
                    color: "text-emerald-500",
                  },
                  {
                    label: "댓글 수",
                    value: Number(novel.commentCount || 0).toLocaleString(),
                    icon: MessageCircle,
                    color: "text-sky-500",
                  },
                  {
                    label: "총 회차",
                    value: `${novel.episodeCount}화`,
                    icon: BookOpen,
                    color: "text-violet-500",
                  },
                  {
                    label: "연속 차트인",
                    value: `${stats.currentStreakDays}일`,
                    icon: Calendar,
                    color: "text-orange-500",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-surface-elevated rounded-xl p-3 md:p-3.5 border border-border"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <item.icon size={11} className={item.color} />
                      <span className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase leading-tight">
                        {item.label}
                      </span>
                    </div>
                    <div className="font-mono text-sm md:text-base font-extrabold text-foreground break-words">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 통합 차트 */}
              {combinedChartData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <SectionHeader icon={TrendingUp} label="순위 & 조회 추이" />
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1.5 text-sky-500">
                        <span className="w-4 h-0.5 bg-sky-500 inline-block rounded" />
                        순위
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-500">
                        <span className="w-3 h-2.5 bg-emerald-500/40 inline-block rounded-sm border border-emerald-500/50" />
                        조회수
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-elevated rounded-xl p-3 md:p-4 border border-border h-[190px] md:h-[210px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={combinedChartData}
                        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          yAxisId="rank"
                          reversed
                          domain={[1, "auto"]}
                          tick={{ fontSize: 9, fill: "#38bdf8" }}
                          width={rankAxisWidth}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}위`}
                        />
                        <YAxis
                          yAxisId="views"
                          orientation="right"
                          tick={{ fontSize: 9, fill: "#10b981" }}
                          width={42}
                          axisLine={false}
                          tickLine={false}
                          domain={viewsDomain}
                          tickFormatter={(v) =>
                            v >= 100_000_000
                              ? `${(v / 100_000_000).toFixed(1)}억`
                              : v >= 10_000
                                ? `${(v / 10_000).toFixed(0)}만`
                                : String(v)
                          }
                        />
                        <Tooltip content={<CombinedTooltip />} />
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
                        <Line
                          yAxisId="rank"
                          type="monotone"
                          dataKey="rank"
                          stroke="#38bdf8"
                          strokeWidth={2.5}
                          dot={{
                            r: 3,
                            fill: "#38bdf8",
                            stroke: "hsl(var(--surface))",
                            strokeWidth: 2,
                          }}
                          activeDot={{
                            r: 5,
                            fill: "#38bdf8",
                            stroke: "hsl(var(--surface))",
                            strokeWidth: 2,
                          }}
                          name="rank"
                          connectNulls
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 프로모션/소식 */}
              {novel.promotion &&
                ((novel.promotion.timeFreeType &&
                  novel.promotion.timeFreeType !== "none") ||
                  (novel.promotion.eventBanners &&
                    novel.promotion.eventBanners.length > 0) ||
                  (novel.promotion.notices &&
                    novel.promotion.notices.length > 0)) && (
                  <div className="space-y-3">
                    <SectionHeader icon={Zap} label="프로모션 / 소식" />
                    <div className="rounded-xl overflow-hidden border border-border space-y-px bg-surface-elevated">
                      {timeFreeLabel && (
                        <div className="relative overflow-hidden bg-amber-500/10 px-4 py-3 flex items-center gap-3 border-b border-border">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-500" />
                          <Clock size={14} className="text-amber-500 shrink-0 ml-1" />
                          <div className="flex-1">
                            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-300">
                              {timeFreeLabel === "기다무"
                                ? "기다리면 무료 (기다무)"
                                : "3시간마다 무료 (3다무)"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              무료 연재 혜택 적용 중
                            </p>
                          </div>
                        </div>
                      )}

                      {novel.promotion.eventBanners &&
                        novel.promotion.eventBanners.length > 0 && (
                          <div className="space-y-px">
                            {novel.promotion.eventBanners.map((b, i) => (
                              <div
                                key={i}
                                className="relative overflow-hidden bg-amber-500/10 px-4 py-3 flex items-center gap-3 border-b border-border last:border-0"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                                <Zap size={14} className="text-amber-500 shrink-0 ml-1" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-extrabold text-amber-600 dark:text-amber-300 leading-tight">
                                    {b.title}
                                  </p>
                                  {b.subtitle && (
                                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                                      {b.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {novel.promotion.notices &&
                        novel.promotion.notices.length > 0 && (
                          <div className="max-h-44 overflow-y-auto divide-y divide-border">
                            {novel.promotion.notices.map((notice, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 hover:bg-surface transition-colors"
                              >
                                <p className="text-xs font-bold text-foreground leading-snug">
                                  {notice.body || notice.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className="text-[10px] font-semibold text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
                                    {notice.title}
                                  </span>
                                  {notice.date && (
                                    <span className="text-[10px] text-muted-foreground">
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

              {/* 타임라인 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <SectionHeader icon={Calendar} label="차트 진입/이탈 타임라인" />
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      진입
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                      이탈
                    </span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      최고순위
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    {
                      label: "최고 순위",
                      value: stats.bestRank ? `#${stats.bestRank}위` : "-",
                      color: "text-amber-500",
                    },
                    {
                      label: "최저 순위",
                      value: stats.worstRank ? `#${stats.worstRank}위` : "-",
                      color: "text-muted-foreground",
                    },
                    {
                      label: "총 차트인",
                      value: `${stats.chartInCount}회`,
                      color: "text-primary",
                    },
                    {
                      label: "연속 진입",
                      value: `${stats.currentStreakDays}일`,
                      color: "text-emerald-500",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-surface-elevated rounded-lg p-2 border border-border text-center"
                    >
                      <p className="text-[9px] text-muted-foreground mb-1 leading-tight">
                        {item.label}
                      </p>
                      <p className={cn("font-mono text-xs font-extrabold", item.color)}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-surface-elevated rounded-xl border border-border p-4">
                  {timelineEvents.length === 0 ? (
                    <div className="text-center text-[11px] text-muted-foreground py-4">
                      타임라인 데이터가 없습니다
                    </div>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                      <div className="space-y-4">
                        {timelineEvents.map((event, idx) => {
                          const dotColor =
                            event.type === "in"
                              ? "bg-emerald-500"
                              : event.type === "out"
                                ? "bg-rose-500"
                                : "bg-amber-500";

                          const Icon =
                            event.type === "in"
                              ? ArrowUp
                              : event.type === "out"
                                ? ArrowDown
                                : Star;

                          return (
                            <div key={idx} className="flex items-start gap-3 relative">
                              <div
                                className={cn(
                                  "absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-surface-elevated",
                                  dotColor,
                                )}
                              >
                                <Icon size={7} className="text-white" />
                              </div>
                              <div className="flex-1 flex items-center justify-between gap-3">
                                <span
                                  className={cn(
                                    "text-xs font-semibold",
                                    event.type === "out"
                                      ? "text-rose-500"
                                      : "text-foreground",
                                  )}
                                >
                                  {event.label}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                  {event.date}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {isCurrentlyCharted ? (
                          <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-surface-elevated animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                            <div className="flex-1 flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-primary">
                                현재 #{novel.todayRank}위 차트인 중
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                {latestDate || "오늘"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center ring-2 ring-surface-elevated">
                              <ArrowDown size={7} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1 flex items-center justify-between gap-3">
                              <span className="text-xs font-semibold text-muted-foreground">
                                현재 차트 아웃
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                {latestDate || "오늘"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 경쟁작 비교 */}
              {competitors.length > 0 && (
                <div className="space-y-3">
                  <SectionHeader icon={TrendingUp} label={`장르 경쟁작 비교 (${novel.genre})`} />
                  <div className="rounded-xl border border-border overflow-hidden text-xs">
                    <div className="grid grid-cols-[1fr_44px_60px_44px] bg-surface-elevated px-3 py-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wide border-b border-border">
                      <span>작품</span>
                      <span className="text-right">순위</span>
                      <span className="text-right">조회/평가</span>
                      <span className="text-right">연속</span>
                    </div>

                    <div className="grid grid-cols-[1fr_44px_60px_44px] px-3 py-2.5 bg-primary/8 border-b border-border items-center">
                      <span className="font-bold text-foreground truncate pr-2 flex items-center gap-1.5">
                        <span className="w-1 h-4 bg-primary rounded-full shrink-0" />
                        <TruncatedTitle title={novel.title} maxLen={10} />
                      </span>
                      <span className="text-right font-mono font-bold text-primary">
                        #{novel.todayRank}
                      </span>
                      <span className="text-right font-mono text-foreground text-[11px]">
                        {formatViews(novel.platform, novel.todayViews)}
                      </span>
                      <span className="text-right font-mono text-emerald-500 font-bold">
                        {novel.consecutiveDays}일
                      </span>
                    </div>

                    {competitors.map((c, idx) => (
                      <div
                        key={c.id}
                        className={cn(
                          "grid grid-cols-[1fr_44px_60px_44px] px-3 py-2.5 items-center cursor-pointer hover:bg-surface-elevated transition-colors",
                          idx < competitors.length - 1 ? "border-b border-border" : "",
                        )}
                        onClick={() => onSelectNovel?.(c)}
                        title={`${c.title} 상세보기`}
                      >
                        <span className="truncate pr-2">
                          <TruncatedTitle
                            title={c.title}
                            maxLen={10}
                            className="text-sky-500 hover:text-sky-400"
                          />
                        </span>
                        <span className="text-right font-mono text-muted-foreground">
                          #{c.todayRank}
                        </span>
                        <span className="text-right font-mono text-muted-foreground text-[11px]">
                          {formatViews(c.platform, c.todayViews)}
                        </span>
                        <span className="text-right font-mono text-muted-foreground">
                          {c.consecutiveDays}일
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 푸터 */}
              <div className="bg-surface-elevated rounded-lg px-3 py-2.5 text-[10px] text-muted-foreground flex flex-col md:flex-row md:justify-between gap-1 border border-border">
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
