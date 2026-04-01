import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header, type DateRange, type PlatformFilter } from "./Header";
import { Sidebar, type SidebarMode } from "./Sidebar";
import { useTodayCombined } from "@/hooks/useTodayCombined";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function AppLayout({ isDark, onToggleTheme }: AppLayoutProps) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded");
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  const { latestDate } = useTodayCombined();

  return (
    <div className="min-h-screen bg-background">
      <Header
        dateRange={dateRange}
        platform={platform}
        onDateRangeChange={setDateRange}
        onPlatformChange={setPlatform}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        latestDate={latestDate}
        onOpenSidebar={() => setSidebarMode("expanded")}
      />

      <Sidebar mode={sidebarMode} onChangeMode={setSidebarMode} />

      <main
        className={cn(
          "pt-14 transition-all duration-200",
          sidebarMode === "expanded" && "lg:ml-[220px]",
          sidebarMode === "collapsed" && "lg:ml-16",
          sidebarMode === "hidden" && "lg:ml-0",
        )}
      >
        <div className="p-3 md:p-6">
          <Outlet context={{ dateRange, platform, latestDate }} />
        </div>
      </main>
    </div>
  );
}
