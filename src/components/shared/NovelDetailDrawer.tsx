// src/components/shared/NovelDetailDrawer.tsx
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
  LineChart,
  Line,
  BarChart,
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

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
      <Icon size={13} />
      {label}
    </h3>
  );
}

function TruncatedTitle({ title, maxLen, className = "" }: { title: string; maxLen: number; className?: string }) {
  const isTruncated = title.length > maxLen;
  return (
    <span
      className={className}
      title={isTruncated ? title : undefined}
      style={{ cursor: isTruncated ? "help" : undefined }}
    >
      {isTruncated ? title.slice(0, maxLen) + "…" : title}
    </span>
  );
}

function RankTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 font-mono mb-1">{label}</p>
      <p className="text-sky-400 font-mono font-semibold">순위 #{payload[0]?.value}위</p>
    </div>
  );
}

function ViewsTooltip({ active, payload, label, platform }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 font-mono mb-1">{label}</p>
      <p className="text-emerald-400 font-mono font-semibold">
        {platform === "ridi"
          ? `${Number(val).toLocaleString()} 평가`
          : val >= 100_000_000
          ? `${(val / 100_000_000).toFixed(1)}억`
          : val >= 10_000
          ? `${(val / 10_000).toFixed(1)}만`
          : Number(val).toLocaleString()}
      </p>
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
  let m;
  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += parseFloat(m[1].replace(/,/g, "")) * 100_000_000;
    if (m[2]) total += parseFloat(m[2].replace(/,/g, "")) * 10_000;
  }
  if (total > 0) return total;
  if (s.endsWith("억")) return parseFloat(s.replace("억", "")) * 100_000_000;
  if (s.endsWith("만")) return parseFloat(s.replace("만", "")) * 10_000;
  return parseFloat(s.replace(/,/g, "")) || null;
}

export function NovelDetailDrawer({ novel, onClose, latestDate, allNovels = [], onSelectNovel }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const stats = useMemo(() => (novel ? computeNovelStats(novel) : null), [novel]);

  // ── 날짜 중복 제거된 rankHistory ─────────────────────
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [novel]);

  // ── 순위 차트 데이터 ─────────────────────────────────
  const rankChartData = useMemo(() => {
    return dedupedRankHistory
      .filter((r) => r.rank !== null && r.rank > 0)
      .map((r) => ({ date: r.date.slice(5), rank: r.rank }));
  }, [dedupedRankHistory]);

  // ── 조회수 차트 데이터 ───────────────────────────────
  const viewsChartData = useMemo(() => {
    if (!novel?.viewsHistory) return [];
    const seen = new Map<string, number | null>();
    for (const v of novel.viewsHistory) {
      if (!seen.has(v.date)) {
        seen.set(v.date, parseViewStr(v.views as string | number | null));
      }
    }
    return Array.from(seen.entries())
      .map(([date, views]) => ({ date: date.slice(5), views }))
      .filter((d) => d.views !== null && d.views > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [novel]);

  // ── 조회수 Y축 도메인 ────────────────────────────────
  const viewsDomain = useMemo(() => {
  const vals = viewsChartData.map((d) => d.views).filter((v): v is number => v !== null && v > 0);
  if (vals.length === 0) return ["auto", "auto"] as const;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const padding = (max - min) * 0.05 || max * 0.02;
  return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)] as [number, number];
}, [viewsChartData]);

  // ── 순위 Y축 width ───────────────────────────────────
  const rankAxisWidth = useMemo(() => {
    const maxRank = Math.max(...dedupedRankHistory.map((r) => r.rank ?? 0).filter((r) => r > 0));
    if (maxRank >= 100) return 36;
    if (maxRank >= 10) return 30;
    return 24;
  }, [dedupedRankHistory]);

  // ── 경쟁작 ───────────────────────────────────────────
  const competitors = useMemo(() => {
    if (!novel) return [];
    return allNovels
      .filter((n) => n.genre === novel.genre && n.id !== novel.id)
      .sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999))
      .slice(0, 4);
  }, [novel, allNovels]);

  // ── 타임라인 ─────────────────────────────────────────
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
        events.push({ date: entry.date, type: "in", label: isFirstEntry ? "첫 차트 진입" : "차트 재진입" });
        isFirstEntry = false;
      } else if (prevRank !== null && curr === null) {
        events.push({ date: entry.date, type: "out", label: "차트 이탈" });
      }
      prevRank = curr;
    }

    if (stats?.bestRank) {
      const peakEntry = dedupedRankHistory.find((r) => r.rank === stats.bestRank);
      if (peakEntry) {
        events.push({ date: peakEntry.date, type: "peak", label: `최고 순위 #${stats.bestRank}위 달성` });
      }
    }
    if (events.length === 0 && novel.firstAppeared) {
      events.push({ date: novel.firstAppeared, type: "in", label: "첫 차트 진입" });
    }
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [novel, dedupedRankHistory, stats]);

  // ── 현재 차트인 여부 ─────────────────────────────────
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
    ((novel.promotion.timeFreeType && novel.promotion.timeFreeType !== "none") ||
      (novel.promotion.eventBanners && novel.promotion.eventBanners.length > 0));

  const timeFreeLabel =
    novel?.promotion?.timeFreeType === "threeHour" ? "3다무" :
    novel?.promotion?.timeFreeType === "waitFree" ? "기다무" : null;

  const drawerWidth = isExpanded ? "max-w-3xl" : "max-w-md";

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
            className={`fixed right-0 top-0 bottom-0 w-full ${drawerWidth} z-50 overflow-y-auto border-l border-white/8 shadow-2xl bg-[#0f0f12] text-slate-200 transition-all duration-300`}
          >
            {/* 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-xs font-bold text-slate-400 tracking-wide">작품 분석 리포트</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-200"
                  title={isExpanded ? "축소" : "확장"}
                >
                  {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={`p-5 space-y-7 ${isExpanded ? "max-w-2xl mx-auto" : ""}`}>

              {/* 커버 & 제목 */}
              <div className="flex gap-4">
                <NovelCover novel={novel} size="lg" className="shadow-2xl shrink-0 ring-1 ring-white/10 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {hasPromotion && (
                      <span className="bg-red-500/15 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/25 inline-flex items-center gap-1">
                        <Zap size={9} />PROMOTION
                      </span>
                    )}
                    {timeFreeLabel && (
                      <span className="bg-amber-500/15 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-500/25 inline-flex items-center gap-1">
                        <Clock size={9} />{timeFreeLabel}
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-base leading-snug line-clamp-2 mb-1.5 text-white" title={novel.title}>
                    {novel.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span>{novel.author}</span>
                    <span className="opacity-30">·</span>
                    <span className="text-primary font-medium">{novel.genre}</span>
                    <span className="opacity-30">·</span>
                    <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                      <Star size={11} fill="currentColor" />{novel.rating.toFixed(1)}
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

              {/* 핵심 지표 4개 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: novel.platform === "ridi" ? "오늘 평가수" : "오늘 조회수", value: formatViews(novel.platform, novel.todayViews), icon: TrendingUp, color: "text-emerald-400", bg: "from-emerald-500/8" },
                  { label: "댓글 수", value: Number(novel.commentCount || 0).toLocaleString(), icon: MessageCircle, color: "text-sky-400", bg: "from-sky-500/8" },
                  { label: "총 회차", value: `${novel.episodeCount}화`, icon: BookOpen, color: "text-violet-400", bg: "from-violet-500/8" },
                  { label: "연속 차트인", value: `${stats.currentStreakDays}일`, icon: Calendar, color: "text-orange-400", bg: "from-orange-500/8" },
                ].map((item) => (
                  <div key={item.label} className={`bg-gradient-to-br ${item.bg} to-transparent rounded-xl p-3.5 border border-white/5`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <item.icon size={11} className={item.color} />
                      <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">{item.label}</span>
                    </div>
                    <div className="font-mono text-base font-extrabold text-white">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* ── 순위 추이 차트 (LineChart 단독) ── */}
              {rankChartData.length > 0 && (
                <div className="space-y-2">
                  <SectionHeader icon={TrendingUp} label="순위 추이" />
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 h-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rankChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#475569" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis
                          reversed
                          domain={[1, "auto"]}
                          tick={{ fontSize: 9, fill: "#38bdf8" }}
                          width={rankAxisWidth}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}위`}
                        />
                        <Tooltip content={<RankTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="rank"
                          stroke="#38bdf8"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#38bdf8", stroke: "#0f0f12", strokeWidth: 2 }}
                          activeDot={{ r: 5, fill: "#38bdf8", stroke: "#0f0f12", strokeWidth: 2 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ── 조회수/평가수 추이 차트 (BarChart 단독) ── */}
              {viewsChartData.length > 0 && (
                <div className="space-y-2">
                  <SectionHeader
                    icon={TrendingUp}
                    label={novel.platform === "ridi" ? "평가수 추이" : "조회수 추이"}
                  />
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={viewsChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#475569" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis
                          tick={{ fontSize: 9, fill: "#34d399" }}
                          width={42}
                          axisLine={false}
                          tickLine={false}
                          domain={viewsDomain}
                          tickFormatter={(v) =>
                            v >= 100_000_000 ? `${(v / 100_000_000).toFixed(1)}억` :
                            v >= 10_000 ? `${(v / 10_000).toFixed(0)}만` : String(v)
                          }
                        />
                        <Tooltip content={<ViewsTooltip platform={novel.platform} />} />
                        <Bar
                          dataKey="views"
                          fill="#10b981"
                          fillOpacity={0.5}
                          stroke="#10b981"
                          strokeOpacity={0.7}
                          strokeWidth={1}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 프로모션/소식 */}
              {novel.promotion &&
                ((novel.promotion.timeFreeType && novel.promotion.timeFreeType !== "none") ||
                  (novel.promotion.eventBanners && novel.promotion.eventBanners.length > 0) ||
                  (novel.promotion.notices && novel.promotion.notices.length > 0)) && (
                <div className="space-y-3">
                  <SectionHeader icon={Zap} label="프로모션 / 소식" />
                  <div className="rounded-xl overflow-hidden border border-white/8 space-y-px bg-white/[0.02]">
                    {timeFreeLabel && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/25 via-yellow-500/10 to-transparent px-4 py-3 flex items-center gap-3">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-yellow-500" />
                        <Clock size={14} className="text-amber-400 shrink-0 ml-1" />
                        <div className="flex-1">
                          <p className="text-xs font-extrabold text-amber-300">
                            {timeFreeLabel === "기다무" ? "기다리면 무료 (기다무)" : "3시간마다 무료 (3다무)"}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">무료 연재 혜택 적용 중</p>
                        </div>
                      </div>
                    )}
                    {novel.promotion.eventBanners && novel.promotion.eventBanners.length > 0 && (
                      <div className="space-y-px">
                        {novel.promotion.eventBanners.map((b, i) => (
                          <div key={i} className="relative overflow-hidden bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent px-4 py-3 flex items-center gap-3">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500" />
                            <Zap size={14} className="text-amber-400 shrink-0 ml-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-extrabold text-amber-300 leading-tight">{b.title}</p>
                              {b.subtitle && <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{b.subtitle}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {novel.promotion.notices && novel.promotion.notices.length > 0 && (
                      <div className="max-h-44 overflow-y-auto divide-y divide-white/5">
                        {novel.promotion.notices.map((notice, idx) => (
                          <div key={idx} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
                            <p className="text-xs font-bold text-slate-100 leading-snug">{notice.body || notice.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-semibold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{notice.title}</span>
                              {notice.date && <span className="text-[10px] text-slate-600">{notice.date}</span>}
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
                <div className="flex items-center justify-between">
                  <SectionHeader icon={Calendar} label="차트 진입/이탈 타임라인" />
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />진입</span>
                    <span className="flex items-center gap-1 text-rose-400"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />이탈</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />최고순위</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "최고 순위", value: stats.bestRank ? `#${stats.bestRank}위` : "-", color: "text-amber-400" },
                    { label: "최저 순위", value: stats.worstRank ? `#${stats.worstRank}위` : "-", color: "text-slate-400" },
                    { label: "총 차트인", value: `${stats.chartInCount}회`, color: "text-primary" },
                    { label: "연속 진입", value: `${stats.currentStreakDays}일`, color: "text-emerald-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/[0.03] rounded-lg p-2 border border-white/5 text-center">
                      <p className="text-[9px] text-slate-500 mb-1 leading-tight">{item.label}</p>
                      <p className={`font-mono text-xs font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                  {timelineEvents.length === 0 ? (
                    <div className="text-center text-[11px] text-slate-600 py-4">타임라인 데이터가 없습니다</div>
                  ) : (
                    <div className="relative pl-5">
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/8" />
                      <div className="space-y-4">
                        {timelineEvents.map((event, idx) => {
                          const dotColor = event.type === "in" ? "bg-emerald-400" : event.type === "out" ? "bg-rose-400" : "bg-amber-400";
                          const Icon = event.type === "in" ? ArrowUp : event.type === "out" ? ArrowDown : Star;
                          return (
                            <div key={idx} className="flex items-start gap-3 relative">
                              <div className={`absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full ${dotColor} flex items-center justify-center ring-2 ring-[#0f0f12]`}>
                                <Icon size={7} className="text-black" />
                              </div>
                              <div className="flex-1 flex items-center justify-between">
                                <span className={`text-xs font-semibold ${event.type === "out" ? "text-rose-300" : "text-slate-200"}`}>{event.label}</span>
                                <span className="font-mono text-[10px] text-slate-500">{event.date}</span>
                              </div>
                            </div>
                          );
                        })}
                        {isCurrentlyCharted ? (
                          <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-[#0f0f12] animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-xs font-semibold text-primary">현재 #{novel.todayRank}위 차트인 중</span>
                              <span className="font-mono text-[10px] text-slate-500">{latestDate || "오늘"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 relative">
                            <div className="absolute -left-5 top-0.5 w-3.5 h-3.5 rounded-full bg-slate-600 flex items-center justify-center ring-2 ring-[#0f0f12]">
                              <ArrowDown size={7} className="text-slate-300" />
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500">현재 차트 아웃</span>
                              <span className="font-mono text-[10px] text-slate-600">{latestDate || "오늘"}</span>
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
                        <TruncatedTitle title={novel.title} maxLen={10} />
                      </span>
                      <span className="text-right font-mono font-bold text-primary">#{novel.todayRank}</span>
                      <span className="text-right font-mono text-slate-200 text-[11px]">{formatViews(novel.platform, novel.todayViews)}</span>
                      <span className="text-right font-mono text-emerald-400 font-bold">{novel.consecutiveDays}일</span>
                    </div>
                    {competitors.map((c, idx) => (
                      <div
                        key={c.id}
                        className={`grid grid-cols-[1fr_44px_60px_44px] px-3 py-2.5 items-center cursor-pointer ${
                          idx < competitors.length - 1 ? "border-b border-white/5" : ""
                        } hover:bg-white/[0.05] transition-colors`}
                        onClick={() => onSelectNovel?.(c)}
                        title={`${c.title} 상세보기`}
                      >
                        <span className="truncate pr-2">
                          <TruncatedTitle title={c.title} maxLen={10} className="text-sky-300 hover:text-sky-200" />
                        </span>
                        <span className="text-right font-mono text-slate-400">#{c.todayRank}</span>
                        <span className="text-right font-mono text-slate-400 text-[11px]">{formatViews(c.platform, c.todayViews)}</span>
                        <span className="text-right font-mono text-slate-500">{c.consecutiveDays}일</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 푸터 */}
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
