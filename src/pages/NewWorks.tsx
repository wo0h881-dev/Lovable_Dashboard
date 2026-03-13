import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { RankingCard } from "@/components/shared/RankingCard";
import { RankChange } from "@/components/shared/RankChange";
import { NovelCover } from "@/components/shared/NovelCover";
import { NovelDetailDrawer } from "@/components/shared/NovelDetailDrawer";
import { novels, notableWorks, formatViews, type Novel } from "@/data/mockData";

type Period = "7d" | "30d";

export default function NewWorksPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  const newEntries = novels.filter(n => n.isNew);
  const reEntries  = novels.filter(n => n.isReEntry);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black tracking-tight">신작</h1>
        <p className="text-xs text-muted-foreground mt-0.5">신규 진입 · 재진입 · 주목 작품</p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2">
        {([{ k: "7d", l: "최근 7일" }, { k: "30d", l: "최근 30일" }] as { k: Period; l: string }[]).map(({ k, l }) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              period === k ? "bg-primary text-primary-foreground" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
            )}>
            {l}
          </button>
        ))}
      </div>

      {/* Notable works (auto-flagged) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-yellow-400/10 flex items-center justify-center">
            <AlertTriangle size={13} className="text-yellow-400" />
          </div>
          <h2 className="text-sm font-bold">주목 작품</h2>
          <span className="text-xs text-muted-foreground">급상승 · NEW · 재진입 · 조회수 급증</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notableWorks.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("ranking-card border-l-2",
                n.isNew ? "border-l-naver" : n.isReEntry ? "border-l-ridi" : "border-l-up"
              )}
              onClick={() => setSelectedNovel(n)}>
              <div className="flex-shrink-0 flex items-center justify-center px-4 bg-surface-elevated" style={{ minWidth: 52 }}>
                <span className="font-mono font-black text-2xl text-muted-foreground">{n.todayRank}</span>
              </div>
              <div className="flex-shrink-0 py-3 pl-3">
                <NovelCover novel={n} size="md" />
              </div>
              <div className="flex-1 min-w-0 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold line-clamp-2 flex-1">{n.title}</h3>
                  <PlatformBadge platform={n.platform} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{n.author} · {n.genre} · {n.publisher}</div>
                <div className="flex items-center gap-2 mt-2">
                  <RankChange novel={n} />
                  {n.isNew && <span className="text-xs bg-naver/15 text-naver px-2 py-0.5 rounded-full font-semibold">첫 등장</span>}
                  {n.isReEntry && <span className="text-xs bg-ridi/15 text-ridi px-2 py-0.5 rounded-full font-semibold">재진입</span>}
                  {Math.abs(n.viewsChangePct) >= 50 && (
                    <span className="text-xs bg-up/15 text-up px-2 py-0.5 rounded-full font-semibold">
                      조회수 +{n.viewsChangePct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* New entries */}
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-naver" />
            <h2 className="text-sm font-bold">신규 진입 작품</h2>
            <span className="ml-auto font-mono text-xs bg-naver/10 text-naver px-2 py-0.5 rounded-full">{newEntries.length}편</span>
          </div>
          {newEntries.length > 0 ? (
            <div className="space-y-1">
              {newEntries.map(n => (
                <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                     onClick={() => setSelectedNovel(n)}>
                  <NovelCover novel={n} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold line-clamp-1">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground">{n.author} · {n.publisher}</div>
                  </div>
                  <PlatformBadge platform={n.platform} />
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">#{n.todayRank}</div>
                    <div className="text-[10px] text-muted-foreground">{n.firstAppeared}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">해당 기간 신규 진입 없음</p>
          )}
        </div>

        {/* Re-entries */}
        <div className="surface-card">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={15} className="text-ridi" />
            <h2 className="text-sm font-bold">재진입 작품</h2>
            <span className="ml-auto font-mono text-xs bg-ridi/10 text-ridi px-2 py-0.5 rounded-full">{reEntries.length}편</span>
          </div>
          {reEntries.length > 0 ? (
            <div className="space-y-1">
              {reEntries.map(n => (
                <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                     onClick={() => setSelectedNovel(n)}>
                  <NovelCover novel={n} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold line-clamp-1">{n.title}</div>
                    <div className="text-[10px] text-muted-foreground">{n.author} · 이전 피크: #{n.peakRank}</div>
                  </div>
                  <PlatformBadge platform={n.platform} />
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-up">#{n.todayRank}</div>
                    <div className={cn("font-mono text-xs font-semibold text-up")}>
                      ▲{Math.abs(n.rankChange ?? 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">해당 기간 재진입 없음</p>
          )}
        </div>
      </div>

      <NovelDetailDrawer novel={selectedNovel} onClose={() => setSelectedNovel(null)} />
    </div>
  );
}
