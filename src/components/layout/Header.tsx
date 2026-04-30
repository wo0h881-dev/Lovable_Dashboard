import { Calendar, ChevronDown, Sun, Moon, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { dateRangeLabels, type DateRange } from "@/hooks/useTodayCombined";

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (v: DateRange) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  latestDate?: string;
  onToggleSidebar?: () => void;
}

export function Header({
  dateRange,
  onDateRangeChange,
  isDark,
  onToggleTheme,
  latestDate,
  onToggleSidebar,
}: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-3 md:px-4 border-b border-border"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* 좌측: 메뉴 버튼 + 로고 */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors text-muted-foreground hover:text-foreground shrink-0"
            title="사이드바 열기/닫기"
          >
            <Menu size={16} />
          </button>
        )}

        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg">📚</span>
        </div>

        <div className="leading-tight min-w-0">
          <div className="text-sm font-black tracking-tight text-foreground truncate">
            웹소설 PD 대시보드
          </div>
          <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 flex-wrap">
            <span className="truncate">WebNovel Analytics</span>
            {latestDate && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-primary font-semibold whitespace-nowrap">
                  {latestDate} 기준
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 우측 */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-elevated transition-colors text-foreground">
              <Calendar size={13} className="text-muted-foreground shrink-0" />
              <span className="hidden sm:inline">{dateRangeLabels[dateRange]}</span>
              <span className="sm:hidden">{dateRangeLabels[dateRange]}</span>
              <ChevronDown size={12} className="text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface border-border">
            {(Object.keys(dateRangeLabels) as DateRange[]).map((k) => (
              <DropdownMenuItem
                key={k}
                onClick={() => onDateRangeChange(k)}
                className={cn(
                  "text-xs cursor-pointer",
                  dateRange === k && "text-primary font-semibold",
                )}
              >
                {dateRangeLabels[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
