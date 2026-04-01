// src/components/layout/Header.tsx
import { Calendar, ChevronDown, Filter, Sun, Moon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DateRange = "today" | "7d" | "30d";
export type PlatformFilter = "all" | "naver" | "kakao" | "ridi";

interface Props {
  dateRange: DateRange;
  platform: PlatformFilter;
  onDateRangeChange: (v: DateRange) => void;
  onPlatformChange: (v: PlatformFilter) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  latestDate?: string;
}

const dateLabels: Record<DateRange, string> = { today: "오늘", "7d": "최근 7일", "30d": "최근 30일" };
const platformLabels: Record<PlatformFilter, string> = { all: "전체", naver: "네이버", kakao: "카카오", ridi: "리디" };
const platformColors: Record<PlatformFilter, string> = {
  all: "text-foreground",
  naver: "text-naver",
  kakao: "text-kakao",
  ridi: "text-ridi",
};

export function Header({ dateRange, platform, onDateRangeChange, onPlatformChange, isDark, onToggleTheme, latestDate }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 border-b border-border"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* 로고 + 업데이트 날짜 */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-lg">📚</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-black tracking-tight text-foreground">웹소설 PD 대시보드</div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            WebNovel Analytics
            {latestDate && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-primary font-semibold">
                  {latestDate} 기준
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <button
  onClick={() => setSidebarMode("expanded")}
  className="p-2 rounded-lg hover:bg-surface-elevated"
>
  <Menu size={18} />
</button>

      {/* 우측: 필터 + 테마 토글 */}
      <div className="flex items-center gap-2">
        {/* Date filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-elevated transition-colors text-foreground">
              <Calendar size={13} className="text-muted-foreground" />
              {dateLabels[dateRange]}
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-border">
            {(Object.keys(dateLabels) as DateRange[]).map(k => (
              <DropdownMenuItem
                key={k}
                onClick={() => onDateRangeChange(k)}
                className={cn("text-xs cursor-pointer", dateRange === k && "text-primary font-semibold")}
              >
                {dateLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Platform filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-elevated transition-colors">
              <Filter size={13} className="text-muted-foreground" />
              <span className={cn(platformColors[platform])}>{platformLabels[platform]}</span>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-border">
            {(Object.keys(platformLabels) as PlatformFilter[]).map(k => (
              <DropdownMenuItem
                key={k}
                onClick={() => onPlatformChange(k)}
                className={cn("text-xs cursor-pointer", platformColors[k], platform === k && "font-semibold")}
              >
                {platformLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 다크/라이트 토글 */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground"
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        )}
      </div>
    </header>
  );
}
