// src/components/layout/AppLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header, type DateRange, type PlatformFilter } from "./Header";
import { Sidebar } from "./Sidebar";
import { useTodayCombined } from "@/hooks/useTodayCombined";

interface AppLayoutProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function AppLayout({ isDark, onToggleTheme }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  // 최신 업데이트 날짜를 레이아웃에서 가져와 모든 페이지에 제공
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
      />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} />
      <main
        className="pt-14 transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? 220 : 64 }}
      >
        <div className="p-6">
          <Outlet context={{ dateRange, platform, latestDate }} />
        </div>
      </main>
    </div>
  );
}
