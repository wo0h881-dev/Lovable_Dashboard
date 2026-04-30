import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar, type SidebarMode } from "./Sidebar";
import { useTodayCombined, type DateRange } from "@/hooks/useTodayCombined";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function AppLayout({ isDark, onToggleTheme }: AppLayoutProps) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("expanded");
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const { latestDate } = useTodayCombined();

  const handleToggleSidebar = () => {
    setSidebarMode((prev) => (prev === "hidden" ? "expanded" : "hidden"));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        latestDate={latestDate}
        onToggleSidebar={handleToggleSidebar}
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
          <Outlet context={{ dateRange, latestDate }} />
        </div>
      </main>
    </div>
  );
}
