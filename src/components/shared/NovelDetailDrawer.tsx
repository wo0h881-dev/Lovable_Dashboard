import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Star, MessageCircle, BookOpen, Calendar, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { NovelCover } from "@/components/shared/NovelCover";
import { RankChange } from "@/components/shared/RankChange";
import { formatViews, trendData, type Novel } from "@/data/mockData";

interface Props {
  novel: Novel | null;
  onClose: () => void;
}

export function NovelDetailDrawer({ novel, onClose }: Props) {
  return (
    <AnimatePresence>
      {novel && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-border"
            style={{ background: "hsl(var(--surface))" }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border"
                 style={{ background: "hsl(var(--surface))" }}>
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-sm font-semibold">작품 상세</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Cover + info */}
              <div className="flex gap-4">
                <NovelCover novel={novel} size="lg" />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base leading-snug line-clamp-3 mb-1">{novel.title}</h2>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>{novel.author} · <span className="text-primary/80">{novel.genre}</span></div>
                    <div>{novel.publisher}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <RankChange novel={novel} />
                    <span className="font-mono text-xs font-bold text-foreground">#{novel.todayRank}</span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "오늘 조회/평가", value: formatViews(novel.platform, novel.todayViews), icon: TrendingUp, color: "text-up" },
                  { label: "최고 순위",      value: `#${novel.peakRank}위`, icon: Trophy, color: "text-yellow-400" },
                  { label: "평점",           value: novel.rating.toString(), icon: Star, color: "text-yellow-400" },
                  { label: "댓글",           value: {Number(novel.commentCount ?? 0).toLocaleString("ko-KR")}, icon: MessageCircle, color: "text-ridi" },
                  { label: "총 회차",        value: `${novel.episodeCount}화`, icon: BookOpen, color: "text-primary" },
                  { label: "연속 진입",      value: `${novel.consecutiveDays}일`, icon: Calendar, color: "text-naver" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="surface-elevated rounded-lg p-3 flex items-center gap-2">
                    <Icon size={14} className={color} />
                    <div>
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                      <div className="font-mono text-sm font-bold">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rank chart */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">순위 추이 (최근 30일)</h3>
                <div className="surface-elevated rounded-lg p-3">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={6} />
                      <YAxis reversed domain={[1, 20]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`#${v}위`, "순위"]}
                      />
                      <Line type="monotone" dataKey="novel1Rank" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Views chart */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  {novel.platform === "ridi" ? "평가수" : "조회수"} 추이
                </h3>
                <div className="surface-elevated rounded-lg p-3">
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={6} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontFamily: "Roboto Mono" }}
                             tickFormatter={(v) => novel.platform === "ridi" ? v.toString() : `${(v/10000).toFixed(0)}만`} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [formatViews(novel.platform, v), novel.platform === "ridi" ? "평가수" : "조회수"]}
                      />
                      <Line type="monotone" dataKey="novel1Views" stroke="hsl(var(--ridi))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Meta */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>첫 등장: <span className="text-foreground font-mono">{novel.firstAppeared}</span></div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
