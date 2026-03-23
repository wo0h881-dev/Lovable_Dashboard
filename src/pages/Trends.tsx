// src/pages/Trends.tsx
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { type Novel } from "@/data/mockData";

const LINE_COLORS = ["hsl(var(--primary))", "hsl(var(--ridi))", "hsl(var(--kakao))"];

type ColorBy = "publisher" | "genre";

const GENRE_COLORS: Record<string, string> = {
  로판: "hsl(var(--ridi))",
  판타지: "hsl(var(--naver))",
  로맨스: "hsl(350,100%,60%)",
  현판: "#f97316",
  BL: "hsl(var(--kakao))",
  무협: "#a3e635",
  기타: "#94a3b8",
};

const PUB_COLORS = [
  "hsl(var(--kakao))", "hsl(var(--naver))", "hsl(var(--ridi))",
  "#c084fc", "#f97316", "#22d3ee", "#f43f5e", "#10b981",
];

function parseViewStr(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (!s || s === "-") return 0;
  const regex = /([\d.,]+)\s*억|([\d.,]+)\s*만/g;
  let total = 0; let m;
  while ((m = regex.exec(s)) !== null) {
    if (m[1]) total += parseFloat(m[1].replace(/,/g, "")) * 100_000_000;
    if (m[2]) total += parseFloat(m[2].replace(/,/g, "")) * 10_000;
  }
  if (total > 0) return total;
  if (s.endsWith("억")) return parseFloat(s.replace("억", "")) * 100_000_000;
  if (s.endsWith("만")) return parseFloat(s.replace("만", "")) * 10_000;
  return parseFloat(s.replace(/,/g, "")) || 0;
}

export default function TrendsPage() {
  const { data: sourceData, isLoading, error, latestDate } = useTodayCombined();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Novel[]>([]);
  const [colorBy, setColorBy] = useState<ColorBy>("genre");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const novels: Novel[] = sourceData ?? [];

  // 첫 로드 시 1위 작품 기본 선택
  const initialSelected = useMemo(() => {
    if (selected.length === 0 && novels.length > 0) {
      const top = [...novels].sort((a, b) => (a.todayRank ?? 999) - (b.todayRank ?? 999)).slice(0, 1);
      return top;
    }
    return selected;
  }, [novels, selected]);

  const activeSelected = selected.length > 0 ? selected : initialSelected;

  const results = query
    ? novels.filter(n => n.title.includes(query) || n.author.includes(query)).slice(0, 6)
    : [];

  const addNovel = (n: Novel) => {
    if (activeSelected.find(s => s.id === n.id)) return;
    if (activeSelected.length >= 3) return;
    setSelected([...activeSelected, n]);
    setQuery("");
  };
  const removeNovel = (id: string) => setSelected(activeSelected.filter(s => s.id !== id));

  // ── 선택된 작품 rankHistory 기반 비교 차트 ───────────────
  const rankChartData = useMemo(() => {
    if (activeSelected.length === 0) return [];
    const allDates = Array.from(new Set(
      activeSelected.flatMap(n => (n.rankHistory || []).map(r => r.date))
    )).sort();
    return allDates.map(date => {
      const row: Record<string, any> = { date: date.slice(5) };
      activeSelected.forEach((n, i) => {
        const entry = (n.rankHistory || []).find(r => r.date === date);
        row[`rank${i}`] = entry?.rank ?? null;
      });
      return row;
    });
  }, [activeSelected]);

  const viewsChartData = useMemo(() => {
    if (activeSelected.length === 0) return [];
    const allDates = Array.from(new Set(
      activeSelected.flatMap(n => (n.viewsHistory || []).map(v => v.date))
    )).sort();
    return allDates.map(date => {
      const row: Record<string, any> = { date: date.slice(5) };
      activeSelected.forEach((n, i) => {
        const entry = (n.viewsHistory || []).find(v => v.date === date);
        row[`views${i}`] = entry ? parseViewStr(entry.views as any) : null;
      });
      return row;
    });
  }, [activeSelected]);

  // ── 버블 차트 데이터 ─────────────────────────────────────
  const pubColorMap = useMemo(() => {
    const pubs = Array.from(new Set(novels.map(n => n.publisher)));
    return Object.fromEntries(pubs.map((p, i) => [p, PUB_COLORS[i % PUB_COLORS.length]]));
  }, [novels]);

  const bubbleData = useMemo(() =>
    novels
      .filter(n => n.todayRank != null && n.todayViews > 0)
      .map(n => ({
        x: n.todayRank ?? 0,
        y: n.todayViews,
        z: Math.min((n.consecutiveDays || 1) * 2, 60),
        name: n.title,
        publisher: n.publisher,
        genre: n.genre,
        color: colorBy === "genre"
          ? (GENRE_COLORS[n.genre] ?? "#94a3b8")
          : (pubColorMap[n.publisher] ?? "#94a3b8"),
        novel: n,
      })),
    [novels, colorBy, pubColorMap]
  );

  if (isLoading) return <LoadingScreen />;
  if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">트렌드</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {latestDate} 기준 · 작품별 순위/조회수 추이 및 포트폴리오 분석
        </p>
      </div>

      {/* 작품 비교 */}
      <div className="surface-card space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-bold flex-1">작품 트렌드 비교</h2>
          {activeSelected.map((n, i) => (
            <div key={n.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
              style={{ borderColor: LINE_COLORS[i], color: LINE_COLORS[i] }}>
              <span className="line-clamp-1 max-w-28">{n.title}</span>
              <button onClick={() => removeNovel(n.id)}><X size={12} /></button>
            </div>
          ))}
          {activeSelected.length < 3 && (
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="작품 추가…"
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface-elevated border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
              {results.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-64 bg-surface border border-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {results.map(n => (
                    <button key={n.id} onClick={() => addNovel(n)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-elevated transition-colors text-left">
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

        {/* 순위 추이 */}
        {rankChartData.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">일별 순위 추이</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={rankChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                  tickFormatter={v => `${v}위`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`#${v}위`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {activeSelected.map((n, i) => (
                  <Line key={n.id} type="monotone" dataKey={`rank${i}`}
                    name={n.title.length > 12 ? n.title.slice(0, 12) + "…" : n.title}
                    stroke={LINE_COLORS[i]} strokeWidth={2} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 조회수 추이 */}
        {viewsChartData.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">일별 조회수/평가수 추이</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={viewsChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                  tickFormatter={v => v >= 100_000_000 ? `${(v/100_000_000).toFixed(1)}억` : v >= 10_000 ? `${(v/10_000).toFixed(0)}만` : String(v)} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [v >= 100_000_000 ? `${(v/100_000_000).toFixed(1)}억` : v >= 10_000 ? `${(v/10_000).toFixed(1)}만` : v.toLocaleString(), ""]}
                />
                {activeSelected.map((n, i) => (
                  <Line key={n.id} type="monotone" dataKey={`views${i}`}
                    name={n.title.length > 12 ? n.title.slice(0, 12) + "…" : n.title}
                    stroke={LINE_COLORS[i]} strokeWidth={2} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 요약 카드 */}
      {activeSelected.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeSelected.map((n, i) => (
            <div key={n.id} className="kpi-card border-l-2 cursor-pointer hover:shadow-lg transition-shadow"
              style={{ borderLeftColor: LINE_COLORS[i] }}
              onClick={() => setSelectedNovel(n)}>
              <div className="flex items-center gap-2 mb-3">
                <NovelCover novel={n} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold line-clamp-2">{n.title}</div>
                  <PlatformBadge platform={n.platform} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">오늘 순위</span><div className="font-mono font-bold">#{n.todayRank}</div></div>
                <div><span className="text-muted-foreground">연속 진입</span><div className="font-mono font-bold">{n.consecutiveDays}일</div></div>
                <div><span className="text-muted-foreground">최고 순위</span><div className="font-mono font-bold">#{n.peakRank}</div></div>
                <div><span className="text-muted-foreground">첫 등장</span><div className="font-mono font-bold text-[10px]">{n.firstAppeared}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 포트폴리오 버블 차트 */}
      <div className="surface-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold">포트폴리오 버블 차트</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">색상 기준:</span>
            {(["genre", "publisher"] as ColorBy[]).map(k => (
              <button key={k} onClick={() => setColorBy(k)}
                className={cn("px-2.5 py-1 rounded text-xs",
                  colorBy === k ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                )}>
                {k === "genre" ? "장르" : "출판사"}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          X축: 오늘 순위 · Y축: 조회수/평가수 · 크기: 연속 차트인 일수
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" name="순위" reversed domain={[1, "auto"]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
              tickFormatter={v => `#${v}`} />
            <YAxis type="number" dataKey="y" name="조회수"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
              tickFormatter={v => v >= 100_000_000 ? `${(v/100_000_000).toFixed(1)}억` : v >= 10_000 ? `${(v/10_000).toFixed(0)}만` : String(v)} />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip
              cursor={false}
              contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-surface border border-border rounded-lg p-3 text-xs space-y-0.5">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-muted-foreground">순위: #{d.x}</div>
                    <div className="text-muted-foreground">연속: {Math.round(d.z / 2)}일</div>
                    <div className="text-muted-foreground">{colorBy === "genre" ? d.genre : d.publisher}</div>
                  </div>
                );
              }}
            />
            {bubbleData.map((d, i) => (
              <Scatter key={i} data={[d]} fill={d.color} fillOpacity={0.7}
                onClick={() => setSelectedNovel(d.novel)} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
        {/* 범례 */}
        <div className="flex flex-wrap gap-2 mt-3">
          {colorBy === "genre"
            ? Object.entries(GENRE_COLORS).map(([g, c]) => (
                <span key={g} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />{g}
                </span>
              ))
            : Object.entries(pubColorMap).slice(0, 8).map(([p, c]) => (
                <span key={p} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />{p}
                </span>
              ))
          }
        </div>
      </div>

      <NovelDetailDrawer
        novel={selectedNovel}
        onClose={() => setSelectedNovel(null)}
        latestDate={latestDate}
        allNovels={novels}
        onSelectNovel={setSelectedNovel}
      />
    </div>
  );
}
