import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header, type DateRange, type PlatformFilter } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [platform, setPlatform] = useState<PlatformFilter>("all");

  return (
    <div className="min-h-screen bg-background">
      <Header
        dateRange={dateRange}
        platform={platform}
        onDateRangeChange={setDateRange}
        onPlatformChange={setPlatform}
      />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} />

      {/* Main content — offset by header and sidebar */}
      <main
        className="pt-14 transition-all duration-200"
        style={{ marginLeft: sidebarOpen ? 220 : 64 }}
      >
        <div className="p-6">
          <Outlet context={{ dateRange, platform }} />
        </div>
      </main>
    </div>
  );
}
