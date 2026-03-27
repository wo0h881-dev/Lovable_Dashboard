// src/pages/ReadingGoals.tsx
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, X, Target, Plus,
  CheckCircle2, Clock, BookMarked, PauseCircle, Trash2,
  Edit2, Calendar, ChevronRight, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { NovelCover } from "@/components/shared/NovelCover";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { type Novel } from "@/data/mockData";

// ── 타입 & 초기화 ──────────────────────────────────────────
type ReadingStatus = "reading" | "want" | "done" | "paused";

interface ReadingGoal {
  id: string;
  novelId: string;
  title: string;
  author: string;
  publisher: string;
  platform: string;
  genre: string;
  thumbnailUrl?: string;
  coverGradient: string;
  coverEmoji: string;
  episodeCount: number;
  status: ReadingStatus;
  currentEpisode: number;
  targetDays?: number;
  dailyTarget?: number;
  targetDate?: string; 
  addedAt: string;
}

const STORAGE_KEY = "webnovel_reading_goals";
const loadGoals = (): ReadingGoal[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const saveGoals = (goals: ReadingGoal[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));

const STATUS_CONFIG: Record<ReadingStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  reading: { label: "읽는 중", icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
  want: { label: "읽고 싶어요", icon: BookMarked, color: "text-sky-500", bg: "bg-sky-500/10" },
  done: { label: "완독", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  paused: { label: "중단", icon: PauseCircle, color: "text-slate-500", bg: "bg-slate-500/10" },
};

// ── 목표 설정 모달 ──────────────────────────────────────────
function GoalModal({ novel, existingGoal, onSave, onClose }: { novel?: Novel; existingGoal?: ReadingGoal; onSave: (goal: ReadingGoal) => void; onClose: () => void; }) {
  const [status, setStatus] = useState<ReadingStatus>(existingGoal?.status ?? "reading");
  const [currentEpisode, setCurrentEpisode] = useState<number | "">(existingGoal?.currentEpisode ?? "");
  const [targetDays, setTargetDays] = useState<number | "">(existingGoal?.targetDays ?? "");
  const [dailyTarget, setDailyTarget] = useState<number | "">(existingGoal?.dailyTarget ?? "");
  const [goalMode, setGoalMode] = useState<"days" | "daily" | "date">(
    existingGoal?.targetDate ? "date" : existingGoal?.dailyTarget ? "daily" : "days"
  );
  const [targetDate, setTargetDate] = useState(existingGoal?.targetDate ?? "");

  const ep = novel?.episodeCount ?? existingGoal?.episodeCount ?? 0;

  const stats = useMemo(() => {
    const cur = currentEpisode === "" ? 0 : Number(currentEpisode);
    const remaining = Math.max(0, ep - cur);
    if (goalMode === "days" && targetDays !== "" && Number(targetDays) > 0) return { daily: Math.ceil(remaining / Number(targetDays)), days: Number(targetDays) };
    if (goalMode === "daily" && dailyTarget !== "" && Number(dailyTarget) > 0) return { daily: Number(dailyTarget), days: Math.ceil(remaining / Number(dailyTarget)) };
    if (goalMode === "date" && targetDate) {
      const d = Math.max(0, Math.ceil((new Date(targetDate).getTime() - new Date().setHours(0,0,0,0)) / 86400000));
      return { daily: d > 0 ? Math.ceil(remaining / d) : remaining, days: d };
    }
    return null;
  }, [goalMode, targetDays, dailyTarget, targetDate, currentEpisode, ep]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold">{existingGoal ? "목표 수정" : "새 목표 추가"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-elevated text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(STATUS_CONFIG) as [ReadingStatus, typeof STATUS_CONFIG[ReadingStatus]][]).map(([key, cfg]) => (
              <button key={key} onClick={() => setStatus(key)} className={cn("flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-bold transition-all", status === key ? `${cfg.bg} ${cfg.color} border-current/30` : "bg-surface border-border text-muted-foreground")}>
                <cfg.icon size={14} />{cfg.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground ml-1">현재 읽은 화수</label>
            <input type="number" value={currentEpisode} onChange={e => setCurrentEpisode(e.target.value === "" ? "" : Math.min(ep, Number(e.target.value)))} placeholder="0" className="w-full px-4 py-3 text-sm rounded-xl bg-surface-elevated border border-border outline-none font-mono" />
          </div>

          <div className="space-y-3">
             <div className="flex gap-1 bg-surface-elevated p-1 rounded-lg">
                {[{id:'days', l:'기간'}, {id:'daily', l:'편수'}, {id:'date', l:'날짜'}].map(m => (
                  <button key={m.id} onClick={() => setGoalMode(m.id as any)} className={cn("flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all", goalMode === m.id ? "bg-surface text-primary shadow-sm" : "text-muted-foreground")}>{m.l}</button>
                ))}
             </div>
             <div className="min-h-[50px] flex items-center">
               {goalMode === 'days' && <div className="flex items-center gap-2 w-full"><input type="number" value={targetDays} onChange={e => setTargetDays(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-surface-elevated border border-border outline-none font-mono" /><span className="text-xs font-bold text-muted-foreground">일 안에</span></div>}
               {goalMode === 'daily' && <div className="flex items-center gap-2 w-full"><span className="text-xs font-bold text-muted-foreground">하루</span><input type="number" value={dailyTarget} onChange={e => setDailyTarget(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-surface-elevated border border-border outline-none font-mono" /><span className="text-xs font-bold text-muted-foreground">편씩</span></div>}
               {goalMode === 'date' && <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full px-4 py-2.5 text-sm rounded-xl bg-surface-elevated border border-border outline-none" />}
             </div>
          </div>

          <button 
            onClick={() => {
              onSave({
                id: existingGoal?.id ?? `goal_${Date.now()}`,
                novelId: novel?.id ?? existingGoal?.novelId ?? "",
                title: novel?.title ?? existingGoal?.title ?? "",
                author: novel?.author ?? existingGoal?.author ?? "",
                publisher: novel?.publisher ?? existingGoal?.publisher ?? "",
                platform: novel?.platform ?? existingGoal?.platform ?? "",
                genre: novel?.genre ?? existingGoal?.genre ?? "",
                thumbnailUrl: novel?.thumbnailUrl ?? existingGoal?.thumbnailUrl,
                coverGradient: novel?.coverGradient ?? existingGoal?.coverGradient ?? "from-slate-800 to-gray-600",
                coverEmoji: novel?.coverEmoji ?? existingGoal?.coverEmoji ?? "📖",
                episodeCount: ep,
                status,
                currentEpisode: Number(currentEpisode) || 0,
                targetDays: goalMode === 'days' ? (Number(targetDays) || undefined) : undefined,
                dailyTarget: goalMode === 'daily' ? (Number(dailyTarget) || undefined) : undefined,
                targetDate: goalMode === 'date' ? targetDate : undefined,
                addedAt: existingGoal?.addedAt ?? new Date().toISOString().slice(0, 10),
              });
              onClose();
            }}
            className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black rounded-xl"
          >
            저장하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────
export default function ReadingGoalsPage() {
  const { data: novels = [] } = useTodayCombined();
  const [goals, setGoals] = useState<ReadingGoal[]>(loadGoals);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [editGoal, setEditGoal] = useState<ReadingGoal | null>(null);
  const [modalNovel, setModalNovel] = useState<Novel | null>(null);
  
  // 개별 카드용 진도 업데이트 상태 관리
  const [localEpisodes, setLocalEpisodes] = useState<Record<string, number | "">>({});

  useEffect(() => { saveGoals(goals); }, [goals]);

  const displayResults = useMemo(() => {
    if (search.trim()) return novels.filter(n => n.title.includes(search) || n.author.includes(search)).slice(0, 10);
    return isSearchFocused ? novels.slice(0, 10) : [];
  }, [search, novels, isSearchFocused]);

  const updateGoal = (id: string, updates: Partial<ReadingGoal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const cycleStatus = (id: string, current: ReadingStatus) => {
    const sequence: ReadingStatus[] = ["reading", "want", "done", "paused"];
    const next = sequence[(sequence.indexOf(current) + 1) % sequence.length];
    updateGoal(id, { status: next });
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black">독서 목표</h1>
          <p className="text-xs text-muted-foreground mt-1">책장에 보관된 {goals.length}개의 작품</p>
        </div>
      </header>

      {/* 검색창 */}
      <div className="relative z-30">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            value={search} onFocus={() => setIsSearchFocused(true)} onChange={e => setSearch(e.target.value)}
            placeholder="새로운 작품 검색 및 추가"
            className="w-full pl-11 pr-4 py-3.5 text-xs rounded-2xl bg-surface border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <AnimatePresence>
          {(isSearchFocused || search) && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsSearchFocused(false)} />
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute mt-2 w-full bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-3 border-b border-border bg-surface-elevated/50 text-[10px] font-bold text-muted-foreground">{search ? '검색 결과' : '실시간 인기 순위'}</div>
                {displayResults.map((n, idx) => {
                  const addedGoal = goals.find(g => g.novelId === n.id);
                  return (
                    <div key={n.id} onClick={() => { addedGoal ? setEditGoal(addedGoal) : setModalNovel(n); setIsSearchFocused(false); setSearch(""); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-elevated cursor-pointer transition-colors">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/40 w-4">{idx + 1}</span>
                      <NovelCover novel={n} size="sm" />
                      <div className="flex-1 min-w-0"><p className="text-xs font-bold line-clamp-1">{n.title}</p></div>
                      <div className="shrink-0">
                        {addedGoal ? <span className="text-[9px] font-bold text-muted-foreground px-2 py-1 rounded-full bg-surface-elevated border border-border">추가됨</span> : <button className="text-[9px] font-black text-primary px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">추가</button>}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 카드 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => {
          const cfg = STATUS_CONFIG[goal.status];
          const progress = Math.min(100, Math.round((goal.currentEpisode / goal.episodeCount) * 100));
          const currentLocal = localEpisodes[goal.id] ?? goal.currentEpisode;

          return (
            <motion.div 
              key={goal.id} 
              layout 
              onClick={() => setEditGoal(goal)} // [수정] 카드 전체 클릭 시 수정
              className="bg-surface border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
            >
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className={`w-14 h-20 rounded-lg bg-gradient-to-br ${goal.coverGradient} flex items-center justify-center text-2xl shadow-inner`}>{goal.coverEmoji}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold line-clamp-1 pr-2">{goal.title}</h3>
                    {/* [수정] 상태 표시 클릭 시 상태 변경 */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); cycleStatus(goal.id, goal.status); }}
                      className={cn("shrink-0 text-[9px] font-black px-2 py-1 rounded-full border transition-all active:scale-95", cfg.bg, cfg.color, "border-current/20")}
                    >
                      {cfg.label}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{goal.author}</p>
                  
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-end text-[10px] font-bold">
                      <span className="text-muted-foreground">{goal.currentEpisode} / {goal.episodeCount}화</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                      <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* [수정] 카드 아래 진도 업데이트 영역 */}
              <div className="mt-4 pt-4 border-t border-dashed border-border flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    value={currentLocal}
                    onChange={e => setLocalEpisodes({ ...localEpisodes, [goal.id]: e.target.value === "" ? "" : Number(e.target.value) })}
                    placeholder="읽은 화수"
                    className="w-full pl-3 pr-8 py-2 text-[11px] rounded-lg bg-surface-elevated border border-border focus:ring-1 focus:ring-primary outline-none font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-bold">화</span>
                </div>
                <button 
                  onClick={() => {
                    const newVal = Number(currentLocal) || 0;
                    updateGoal(goal.id, { 
                      currentEpisode: newVal, 
                      status: newVal >= goal.episodeCount ? "done" : goal.status 
                    });
                    setLocalEpisodes({ ...localEpisodes, [goal.id]: newVal });
                  }}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg transition-transform active:scale-95"
                >
                  <Save size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {modalNovel && <GoalModal novel={modalNovel} onSave={g => setGoals([g, ...goals])} onClose={() => setModalNovel(null)} />}
        {editGoal && <GoalModal existingGoal={editGoal} onSave={g => setGoals(goals.map(prev => prev.id === g.id ? g : prev))} onClose={() => setEditGoal(null)} />}
      </AnimatePresence>
    </div>
  );
}
