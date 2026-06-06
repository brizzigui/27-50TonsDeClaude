import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, CalendarRange, Leaf, Bell, Settings, LogOut } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { Planning } from "./components/Planning";
import { Login } from "./components/Login";
import { UserProfile } from "./components/UserProfile";

type Screen = "login" | "dashboard" | "planning";

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    // Se já tiver token, pula o login
    return localStorage.getItem("access_token") ? "dashboard" : "login";
  });
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    setScreen("login");
  }, []);

  // Escuta evento de logout automático (401 do interceptor)
  useEffect(() => {
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [handleLogout]);

  if (screen === "login") {
    return <Login onLogin={() => setScreen("dashboard")} />;
  }


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f7f9f4]">
      {/* Top navigation */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between h-14 shrink-0 z-20">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center shrink-0">
            <Leaf size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-gray-800 leading-none text-sm sm:text-base">PastoCerto</p>
            <p className="text-gray-400 text-xs leading-none mt-0.5 hidden sm:block">Gestão de Pastagens</p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setScreen("dashboard")}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-md text-sm transition-all
              ${screen === "dashboard"
                ? "bg-white text-green-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <LayoutDashboard size={15} />
            <span className="hidden sm:inline">Painel</span>
          </button>
          <button
            onClick={() => setScreen("planning")}
            className={`
              flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-md text-sm transition-all
              ${screen === "planning"
                ? "bg-white text-green-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <CalendarRange size={15} />
            <span className="hidden sm:inline">Planejamento</span>
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button className="relative w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Bell size={16} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors hidden sm:flex">
            <Settings size={16} className="text-gray-500" />
          </button>
          <button 
            onClick={() => setProfileOpen(true)}
            className="ml-1 sm:ml-2 w-7 h-7 rounded-full bg-green-700 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-white text-xs">JV</span>
          </button>
        </div>
      </header>

      {/* Screen content */}
      <main className="flex-1 overflow-hidden">
        {screen === "dashboard" ? <Dashboard /> : <Planning />}
      </main>

      {/* User Profile Modal */}
      <UserProfile open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

