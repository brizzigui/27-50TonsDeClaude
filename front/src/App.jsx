import { Routes, Route, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  Leaf,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePiquetes } from "./hooks/usePiquetes";
import DashboardPage from "./pages/DashboardPage";
import PlanningPage from "./pages/PlanningPage";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/planejamento",
    label: "Planejamento",
    icon: CalendarClock,
  },
];

function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-900/50 border-r border-white/[0.06] p-5">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            PastureAI
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">
            Gestão de Pastagens
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl
              text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-gray-600 text-center">
          MVP Hackathon v1.0
        </p>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">PastureAI</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <nav className="px-4 pb-4 space-y-1 animate-fadeIn">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

export default function App() {
  // Initialize data on mount
  usePiquetes();

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#0a0f1a]">
      <Sidebar />
      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-5 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/planejamento" element={<PlanningPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
