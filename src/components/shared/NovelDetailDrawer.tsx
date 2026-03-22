import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Star, MessageCircle, BookOpen, Calendar, Trophy, Zap, ArrowRightLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
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
  const stats = useMemo(() => (novel ? computeNovelStats(novel) : null), [novel]);

  // 차트 데이터 및 히스토리 가공
  const { rankData, viewsData } = useMemo(() => {
    if (!novel) return { rankData: [], viewsData: [] };
    
    // 날짜순 정렬 (과거 -> 현재)
    const sortedRanks = [...(novel.rankHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedViews = [...(novel.viewsHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { rankData: sortedRanks, viewsData: sortedViews };
  }, [novel]);

  return (
    <AnimatePresence>
      {novel && stats && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-border shadow-2xl bg-[#121214] text-slate-200"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/5 bg-[#121214]/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <PlatformBadge platform={novel.platform} size="md" />
                <span className="text-sm font-bold opacity-80">작품 분석 리포트</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Cover & Title */}
              <div className="flex gap-4">
                <NovelCover novel={novel} size="lg" className="shadow-2xl shrink-0 ring-1 ring-white/10" />
                <div className="flex-1 min-w-0">
                  {novel.isPromotion && (
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/30 mb-2 inline-block">
                      🔥 PROMOTION
                    </span>
                  )}
                  <h2 className="font-bold text-lg leading-tight line-clamp-2 mb-1 text-white">{novel.title}</h2>
                  <p className="text-xs text-slate-400">{novel.author} · <span className="text-primary">{novel.genre}</span></p>
                  <div className="flex items-center gap-2 mt-3">
                    <RankChange novel={novel} />
                    <span className="font-mono text-sm font-black text-white bg-white/5 px-2 py-0.5 rounded">#{novel.todayRank}위</span>
                  </div>
                </div>
              </div>

              {/* 6개 핵심 지표 그리드 (복구 및 강화) */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "오늘 조회/평가", value: formatViews(novel.platform, novel.todayViews), icon: TrendingUp, color: "text-emerald-400" },
                  { label: "최고 순위", value: `#${stats.bestRank || novel.peakRank}위`, icon: Trophy, color: "text-amber-400" },
                  { label: "평점", value: novel.rating.toFixed(1), icon: Star, color: "text-yellow-400" },
                  { label: "댓글 수", value: Number(novel.commentCount || 0).toLocaleString(), icon: MessageCircle, color: "text-sky-400" },
                  { label: "총 회차", value: `${novel.episodeCount}화`, icon: BookOpen, color: "text-primary" },
                  { label: "연속 진입", value: `${stats.currentStreakDays}일`, icon: Calendar, color: "text-orange-400" },
                ].map((item) => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon size={12} className={item.color} />
                      <span className="text-[10px] text-slate-500 font-medium">{item.label}</span>
                    </div>
                    <div className="font-mono text-sm font-bold text-slate-200">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* 차트 섹션 (순위 추이) */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={14} /> 순위 변동 추이
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rankData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="date" hide />
                      <YAxis reversed domain={[1, 'auto']} tick={{fontSize: 10, fill: '#64748b'}} width={20} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#1e1e22', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                      <Line type="monotone" dataKey="rank" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--primary))' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 차트 섹션 (조회수 추이) */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageCircle size={14} /> {novel.platform === 'ridi' ? '평가수' : '조회수'} 추이
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="date" hide />
                      <YAxis tick={{fontSize: 10, fill: '#64748b'}} width={35} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(1)}만` : v} />
                      <Tooltip contentStyle={{ background: '#1e1e22', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 차트아웃 & 재진입 이력 */}
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowRightLeft size={14} /> 차트인/아웃 기록
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">첫 진입일</span>
                    <span className="text-slate-200 font-mono">{stats.firstAppearDate || '기록 없음'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">총 차트인 횟수</span>
                    <span className="text-primary font-bold">{stats.chartInCount}회</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <p className="text-[10px] text-slate-500">최근 주요 변동</p>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="text-slate-400">마지막 차트아웃:</span>
                      <span className="text-slate-200 ml-auto font-mono">{stats.lastChartOutDate || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-400">역대 최저 순위:</span>
                      <span className="text-slate-200 ml-auto font-mono">#{stats.worstRank || '-'}위</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
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
