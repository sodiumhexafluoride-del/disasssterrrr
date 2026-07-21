import { useState, useEffect } from "react";
import { 
  Flame, 
  LayoutDashboard, 
  UserCheck, 
  Settings, 
  RefreshCw, 
  Smartphone,
  Globe
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import EvacuationForm from "./components/EvacuationForm";
import AdminPanel from "./components/AdminPanel";
import { DrillState } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "form" | "admin">("dashboard");
  const [drillState, setDrillState] = useState<DrillState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  
  // Detect if the user is using the standalone mobile deep-link form view
  const isDeepLinkedForm = typeof window !== "undefined" && window.location.hash.startsWith("#form");

  // Fetch drill state from API
  const fetchDrillState = async () => {
    try {
      const response = await fetch("/api/state");
      if (response.ok) {
        const data = await response.json();
        setDrillState(data);
        setIsError(false);
      } else {
        setIsError(true);
      }
    } catch (error) {
      console.error("Error fetching drill state:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and hash-change listeners for routing
  useEffect(() => {
    fetchDrillState();

    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#form")) {
        setActiveTab("form");
      } else if (hash === "#admin") {
        setActiveTab("admin");
      } else {
        setActiveTab("dashboard");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Poll state every 3 seconds to keep counts and logs live
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDrillState();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Quick helper to switch state and update hash (to allow clean deep-linking)
  const handleTabChange = (tab: "dashboard" | "form" | "admin") => {
    setActiveTab(tab);
    if (tab === "form") {
      window.location.hash = "#form";
    } else if (tab === "admin") {
      window.location.hash = "#admin";
    } else {
      window.location.hash = "";
    }
  };

  if (isLoading && !drillState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center text-slate-500 font-medium" id="app-loading-screen">
        <div className="animate-spin text-red-600 mb-4">
          <RefreshCw className="w-8 h-8" />
        </div>
        <p className="text-sm">Menghubungi Pusat Kawalan Bencana HSI...</p>
      </div>
    );
  }

  if (isError && !drillState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center" id="app-error-screen">
        <div className="p-4 bg-red-100 text-red-600 rounded-full mb-4">
          <Flame className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Sambungan Gagal</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">
          Sistem gagal menghubungi server Express backend. Sila pastikan pelayan pembangunan telah dimulakan dan beroperasi di port 3000.
        </p>
        <button 
          onClick={fetchDrillState}
          className="mt-4 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
        >
          Cuba Semula
        </button>
      </div>
    );
  }

  // Fallback to empty default state if not fetched
  const currentState = drillState || {
    isRunning: false,
    startTime: null,
    pausedTime: 0,
    currentSituation: "Mengambil data...",
    situationLogs: [],
    evacuatedPersonnel: [],
    victims: [],
    manualEvacuatedCounts: {
      "Kakitangan Hospital": 0,
      "Pesakit": 0,
      "Orang Awam": 0,
      "Agensi/NGO": 0,
      "PAKSI/ERT": 0,
      "Pemerhati": 0
    },
    manualTriageCounts: { "Red": 0, "Yellow": 0, "Green": 0, "White": 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="app-root-layout">
      
      {/* 1. Header (Hidden if using the dedicated mobile deep-link form view to look fully standalone) */}
      {!isDeepLinkedForm && (
        <header className="bg-white border-b border-slate-100 shadow-2xs sticky top-0 z-30" id="main-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Logo / Hospital Branding */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 text-white rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs sm:text-sm font-black text-red-600 block leading-tight tracking-wider uppercase">SISTEM PENGURUSAN BENCANA & KEBAKARAN</span>
                  <span className="text-xs font-normal text-slate-500 tracking-tight leading-tight block">Hospital Sultan Ismail (HSI)</span>
                </div>
                <div className="sm:hidden">
                  <span className="text-sm font-black text-slate-800 tracking-tight">DMS HSI</span>
                </div>
              </div>

              {/* Navigation Tab Buttons */}
              <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => handleTabChange("dashboard")}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "dashboard" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                  id="tab-dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Paparan Utama</span>
                </button>
                <button
                  onClick={() => handleTabChange("form")}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "form" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                  id="tab-form"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Headcount</span>
                </button>
                <button
                  onClick={() => handleTabChange("admin")}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "admin" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
                  id="tab-admin"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Panel Admin</span>
                </button>
              </nav>

            </div>
          </div>
        </header>
      )}

      {/* 2. Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content-wrapper">
        {activeTab === "dashboard" && (
          <Dashboard 
            drillState={currentState} 
            onRefresh={fetchDrillState} 
          />
        )}
        {activeTab === "form" && (
          <EvacuationForm />
        )}
        {activeTab === "admin" && (
          <AdminPanel 
            drillState={currentState} 
            onRefresh={fetchDrillState} 
          />
        )}
      </main>

      {/* 3. Footer (Hidden on deep-linked form for neatness) */}
      {!isDeepLinkedForm && (
        <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium" id="main-footer">
          <div className="max-w-7xl mx-auto px-4">
            <p>{currentState.scenario || "Sistem Pengurusan Bencana Nyata & Selaras"} • Hospital Sultan Ismail Johor Bahru © 2026</p>
            <p className="mt-1 text-[10px] text-slate-300">Pembangunan simulasi fire-drill • Dikuasakan oleh Express, React, dan Tailwind CSS</p>
          </div>
        </footer>
      )}

    </div>
  );
}
