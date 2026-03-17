import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — sempre visível em md+, drawer em mobile */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transition-transform duration-300
        md:relative md:translate-x-0 md:z-auto
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

        {/* Topbar mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-sm">Price Scraper</span>
        </div>

        <div className="p-4 md:p-8 flex-1 space-y-6 md:space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}