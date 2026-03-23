// src/App.tsx
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import OverviewPage from "./pages/Overview";
import RankingsPage from "./pages/Rankings";
import GenrePage from "./pages/GenreAnalysis";
import PublishersPage from "./pages/Publishers";
import TrendsPage from "./pages/Trends";
import NewWorksPage from "./pages/NewWorks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // 기본값: 다크모드
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout isDark={isDark} onToggleTheme={() => setIsDark(v => !v)} />}>
              <Route path="/"           element={<OverviewPage />} />
              <Route path="/rankings"   element={<RankingsPage />} />
              <Route path="/genres"     element={<GenrePage />} />
              <Route path="/publishers" element={<PublishersPage />} />
              <Route path="/trends"     element={<TrendsPage />} />
              <Route path="/new-works"  element={<NewWorksPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
