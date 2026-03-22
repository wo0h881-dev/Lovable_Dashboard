import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Star, MessageCircle, BookOpen, Calendar, Trophy, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, type Novel } from "@/data/mockData";
import { computeNovelStats } from "@/lib/novelStats";

interface Props {
  novel: Novel | null;
  onClose: () => void;
}

export function NovelDetailDrawer({ novel, onClose }: Props) {
  // 최고/최저 순위 및 차트 데이터 가공
  const { chartData, bestRank, worstRank } = useMemo(() => {
    if (!novel?.rankHistory) return { chartData: [], bestRank: "-", worstRank: "-" };

    // 날짜 오름차순 정렬 (차트는 과거 -> 현재 순서)
    const sortedHistory = [...novel.rankHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const ranks = sortedHistory.map(h => h.rank).filter((r): r is number => r !== null && r > 0);
    
    return {
      chartData: sortedHistory,
      bestRank: ranks.length > 0 ? Math.min(...ranks) : "-",
      worstRank: ranks.length > 0 ? Math.max(...ranks) : "-",
    };
  }, [novel]);

  return (
    <AnimatePresence>
      {novel && (
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-border shadow-2xl"
            style={{ background: "hsl(var(--surface))" }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border"
              style={{ background: "hsl(var(--surface))" }}
            >
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-sm font-semibold">작품 분석 데이터</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Cover + info */}
              <div className="flex gap-4">
                <NovelCover novel={novel} size="lg" className="shadow-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  {/* 프로모션 배지 추가 */}
                  {novel.isPromotion && (
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                        <Zap size={10} fill="currentColor" /> PROMOTION
                      </span>
                    </div>
                  )}
                  
                  <h2 className="font-bold text-lg leading-tight line-clamp-2 mb-1">
                    {novel.title}
                  </h2>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{novel.author} · <span className="text-primary font-medium">{novel.genre}</span></p>
                    <p>{novel.publisher}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <RankChange novel={novel} />
                    <span className="font-mono text-sm font-black text-foreground bg-surface-elevated px-2 py-0.5 rounded">
                      현재 {novel.todayRank}위
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="surface-elevated rounded-xl p-3 flex items-center gap-3 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-500">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">최고 순위</div>
                    <div className="font-mono text-base font-black text-yellow-600">#{bestRank}위</div>
                  </div>
                </div>
                <div className="surface-elevated rounded-xl p-3 flex items-center gap-3 border border-border/50">
                  <div className="w-8 h-8 rounded-full bg-slate-400/10 flex items-center justify-center text-slate-500">
                    <TrendingUp size={16} className="rotate-180" />
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground">최저 순위</div>
                    <div className="font-mono text-base font-black text-slate-500">#{worstRank}위</div>
                  </div>
                </div>
                
                {/* 기존 정보들도 시각적으로 보강 */}
                <div className="surface-elevated rounded-xl p-3 flex items-center gap-3 border border-border/50">
                   <Star size={16} className="text-amber-400" fill="currentColor" />
                   <div>
                     <div className="text-[10px] text-muted-foreground">평점</div>
                     <div className="font-mono text-sm font-bold">{novel.rating.toFixed(1)}</div>
                   </div>
                </div>
                <div className="surface-elevated rounded-xl p-3 flex items-center gap-3 border border-border/50">
                   <MessageCircle size={16} className="text-blue-400" />
                   <div>
                     <div className="text-[10px] text-muted-foreground">댓글/평가</div>
                     <div className="font-mono text-sm font-bold">{Number(novel.commentCount || 0).toLocaleString()}</div>
                   </div>
                </div>
              </div>

              {/* Rank chart - 실제 데이터 반영 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                    <TrendingUp size={14} className="text-primary" /> 순위 히스토리
                  </h3>
                  <span className="text-[10px] text-muted-foreground">최근 30일 데이터</span>
                </div>
                <div className="surface-elevated rounded-xl p-4 border border-border/50">
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                        <XAxis 
                          dataKey="date" 
                          hide 
                        />
                        <YAxis 
                          reversed 
                          domain={[1, 'auto']} 
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          width={20}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: "hsl(var(--surface))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontSize: "12px"
                          }}
                          labelFormatter={(label) => `날짜: ${label}`}
                          formatter={(v: any) => [`${v}위`, "순위"]}
                        />
                        <Line 
                          type="stepAfter" 
                          dataKey="rank" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3} 
                          dot={{ r: 2, fill: "hsl(var(--primary))" }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="bg-surface-elevated/50 rounded-xl p-4 text-[11px] text-muted-foreground space-y-2 border border-dashed border-border">
                <div className="flex justify-between">
                  <span>처음 데이터 수집일</span>
                  <span className="text-foreground font-mono">{novel.rankHistory?.[0]?.date || "-"}</span>
                </div>
                <div className="flex justify-between">
                   <span>데이터 업데이트</span>
                   <span className="text-foreground font-mono">{novel.date}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
