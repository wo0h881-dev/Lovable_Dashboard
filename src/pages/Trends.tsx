// src/pages/Trends.tsx
import { useState, useMemo } from "react";
import {
  Search,
  X,
  Flame,
  TrendingUp,
  Megaphone,
  ArrowUpRight,
  Eye,
  MessageCircle,
  Star,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from "recharts";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { type Novel } from "@/data/mockData";

const LINE_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#facc15",
];

//중복 안 뜨게 하는 함수
function normalizeText(v: string | undefined | null) {
  return String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function dedupeByTitleAuthor<T extends { title: string; author: string }>(items: T[]) {
  const map = new Map<string, T>();

  for (const item of items) {
    const key = `${normalizeText(item.title)}::${normalizeText(item.author)}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

//

function parseViewStr(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (!s || s === "-") return 0;

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
  return parseFloat(s.replace(/,/g, "")) || 0;
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

function getTimeFreeLabel(novel: Novel): string | null {
  const type = novel.promotion?.timeFreeType;
  if (type === "waitFree") return "기다무";
  if (type === "threeHour") return "3다무";
  return null;
}

function getAnalysisBadges(novel: Novel): string[] {
  const badges: string[] = [];

  if (novel.isNew) badges.push("NEW");
  if (novel.isReEntry) badges.push("RE-ENTRY");
  if (novel.promotion?.timeFreeType && novel.promotion.timeFreeType !== "none") {
    badges.push("PROMOTION");
  }
  if ((novel.viewsChangePct || 0) >= 20 && (!novel.promotion || novel.promotion.timeFreeType === "none")) {
    badges.push("VIRAL");
  }
  if ((novel.consecutiveDays || 0) >= 14) {
    badges.push("STEADY");
  }

  return badges.slice(0, 3);
}

function getReasonSummary(novel: Novel) {
  const delta = novel.viewsChangePct || 0;
  const noticeCount = novel.promotion?.notices?.length || 0;
  const timeFree = novel.promotion?.timeFreeType;

  if (timeFree === "waitFree" || timeFree === "threeHour") {
    return {
      title: "프로모션 영향 가능성이 높아요",
      body:
        timeFree === "waitFree"
          ? "기다무 적용과 함께 유입이 빠르게 늘어난 패턴으로 보여요."
          : "3다무 적용과 함께 단기 유입이 강하게 붙은 패턴으로 보여요.",
      confidence: "높음",
      evidence: [
        timeFree === "waitFree" ? "기다무 적용" : "3다무 적용",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        noticeCount > 0 ? `관련 공지 ${noticeCount}건` : "프로모션 정보 감지",
      ],
    };
  }

  if (novel.isNew && delta >= 15) {
    return {
      title: "신작 효과가 크게 작용하고 있어요",
      body: "초기 노출과 첫 유입이 빠르게 붙으면서 급상승한 흐름으로 보여요.",
      confidence: "높음",
      evidence: [
        "NEW 작품",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        `${novel.episodeCount || 0}화 초기 구간`,
      ],
    };
  }

  if (novel.isReEntry) {
    return {
      title: "재진입 + 재노출 효과로 보여요",
      body: "이전에 차트에 있었던 작품이 다시 유입을 받으며 재상승한 패턴이에요.",
      confidence: "중간",
      evidence: [
        "재진입 감지",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        noticeCount > 0 ? `관련 공지 ${noticeCount}건` : "추가 이슈 가능성",
      ],
    };
  }

  if (delta >= 20) {
    return {
      title: "바이럴 또는 후기 확산 영향으로 보여요",
      body: "프로모션 없이 조회수와 화제성이 동시에 뛰는 바이럴형 상승 패턴이에요.",
      confidence: "중간",
      evidence: [
        "프로모션 정보 없음",
        `조회수 증감률 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
        "후기 확산 가능성",
      ],
    };
  }

  return {
    title: "기존 체급과 누적 반응이 유지되는 흐름이에요",
    body: "급격한 프로모션보다는 평점, 댓글, 누적 노출이 작용한 안정적 상승으로 보여요.",
    confidence: "낮음",
    evidence: [
      `평점 ${novel.rating?.toFixed?.(1) ?? novel.rating ?? "-"}`,
      `댓글 ${Number(novel.commentCount || 0).toLocaleString("ko-KR")}개`,
      `${novel.consecutiveDays || 0}일 연속 차트인`,
    ],
  };
}

function normalizeRankHistory(novel: Novel, latestDate: string) {
  const history = (novel.rankHistory || [])
    .map((r) => ({ date: r.date, rank: r.rank }))
    .filter((r) => r.date && typeof r.rank !== "undefined")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (history.length > 0) {
    const hasLatest = history.some((h) => h.date === latestDate);
    if (!hasLatest && typeof novel.todayRank === "number") {
      history.push({ date: latestDate, rank: novel.todayRank });
    }
    return history;
  }

  if (typeof novel.todayRank === "number") {
    return [{ date: latestDate, rank: novel.todayRank }];
  }

  return [];
}

function normalizeViewsHistory(novel: Novel, latestDate: string) {
  const history = (novel.viewsHistory || [])
    .map((v) => ({ date: v.date, views: parseViewStr(v.views as any) }))
    .filter((v) => v.date && typeof v.views === "number")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (history.length > 0) {
    const hasLatest = history.some((h) => h.date === latestDate);
    if (!hasLatest && typeof novel.todayViews === "number") {
      history.push({ date: latestDate, views: Number(novel.todayViews || 0) });
    }
    return history;
  }

  if (typeof novel.todayViews === "number" && novel.todayViews > 0) {
    return [{ date: latestDate, views: Number(novel.todayViews || 0) }];
  }

  return [];
}

function getNovelTrendStats(novel: Novel, latestDate: string) {
  const rankHistory = normalizeRankHistory(novel, latestDate);
  const latestRank =
    [...rankHistory].reverse().find((r) => r.rank !== null)?.rank ?? novel.todayRank ?? null;

  const firstAppeared =
    rankHistory.find((r) => r.rank !== null)?.date || novel.firstAppeared || latestDate;

  const peakRank = (() => {
    const ranks = rankHistory
      .map((r) => r.rank)
      .filter((r): r is number => typeof r === "number" && r > 0);
    if (ranks.length === 0) return novel.peakRank ?? novel.todayRank ?? null;
    return Math.min(...ranks);
  })();

  const consecutiveDays = (() => {
    const sortedDesc = [...rankHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let count = 0;
    for (const h of sortedDesc) {
      if (h.rank !== null) count++;
      else break;
    }
    return count;
  })();

  return {
    latestRank,
    firstAppeared,
    peakRank,
    consecutiveDays,
  };
}

function buildCombinedChartData(novel: Novel, latestDate: string) {
  const rankHistory = normalizeRankHistory(novel, latestDate);
  const viewsHistory = normalizeViewsHistory(novel, latestDate);

  const rankMap = new Map(rankHistory.map((r) => [r.date, r.rank]));
  const viewsMap = new Map(viewsHistory.map((v) => [v.date, v.views]));
  const allDates = Array.from(new Set([...rankMap.keys(), ...viewsMap.keys()])).sort();

  return allDates.map((date) => ({
    date: date.slice(5),
    rank: rankMap.get(date) ?? null,
    views: viewsMap.get(date) ?? null,
  }));
}

function FixedTrendDetailPanel({
  novel,
  latestDate,
  allNovels,
  onSelectPanelNovel,
  onOpenDrawer,
}: {
  novel: Novel;
  latestDate: string;
  allNovels: Novel[];
  onSelectPanelNovel: (novel: Novel) => void;
  onOpenDrawer: (novel: Novel) => void;
}) {
  const reason = useMemo(() => getReasonSummary(novel), [novel]);
  const chartData = useMemo(() => buildCombinedChartData(novel, latestDate), [novel, latestDate]);

  const competitors = useMemo(() => {
    return allNovels
      .filter((n) => n.genre === novel.genre && n.id !== novel.id)
      .sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999))
      .slice(0, 4);
  }, [allNovels, novel]);

  const badges = getAnalysisBadges(novel);

  return (
    <div className="surface-card border border-border/50 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-extrabold text-lg tracking-tight">선택 작품 상세 패널</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase">
            트렌드 탭 하단 고정 상세 패널
          </p>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">{latestDate}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr_auto] gap-4 items-start mb-5">
        <button onClick={() => onOpenDrawer(novel)} className="text-left">
          <NovelCover
            novel={novel}
            className="w-20 h-28 rounded-xl shadow-md hover:opacity-90 transition-opacity"
          />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <PlatformBadge platform={novel.platform as any} size="sm" />
            <span className="text-[10px] px-2 py-1 rounded-full bg-surface-elevated border border-border/40 text-muted-foreground font-bold">
              {novel.genre}
            </span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-surface-elevated border border-border/40 text-muted-foreground font-bold">
              {novel.publisher}
            </span>
            {badges.map((badge) => (
              <span
                key={badge}
                className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenDrawer(novel)}
              className="text-xl font-black tracking-tight text-foreground hover:text-primary transition-colors text-left"
            >
              {novel.title}
            </button>
            <button
              onClick={() => onOpenDrawer(novel)}
              className="p-1 rounded hover:bg-surface-elevated text-muted-foreground"
              aria-label="상세 모달 열기"
            >
              <ExternalLink size={14} />
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {novel.author} · 총 {novel.episodeCount || "-"}화
          </p>
        </div>

        <div className="surface-card border border-border/40 p-4 min-w-[110px]">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Trend Score
          </p>
          <p className="text-3xl font-black text-primary mt-1">
            {Math.max(
              0,
              Math.round(
                (novel.viewsChangePct || 0) +
                  (novel.todayRank ? 25 - Math.min(novel.todayRank, 25) : 0)
              )
            )}
          </p>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Flame size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">급상승 이유 자동 서술</h3>
        </div>
        <p className="text-sm font-bold text-foreground mb-1">{reason.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{reason.body}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              핵심 근거
            </p>
            <p className="text-xs font-semibold mt-2 text-foreground">
              {reason.evidence[0] ?? "-"}
            </p>
          </div>
          <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              보조 근거
            </p>
            <p className="text-xs font-semibold mt-2 text-foreground">
              {reason.evidence[1] ?? "-"}
            </p>
          </div>
          <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              신뢰도
            </p>
            <p className="text-xs font-semibold mt-2 text-foreground">{reason.confidence}</p>
          </div>
        </div>
      </div>

      <div className="surface-card h-[260px] flex flex-col shadow-sm border border-border/40 mb-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          순위 / 조회 추이
        </h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="rank"
                reversed
                domain={["dataMin - 2", "dataMax + 2"]}
                allowDecimals={false}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                tickFormatter={(v) => `${v}위`}
              />
              <YAxis
                yAxisId="views"
                orientation="right"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                tickFormatter={(v) => toKoreanUnit(Number(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                formatter={(v: number, name: string) => {
                  if (name === "rank") return [`#${v}위`, "순위"];
                  return [toKoreanUnit(Number(v)), "조회수/평가수"];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="rank"
                type="monotone"
                dataKey="rank"
                name="순위"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
              <Line
                yAxisId="views"
                type="monotone"
                dataKey="views"
                name="조회수/평가수"
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="surface-card border border-border/40 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Megaphone size={16} className="text-amber-400" />
            프로모션 / 소식
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">시간무/무료 유형</span>
              <span className="font-semibold text-foreground">
                {getTimeFreeLabel(novel) ?? "없음"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">공지 수</span>
              <span className="font-semibold text-foreground">
                {novel.promotion?.notices?.length || 0}건
              </span>
            </div>

            {novel.promotion?.notices?.slice(0, 2).map((notice, idx) => (
              <div
                key={`${notice.title}-${idx}`}
                className="bg-surface-elevated border border-border/40 rounded-xl p-3"
              >
                <p className="font-semibold text-foreground line-clamp-1">{notice.title}</p>
                <p className="text-muted-foreground mt-1 line-clamp-2">{notice.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card border border-border/40 p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <ArrowUpRight size={16} className="text-emerald-400" />
            경쟁작 비교
          </h3>
          <div className="space-y-2">
            {competitors.length > 0 ? (
              competitors.map((item) => (
                <div
                  key={item.id}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <button onClick={() => onOpenDrawer(item)}>
                    <NovelCover novel={item} size="sm" className="w-8 h-10 rounded" />
                  </button>
                  <button
                    onClick={() => onSelectPanelNovel(item)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      #{item.todayRank ?? "-"} · {item.genre}
                    </p>
                  </button>
                  <button
                    onClick={() => onOpenDrawer(item)}
                    className="text-[10px] font-mono font-bold text-primary"
                  >
                    {(item.viewsChangePct || 0) >= 0 ? "+" : ""}
                    {(item.viewsChangePct || 0).toFixed(1)}%
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">비교 가능한 경쟁작이 없어요.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            <Eye size={12} />
            오늘 조회
          </div>
          <p className="text-sm font-black mt-2">
            {toKoreanUnit(Number(novel.todayViews || 0))}
          </p>
        </div>

        <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            <TrendingUp size={12} />
            증감률
          </div>
          <p className="text-sm font-black mt-2">
            {(novel.viewsChangePct || 0) >= 0 ? "+" : ""}
            {(novel.viewsChangePct || 0).toFixed(1)}%
          </p>
        </div>

        <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            <MessageCircle size={12} />
            댓글
          </div>
          <p className="text-sm font-black mt-2">
            {Number(novel.platform === "ridi" ? novel.todayViews || 0 : novel.commentCount || 0).toLocaleString("ko-KR")}
          </p>
        </div>

        <div className="bg-surface-elevated border border-border/40 rounded-xl p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
            <Star size={12} />
            평점
          </div>
          <p className="text-sm font-black mt-2">
            {novel.rating?.toFixed?.(1) ?? novel.rating ?? "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Novel[]>([]);
  const [drawerNovel, setDrawerNovel] = useState<Novel | null>(null);
  const [panelNovel, setPanelNovel] = useState<Novel | null>(null);

  const novels: Novel[] = sourceData ?? [];

  const initialSelected = useMemo(() => {
    if (selected.length === 0 && novels.length > 0) {
      return [...novels]
        .sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999))
        .slice(0, 1);
    }
    return selected;
  }, [novels, selected]);

  const activeSelected = selected.length > 0 ? selected : initialSelected;

  const results = query
  ? dedupeByTitleAuthor(
      novels.filter((n) => n.title.includes(query) || n.author.includes(query))
    ).slice(0, 6)
  : [];

  const addNovel = (n: Novel) => {
    if (activeSelected.find((s) => s.id === n.id)) return;
    if (activeSelected.length >= 3) return;
    const next = [...activeSelected, n];
    setSelected(next);

    if (!panelNovel) {
      setPanelNovel(n);
    }

    setQuery("");
  };

  const removeNovel = (id: string) => {
    const next = activeSelected.filter((s) => s.id !== id);
    setSelected(next);

    if (panelNovel?.id === id) {
      setPanelNovel(next[0] ?? null);
    }
    if (drawerNovel?.id === id) {
      setDrawerNovel(null);
    }
  };

  const rankChartData = useMemo(() => {
    if (activeSelected.length === 0) return [];

    const normalized = activeSelected.map((n) => ({
      history: normalizeRankHistory(n, latestDate),
    }));

    const allDates = Array.from(
      new Set(normalized.flatMap((item) => item.history.map((r) => r.date)))
    ).sort();

    return allDates.map((date) => {
      const row: Record<string, any> = { date: date.slice(5) };
      normalized.forEach((item, i) => {
        const entry = item.history.find((r) => r.date === date);
        row[`rank${i}`] = entry?.rank ?? null;
      });
      return row;
    });
  }, [activeSelected, latestDate]);

  const viewsChartData = useMemo(() => {
    if (activeSelected.length === 0) return [];

    const normalized = activeSelected.map((n) => ({
      history: normalizeViewsHistory(n, latestDate),
    }));

    const allDates = Array.from(
      new Set(normalized.flatMap((item) => item.history.map((v) => v.date)))
    ).sort();

    return allDates.map((date) => {
      const row: Record<string, any> = { date: date.slice(5) };
      normalized.forEach((item, i) => {
        const entry = item.history.find((v) => v.date === date);
        row[`views${i}`] = entry?.views ?? null;
      });
      return row;
    });
  }, [activeSelected, latestDate]);

  const fixedDetailNovel = panelNovel ?? activeSelected[0] ?? null;

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">트렌드</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · 작품별 순위/조회수 추이 및 트렌드 분석
        </p>
      </div>

      <div className="surface-card space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-bold flex-1">작품 트렌드 비교</h2>

          {activeSelected.map((n, i) => (
            <div
              key={n.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
              style={{ borderColor: LINE_COLORS[i], color: LINE_COLORS[i] }}
            >
              <button onClick={() => setPanelNovel(n)} className="line-clamp-1 max-w-28 text-left">
                {n.title}
              </button>
              <button onClick={() => removeNovel(n.id)}>
                <X size={12} />
              </button>
            </div>
          ))}

          {activeSelected.length < 3 && (
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="작품 추가…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
              {results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-64 bg-surface border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {results.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => addNovel(n)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left"
                    >
                      <NovelCover novel={n} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium line-clamp-1">{n.title}</div>
                        <div className="text-[10px] text-muted-foreground">{n.author}</div>
                      </div>
                      <PlatformBadge platform={n.platform} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {rankChartData.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">일별 순위 추이</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={rankChartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  reversed
                  domain={["dataMin - 2", "dataMax + 2"]}
                  allowDecimals={false}
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                  tickFormatter={(v) => `${v}위`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number) => [`#${v}위`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {activeSelected.map((n, i) => (
                  <Line
                    key={n.id}
                    type="monotone"
                    dataKey={`rank${i}`}
                    name={n.title.length > 12 ? `${n.title.slice(0, 12)}…` : n.title}
                    stroke={LINE_COLORS[i]}
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {viewsChartData.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              일별 조회수/평가수 추이
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart
                data={viewsChartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                  tickFormatter={(v) =>
                    v >= 100_000_000
                      ? `${(v / 100_000_000).toFixed(1)}억`
                      : v >= 10_000
                        ? `${(v / 10_000).toFixed(0)}만`
                        : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number) => [
                    v >= 100_000_000
                      ? `${(v / 100_000_000).toFixed(1)}억`
                      : v >= 10_000
                        ? `${(v / 10_000).toFixed(1)}만`
                        : v.toLocaleString(),
                    "",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {activeSelected.map((n, i) => (
                  <Line
                    key={n.id}
                    type="monotone"
                    dataKey={`views${i}`}
                    name={n.title.length > 12 ? `${n.title.slice(0, 12)}…` : n.title}
                    stroke={LINE_COLORS[i]}
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {activeSelected.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeSelected.map((n, i) => {
            const stats = getNovelTrendStats(n, latestDate);

            return (
              <div
                key={n.id}
                className="kpi-card border-l-2 hover:shadow-lg transition-shadow"
                style={{ borderLeftColor: LINE_COLORS[i] }}
              >
                <button onClick={() => setPanelNovel(n)} className="w-full text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <NovelCover novel={n} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold line-clamp-2">{n.title}</div>
                      <PlatformBadge platform={n.platform} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">오늘 순위</span>
                      <div className="font-mono font-bold">
                        {typeof stats.latestRank === "number" ? `#${stats.latestRank}` : "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">연속 진입</span>
                      <div className="font-mono font-bold">{stats.consecutiveDays}일</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">최고 순위</span>
                      <div className="font-mono font-bold">
                        {typeof stats.peakRank === "number" ? `#${stats.peakRank}` : "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">첫 등장</span>
                      <div className="font-mono font-bold text-[10px]">{stats.firstAppeared}</div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {fixedDetailNovel && (
        <FixedTrendDetailPanel
          novel={fixedDetailNovel}
          latestDate={latestDate}
          allNovels={novels}
          onSelectPanelNovel={setPanelNovel}
          onOpenDrawer={setDrawerNovel}
        />
      )}

      <NovelDetailDrawer
        novel={drawerNovel}
        onClose={() => setDrawerNovel(null)}
        latestDate={latestDate}
        allNovels={novels}
        onSelectNovel={setDrawerNovel}
      />
    </div>
  );
}
