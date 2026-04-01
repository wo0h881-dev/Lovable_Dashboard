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
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, type Novel } from "@/data/mockData";

interface Props {
  novel: Novel | null;
  onClose: () => void;
  latestDate?: string;
  allNovels?: Novel[];
  onSelectNovel?: (novel: Novel) => void;
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

function toKoreanUnit(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "-";
  const eok = 100_000_000;
  const man = 10_000;

  if (n >= eok) return `${(n / eok).toFixed(1).replace(/\.0$/, "")}억`;
  if (n >= man) {
    const manVal = n / man;
    if (manVal < 100) return `${manVal.toFixed(1).replace(/\.0$/, "")}만`;
    return `${Math.round(manVal).toLocaleString("ko-KR")}만`;
  }

  return n.toLocaleString("ko-KR");
}

function getDisplayCommentCount(novel: Novel): string {
  if (novel.platform === "ridi") return "-";
  if (novel.commentCount == null) return "-";
  return String(novel.commentCount);
}

function getTimeFreeLabel(novel: Novel): string | null {
  const type = novel.promotion?.timeFreeType;
  if (type === "waitFree") {
    return novel.platform === "ridi" ? "리다무" : "기다무";
  }
  if (type === "threeHour") return "3다무";
  if (type === "pass") return "패스";

  if (novel.platform === "ridi") {
    if (novel.promotion?.ridiWaitFree) return "리다무";
    if (novel.promotion?.ridiFreeLabel) return novel.promotion.ridiFreeLabel;
  }

  return null;
}

function buildChartData(novel: Novel, latestDate?: string) {
  const rankHistory = [...(novel.rankHistory || [])]
    .filter((r) => r.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const viewsHistory = [...(novel.viewsHistory || [])]
    .filter((v) => v.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const rankMap = new Map<string, number | null>();
  const viewsMap = new Map<string, number | null>();

  rankHistory.forEach((r) => {
    rankMap.set(r.date, typeof r.rank === "number" ? r.rank : null);
  });

  viewsHistory.forEach((v) => {
    viewsMap.set(v.date, parseViewStr(v.views));
  });

  if (latestDate) {
    if (!rankMap.has(latestDate) && typeof novel.todayRank === "number") {
      rankMap.set(latestDate, novel.todayRank);
    }
    if (!viewsMap.has(latestDate) && typeof novel.todayViews === "number") {
      viewsMap.set(latestDate, Number(novel.todayViews));
    }
  }

  const allDates = Array.from(
    new Set([...rankMap.keys(), ...viewsMap.keys()]),
  ).sort();

  return allDates.map((date) => ({
    date: date.slice(5),
    rank: rankMap.get(date) ?? null,
    views: viewsMap.get(date) ?? null,
  }));
}

export function NovelDetailDrawer({
  novel,
  onClose,
  latestDate,
}: Props) {
  const chartData = useMemo(() => {
    if (!novel) return [];
    return buildChartData(novel, latestDate);
  }, [novel, latestDate]);

  const streakDays = novel?.consecutiveDays ?? 0;
  const timeFreeLabel = novel ? getTimeFreeLabel(novel) : null;

  return (
    <AnimatePresence>
      {novel && (
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md md:max-w-lg bg-surface border-l border-border shadow-2xl z-[60] overflow-y-auto"
          >
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-surface/95 backdrop-blur">
              <div className="flex items-center gap-2 min-w-0">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-xs font-bold text-muted-foreground truncate">
                  작품 상세
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 md:p-5 space-y-6">
              {/* 상단 정보 */}
              <div className="flex gap-4 items-start">
                <NovelCover novel={novel} size="lg" className="shadow-lg rounded-xl" />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {timeFreeLabel && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 border border-amber-500/25 text-[10px] font-black px-1.5 py-0.5 rounded whitespace-nowrap">
                        <Clock size={10} />
                        {timeFreeLabel}
                      </span>
                    )}

                    {novel.promotion?.eventBanners?.length ? (
                      <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-500 border border-red-500/25 text-[10px] font-black px-1.5 py-0.5 rounded whitespace-nowrap">
                        <Zap size={10} />
                        PROMOTION
                      </span>
                    ) : null}
                  </div>

                  <h2 className="font-bold text-base leading-snug text-foreground line-clamp-2">
                    {novel.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1.5">
                    <span>{novel.author}</span>
                    <span className="opacity-30">·</span>
                    <span className="text-primary font-medium">{novel.genre}</span>
                    <span className="opacity-30">·</span>
                    <span>{novel.publisher}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="font-mono text-sm font-black text-foreground bg-surface-elevated px-2 py-0.5 rounded-md whitespace-nowrap">
                      #{novel.todayRank ?? "-"}위
                    </span>
                    <RankChange novel={novel} />
                    <span className="flex items-center gap-0.5 text-yellow-500 font-bold text-sm">
                      <Star size={12} fill="currentColor" />
                      {novel.rating?.toFixed?.(1) ?? novel.rating ?? "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: novel.platform === "ridi" ? "오늘 평가수" : "오늘 조회수",
                    value: formatViews(novel.platform, novel.todayViews),
                    icon: TrendingUp,
                    color: "text-emerald-500",
                  },
                  {
                    label: "댓글 수",
                    value: getDisplayCommentCount(novel),
                    icon: MessageCircle,
                    color: "text-sky-500",
                  },
                  {
                    label: "총 회차",
                    value: novel.episodeCount ? `${novel.episodeCount}화` : "-",
                    icon: BookOpen,
                    color: "text-violet-500",
                  },
                  {
                    label: "연속 차트인",
                    value: `${streakDays}일`,
                    icon: Calendar,
                    color: "text-orange-500",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-surface-elevated rounded-xl p-3 border border-border"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <item.icon size={11} className={item.color} />
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        {item.label}
                      </span>
                    </div>
                    <div className="font-mono text-sm font-extrabold text-foreground break-words">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* 차트 */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={13} />
                  순위 & 조회 추이
                </h3>

                <div className="bg-surface-elevated rounded-xl p-3 border border-border h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
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
                        width={30}
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
                        tickFormatter={(v) =>
                          v >= 100_000_000
                            ? `${(v / 100_000_000).toFixed(1)}억`
                            : v >= 10_000
                              ? `${(v / 10_000).toFixed(0)}만`
                              : String(v)
                        }
                      />
                      <Tooltip />
                      <Bar
                        yAxisId="views"
                        dataKey="views"
                        fill="#10b981"
                        fillOpacity={0.35}
                        stroke="#10b981"
                        strokeOpacity={0.5}
                        strokeWidth={1}
                        radius={[3, 3, 0, 0]}
                        name="조회수"
                      />
                      <Line
                        yAxisId="rank"
                        type="monotone"
                        dataKey="rank"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#38bdf8", stroke: "hsl(var(--surface))", strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: "#38bdf8", stroke: "hsl(var(--surface))", strokeWidth: 2 }}
                        name="순위"
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 프로모션 / 공지 */}
              {(novel.promotion?.eventBanners?.length || novel.promotion?.notices?.length || timeFreeLabel) && (
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={13} />
                    프로모션 / 소식
                  </h3>

                  <div className="rounded-xl overflow-hidden border border-border bg-surface-elevated">
                    {timeFreeLabel && (
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-xs font-extrabold text-amber-600">
                          {timeFreeLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          무료 연재 혜택 적용 중
                        </p>
                      </div>
                    )}

                    {novel.promotion?.eventBanners?.map((b, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-border last:border-b-0"
                      >
                        <p className="text-xs font-bold text-foreground leading-tight">
                          {b.title}
                        </p>
                        {b.subtitle && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                            {b.subtitle}
                          </p>
                        )}
                      </div>
                    ))}

                    {novel.promotion?.notices?.map((notice, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 border-b border-border last:border-b-0"
                      >
                        <p className="text-xs font-bold text-foreground leading-tight">
                          {notice.body || notice.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {notice.title && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-surface px-1.5 py-0.5 rounded">
                              {notice.title}
                            </span>
                          )}
                          {notice.date && (
                            <span className="text-[10px] text-muted-foreground">
                              {notice.date}
                            </span>
                          )}
                        </div>
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
