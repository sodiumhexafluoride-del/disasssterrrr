import { useState, useEffect } from "react";
import { 
  Clock, 
  Timer, 
  Users, 
  UserCheck, 
  Activity, 
  Flame, 
  FileSpreadsheet, 
  Search, 
  X, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  Cloud
} from "lucide-react";
import { DrillState, EvacuationCategory, TriageCategory } from "../types";

interface DashboardProps {
  drillState: DrillState;
  onRefresh: () => void;
}

export default function Dashboard({ drillState, onRefresh }: DashboardProps) {
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [stopwatchTime, setStopwatchTime] = useState("00:00:00");
  const [isEvacListOpen, setIsEvacListOpen] = useState(false);
  const [isVictimListOpen, setIsVictimListOpen] = useState(false);
  const [isBilikListOpen, setIsBilikListOpen] = useState(false);
  
  // Search and filter states
  const [evacSearch, setEvacSearch] = useState("");
  const [evacFilter, setEvacFilter] = useState<string>("Semua");
  const [victimSearch, setVictimSearch] = useState("");
  const [victimFilter, setVictimFilter] = useState<string>("Semua");
  const [bilikSearch, setBilikSearch] = useState("");
  const [bilikFilter, setBilikFilter] = useState<string>("Semua");

  // Firebase status state
  const [firebaseActive, setFirebaseActive] = useState(false);

  useEffect(() => {
    const checkFirebase = async () => {
      try {
        const res = await fetch("/api/firebase/status");
        if (res.ok) {
          const data = await res.json();
          setFirebaseActive(data.active);
        }
      } catch (e) {
        console.error("Failed to fetch Firebase status in Dashboard", e);
      }
    };
    checkFirebase();
    const interval = setInterval(checkFirebase, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time Local Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
      };
      setCurrentDate(now.toLocaleDateString('ms-MY', dateOptions));

      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      };
      setCurrentTime(now.toLocaleTimeString('ms-MY', timeOptions));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Running Clock / Timer calculation
  useEffect(() => {
    let timerId: any;
    
    const updateStopwatch = () => {
      if (!drillState.isRunning) {
        // Paused state
        const elapsed = drillState.pausedTime;
        setStopwatchTime(formatMilliseconds(elapsed));
        return;
      }
      
      if (drillState.startTime) {
        const elapsed = Date.now() - drillState.startTime + drillState.pausedTime;
        setStopwatchTime(formatMilliseconds(elapsed));
      }
    };

    updateStopwatch();
    if (drillState.isRunning) {
      timerId = setInterval(updateStopwatch, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [drillState.isRunning, drillState.startTime, drillState.pausedTime]);

  const formatMilliseconds = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const hStr = hours.toString().padStart(2, "0");
    const mStr = minutes.toString().padStart(2, "0");
    const sStr = seconds.toString().padStart(2, "0");
    
    return `${hStr}:${mStr}:${sStr}`;
  };

  // Calculations for total evacuated personnel
  // Counts can either be dynamically calculated from the list of registered people, or fallback to the manual counter if that's higher
  const categories: EvacuationCategory[] = [
    "Kakitangan Hospital",
    "Pesakit",
    "Orang Awam",
    "Agensi/NGO",
    "PAKSI/ERT"
  ];

  const allCategories: EvacuationCategory[] = [
    "Kakitangan Hospital",
    "Pesakit",
    "Orang Awam",
    "Agensi/NGO",
    "PAKSI/ERT",
    "Pemerhati"
  ];

  const getEvacCount = (cat: EvacuationCategory) => {
    // Only count individuals registered for Zon Berkumpul (exclude Bilik Gerakan)
    const fromList = drillState.evacuatedPersonnel.filter(
      p => p.category === cat && (!p.departmentOrWard || !p.departmentOrWard.includes("Bilik Gerakan"))
    ).length;
    const manualVal = drillState.manualEvacuatedCounts[cat] || 0;
    return Math.max(fromList, manualVal);
  };

  const totalEvacuated = categories.reduce((sum, cat) => sum + getEvacCount(cat), 0);

  // Zon Berkumpul Headcount Data
  const zonBerkumpulPersonnel = drillState.evacuatedPersonnel.filter(
    p => !p.departmentOrWard || !p.departmentOrWard.includes("Bilik Gerakan")
  );

  // Bilik Gerakan Headcount Data
  const bilikGerakanPersonnel = drillState.evacuatedPersonnel.filter(
    p => p.departmentOrWard && p.departmentOrWard.includes("Bilik Gerakan")
  );

  // Calculations for triage victims
  const triageTypes: TriageCategory[] = ["Red", "Yellow", "Green", "White"];
  const getVictimCount = (tri: TriageCategory) => {
    const fromList = drillState.victims.filter(v => v.triage === tri).length;
    const manualVal = drillState.manualTriageCounts[tri] || 0;
    return Math.max(fromList, manualVal);
  };

  const totalVictims = triageTypes.reduce((sum, tri) => sum + getVictimCount(tri), 0);

  // Filtered lists
  const filteredEvacuated = zonBerkumpulPersonnel.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(evacSearch.toLowerCase()) || 
                          person.roleOrId.toLowerCase().includes(evacSearch.toLowerCase()) ||
                          (person.departmentOrWard && person.departmentOrWard.toLowerCase().includes(evacSearch.toLowerCase()));
    const matchesFilter = evacFilter === "Semua" || person.category === evacFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredVictims = drillState.victims.filter(victim => {
    const matchesSearch = victim.name.toLowerCase().includes(victimSearch.toLowerCase()) || 
                          (victim.locationFound && victim.locationFound.toLowerCase().includes(victimSearch.toLowerCase())) ||
                          (victim.injuryDetails && victim.injuryDetails.toLowerCase().includes(victimSearch.toLowerCase()));
    const matchesFilter = victimFilter === "Semua" || victim.triage === victimFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredBilikGerakan = bilikGerakanPersonnel.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(bilikSearch.toLowerCase()) || 
                          person.roleOrId.toLowerCase().includes(bilikSearch.toLowerCase()) ||
                          (person.departmentOrWard && person.departmentOrWard.toLowerCase().includes(bilikSearch.toLowerCase()));
    const matchesFilter = bilikFilter === "Semua" || person.category === bilikFilter;
    return matchesSearch && matchesFilter;
  });

  const getTriageNameAndStyle = (triage: TriageCategory) => {
    switch (triage) {
      case "Red":
        return { name: "Zon Merah (Kritikal)", text: "text-red-600", bg: "bg-red-50 border-red-200", badge: "bg-red-600 text-white" };
      case "Yellow":
        return { name: "Zon Kuning (Semi-Kritikal)", text: "text-amber-600", bg: "bg-amber-50 border-amber-200", badge: "bg-amber-500 text-white" };
      case "Green":
        return { name: "Zon Hijau (Ringan)", text: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-600 text-white" };
      case "White":
        return { name: "Zon Putih (Mati)", text: "text-gray-600", bg: "bg-slate-50 border-slate-200", badge: "bg-slate-500 text-white" };
    }
  };

  const getSituationTheme = () => {
    const currentLog = drillState.situationLogs.find(log => log.situation === drillState.currentSituation) || drillState.situationLogs[0];
    const type = currentLog?.type || "info";

    switch (type) {
      case "critical":
        return {
          bg: "bg-red-50 border-red-200",
          borderBlink: "border-red-600 animate-border-blink-red",
          iconBg: "bg-red-100 text-red-600",
          headerText: "text-red-600"
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200",
          borderBlink: "border-amber-600 animate-border-blink-amber",
          iconBg: "bg-amber-100 text-amber-600",
          headerText: "text-amber-600"
        };
      case "success":
        return {
          bg: "bg-emerald-50 border-emerald-200",
          borderBlink: "border-emerald-600 animate-border-blink-emerald",
          iconBg: "bg-emerald-100 text-emerald-600",
          headerText: "text-emerald-600"
        };
      case "info":
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          borderBlink: "border-blue-600 animate-border-blink-blue",
          iconBg: "bg-blue-100 text-blue-600",
          headerText: "text-blue-600"
        };
    }
  };

  const situationTheme = getSituationTheme();

  return (
    <div className="space-y-6" id="dashboard-main">
      {/* Hospital Branding Banner (Moved to top & made smaller and slimmer) */}
      <div className="bg-white py-3 px-5 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3" id="hsi-brand-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 text-red-600 rounded-lg animate-pulse shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[10px] font-extrabold text-red-600 tracking-wider uppercase">LATIHAN KEBAKARAN</h2>
            <h1 className="text-md md:text-lg font-black text-slate-800 tracking-tight">Hospital Sultan Ismail</h1>
          </div>
        </div>
        <div className="pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-4 text-xs text-slate-500 flex items-center justify-between md:justify-start w-full md:w-auto gap-4 shrink-0">
          <p className="flex items-center gap-2 font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0 animate-ping"></span>
            {drillState.scenario || "Sistem Pengurusan Bencana Nyata & Selaras"}
          </p>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0" title={firebaseActive ? "Disambungkan ke Firebase Firestore (Masa Nyata)" : "Mod Sesi Lokal (db.json)"}>
            <Cloud className={`w-3.5 h-3.5 ${firebaseActive ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span className={firebaseActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 font-semibold'}>
              {firebaseActive ? 'Awan Aktif' : 'Lokal Cache'}
            </span>
          </div>
        </div>
      </div>

      {/* Upper Grid: Situasi Semasa, Digital Clock and Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Situasi Semasa (Swapped) */}
        <div className={`relative ${situationTheme.bg} border p-6 rounded-2xl shadow-md transition-all duration-300 flex flex-col justify-between`} id="current-situation-banner">
          <div className={`absolute inset-0 border-4 rounded-2xl pointer-events-none ${situationTheme.borderBlink}`}></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className={`p-2.5 ${situationTheme.iconBg} rounded-xl shrink-0 mt-1 transition-all duration-300`}>
              <Bell className="w-8 h-8 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={`text-xs font-black ${situationTheme.headerText} uppercase tracking-widest transition-colors duration-300`}>SITUASI SEMASA</h3>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-relaxed transition-all duration-300" title={drillState.currentSituation}>
                {drillState.currentSituation}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Live Digital Clock */}
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl flex flex-col justify-between shadow-xs border border-slate-800" id="digital-clock-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">WAKTU SEKARANG</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3">
            <div className="text-5xl font-extrabold font-mono tracking-tight text-white">{currentTime || "00:00:00"}</div>
            <div className="text-xs text-slate-400 mt-1 capitalize font-medium">{currentDate}</div>
          </div>
        </div>

        {/* Card 3: Drill Running Stopwatch */}
        <div className={`relative bg-red-950 text-red-50 p-6 rounded-2xl flex flex-col justify-between shadow-xs border ${drillState.isRunning ? "border-transparent" : "border-red-900/50"}`} id="drill-stopwatch-card">
          {drillState.isRunning && (
            <div className="absolute inset-0 border-2 border-red-500 rounded-2xl pointer-events-none animate-pulse"></div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-red-400 uppercase">TEMPOH LATIHAN BERJALAN</span>
            {drillState.isRunning && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-mono text-emerald-300 font-semibold uppercase">
                  AKTIF
                </span>
              </div>
            )}
          </div>
          <div className="my-3">
            <div className="text-5xl font-extrabold font-mono tracking-tight text-red-100">{stopwatchTime}</div>
            <div className="text-xs text-red-400 mt-1 uppercase font-medium">
              {drillState.isRunning ? "Status: Latihan Aktif" : "Status: Dihentikan Sementara"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2 spans on desktop): EVACUEES & TRIAGE VICTIMS */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Section: Evacuated Personnel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs" id="evacuation-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-emerald-600 w-5 h-5" />
                  Headcount - Zon Berkumpul
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Jumlah mangsa yang selamat di Zon Berkumpul</p>
              </div>
              <button 
                onClick={() => setIsEvacListOpen(true)}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-view-evacuee-list"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Lihat Senarai ({zonBerkumpulPersonnel.length})
              </button>
            </div>

            {/* Large Counter Box */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="md:col-span-1 bg-emerald-600 text-white p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-xs">
                <span className="text-xs font-bold tracking-wider opacity-90 uppercase">JUMLAH SELAMAT</span>
                <span className="text-5xl font-extrabold font-mono mt-1">{totalEvacuated}</span>
                <span className="text-[10px] opacity-75 mt-1 font-medium">Kakitangan & Awam</span>
              </div>

              {/* Sub categories count */}
              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((cat) => {
                  const val = getEvacCount(cat);
                  const registeredNum = zonBerkumpulPersonnel.filter(p => p.category === cat).length;
                  
                  return (
                    <div key={cat} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <span className="text-xs font-extrabold text-slate-500 leading-tight block min-h-[32px]">{cat}</span>
                      <div className="mt-2">
                        <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 block">{val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            

          </div>

          {/* Section: Victims & Triage */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs" id="triage-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-red-600 w-5 h-5 animate-pulse" />
                  Headcount - Mangsa Cedera
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Jumlah mangsa cedera yang di rujuk ke Jabatan Kecemasan</p>
              </div>
              <button 
                onClick={() => setIsVictimListOpen(true)}
                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-view-victim-list"
              >
                <Users className="w-4 h-4" />
                Senarai Mangsa ({drillState.victims.length})
              </button>
            </div>

            {/* Total victims and grid breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 bg-red-900 text-white p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-xs">
                <span className="text-xs font-bold tracking-wider opacity-95 uppercase">JUMLAH MANGSA</span>
                <span className="text-5xl font-extrabold font-mono mt-1">{totalVictims}</span>
                <span className="text-[10px] opacity-80 mt-1 font-medium">Menerima Rawatan</span>
              </div>

              {/* Triage colored boxes */}
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Red Triage */}
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-800">TAG MERAH</span>
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block animate-ping"></span>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold font-mono text-red-700 block">{getVictimCount("Red")}</span>
                    <span className="text-[10px] text-red-600 font-bold block mt-1">Kritikal</span>
                  </div>
                </div>

                {/* Yellow Triage */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800">TAG KUNING</span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block animate-ping"></span>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold font-mono text-amber-600 block">{getVictimCount("Yellow")}</span>
                    <span className="text-[10px] text-amber-600 font-bold block mt-1">Separa Kritikal</span>
                  </div>
                </div>

                {/* Green Triage */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">TAG HIJAU</span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold font-mono text-emerald-600 block">{getVictimCount("Green")}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">Ringan / Rawatan</span>
                  </div>
                </div>

                {/* White Triage */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-medium">TAG PUTIH</span>
                    <span className="w-3 h-3 rounded-full bg-slate-500 inline-block animate-ping"></span>
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-extrabold font-mono text-slate-700 block">{getVictimCount("White")}</span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">Mati</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Section: Headcount Bilik Gerakan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs" id="bilik-gerakan-headcount-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-teal-600 w-5 h-5" />
                  HEADCOUNT - BILIK GERAKAN
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Jumlah kakitangan penyeliaan di Bilik Gerakan</p>
              </div>
              <button 
                onClick={() => setIsBilikListOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold transition-all border border-teal-100 cursor-pointer"
                id="btn-view-bilik-list"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Lihat Senarai ({bilikGerakanPersonnel.length})
              </button>
            </div>

            {/* Total and breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 bg-teal-600 text-white p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-xs">
                <span className="text-xs font-bold tracking-wider opacity-90 uppercase">JUMLAH PETUGAS</span>
                <span className="text-5xl font-extrabold font-mono mt-1">{bilikGerakanPersonnel.length}</span>
                <span className="text-[10px] opacity-75 mt-1 font-medium">Kakitangan</span>
              </div>

              {/* Bilik Gerakan Categories Count */}
              <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Kakitangan Hospital", "Agensi/NGO", "PAKSI/ERT", "Pemerhati"].map((cat) => {
                  const val = bilikGerakanPersonnel.filter(p => p.category === cat).length;
                  return (
                    <div key={cat} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <span className="text-xs font-extrabold text-slate-500 leading-tight block min-h-[32px]">{cat}</span>
                      <div className="mt-2">
                        <span className="text-3xl font-black font-mono text-slate-900 block">{val}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 span on desktop): CHRONOLOGICAL TIMELINE (LOG SITUASI) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full" id="timeline-section">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-slate-600 w-5 h-5" />
              Log Kronologi Kejadian
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Urutan peristiwa dari permulaan simulasi kebakaran</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[460px] scrollbar-thin">
            {drillState.situationLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Tiada log peristiwa direkodkan lagi.
              </div>
            ) : (
              drillState.situationLogs.map((log, index) => {
                let badgeColor = "bg-slate-100 text-slate-800 border-slate-200";
                let iconEl = <Clock className="w-3.5 h-3.5" />;
                
                if (log.type === "critical") {
                  badgeColor = "bg-red-50 text-red-700 border-red-200";
                  iconEl = <ShieldAlert className="w-3.5 h-3.5" />;
                } else if (log.type === "warning") {
                  badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  iconEl = <AlertTriangle className="w-3.5 h-3.5" />;
                } else if (log.type === "success") {
                  badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  iconEl = <CheckCircle2 className="w-3.5 h-3.5" />;
                }

                return (
                  <div key={log.id} className="relative pl-6 pb-2 last:pb-0 group">
                    {/* Vertical connector line */}
                    {index < drillState.situationLogs.length - 1 && (
                      <div className="absolute left-[9px] top-4 bottom-0 w-[2px] bg-slate-100 group-last:hidden"></div>
                    )}
                    
                    {/* Event bullet node */}
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${log.type === 'critical' ? 'bg-red-500' : log.type === 'warning' ? 'bg-amber-500' : log.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    </div>

                    <div className="bg-slate-50/60 hover:bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{log.time}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badgeColor} flex items-center gap-1`}>
                          {iconEl}
                          {log.type === 'critical' ? 'Bahaya' : log.type === 'warning' ? 'Amaran' : log.type === 'success' ? 'Selesai' : 'Maklumat'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mt-1.5">{log.situation}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* Modal 1: Evacuated Personnel List */}
      {isEvacListOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-evac-list">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-emerald-600 w-5 h-5" />
                  Senarai Individu Dipindahkan (Borang Atas Talian)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Senarai nama lengkap yang berdaftar dari peranti masing-masing semasa latihan</p>
              </div>
              <button 
                onClick={() => setIsEvacListOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama, No ID atau wad..."
                  value={evacSearch}
                  onChange={(e) => setEvacSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <select 
                  value={evacFilter}
                  onChange={(e) => setEvacFilter(e.target.value)}
                  className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Kategori</option>
                  {allCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredEvacuated.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                  Tiada rekod mendaftar yang sepadan dengan carian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                        <th className="pb-3 pl-2">Bil</th>
                        <th className="pb-3">Nama Penuh</th>
                        <th className="pb-3">No. Staf / KP / Fail</th>
                        <th className="pb-3">Kategori</th>
                        <th className="pb-3">Jabatan / Wad Asal</th>
                        <th className="pb-3 text-right pr-2">Masa Masuk</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-50">
                      {filteredEvacuated.map((person, idx) => {
                        const dateObj = new Date(person.timestamp);
                        const displayTime = dateObj.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
                        
                        return (
                          <tr key={person.id} className="hover:bg-slate-50/50">
                            <td className="py-3 pl-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="py-3 font-semibold text-slate-700">{person.name}</td>
                            <td className="py-3 font-mono text-xs text-slate-600">{person.roleOrId}</td>
                            <td className="py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {person.category}
                              </span>
                            </td>
                            <td className="py-3 text-slate-600 font-medium">{person.departmentOrWard || "-"}</td>
                            <td className="py-3 text-right pr-2 font-mono text-xs text-slate-500">{displayTime}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Menunjukkan {filteredEvacuated.length} daripada {drillState.evacuatedPersonnel.length} pendaftaran form.</span>
              <button 
                onClick={() => setIsEvacListOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Bilik Gerakan Personnel List */}
      {isBilikListOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-bilik-list">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="text-teal-600 w-5 h-5" />
                  Senarai Petugas Bilik Gerakan (Borang Atas Talian)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Senarai nama lengkap petugas aktif yang berdaftar di Bilik Gerakan</p>
              </div>
              <button 
                onClick={() => setIsBilikListOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama, No ID atau unit..."
                  value={bilikSearch}
                  onChange={(e) => setBilikSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <select 
                  value={bilikFilter}
                  onChange={(e) => setBilikFilter(e.target.value)}
                  className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Semua">Semua Kategori</option>
                  {["Kakitangan Hospital", "Agensi/NGO", "PAKSI/ERT", "Pemerhati"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredBilikGerakan.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                  Tiada rekod mendaftar yang sepadan dengan carian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                        <th className="pb-3 pl-2">Bil</th>
                        <th className="pb-3">Nama Penuh</th>
                        <th className="pb-3">No. Staf / KP / Fail</th>
                        <th className="pb-3">Kategori</th>
                        <th className="pb-3">Jabatan / Unit Asal</th>
                        <th className="pb-3 text-right pr-2">Masa Masuk</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-50">
                      {filteredBilikGerakan.map((person, idx) => {
                        const dateObj = new Date(person.timestamp);
                        const displayTime = dateObj.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
                        const deptOnly = person.departmentOrWard ? person.departmentOrWard.replace(/\s*\(Bilik Gerakan\)/i, "") : "";
                        
                        return (
                          <tr key={person.id} className="hover:bg-slate-50/50">
                            <td className="py-3 pl-2 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="py-3 font-semibold text-slate-700">{person.name}</td>
                            <td className="py-3 font-mono text-xs text-slate-600">{person.roleOrId}</td>
                            <td className="py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                {person.category}
                              </span>
                            </td>
                            <td className="py-3 text-slate-600 font-medium">{deptOnly || "-"}</td>
                            <td className="py-3 text-right pr-2 font-mono text-xs text-slate-500">{displayTime}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Menunjukkan {filteredBilikGerakan.length} daripada {bilikGerakanPersonnel.length} pendaftaran petugas Bilik Gerakan.</span>
              <button 
                onClick={() => setIsBilikListOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Victim Triage List */}
      {isVictimListOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-victim-list">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="text-red-600 w-5 h-5" />
                  Senarai Penerimaan Mangsa di Pos Kawalan Rawatan
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Senarai klasifikasi klinikal mangsa untuk rawatan kecemasan masa nyata</p>
              </div>
              <button 
                onClick={() => setIsVictimListOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari mangsa, lokasi ditemui, kecederaan..."
                  value={victimSearch}
                  onChange={(e) => setVictimSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <select 
                  value={victimFilter}
                  onChange={(e) => setVictimFilter(e.target.value)}
                  className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Semua">Semua Tag Triage</option>
                  <option value="Red">Tag Merah (Zon Kritikal)</option>
                  <option value="Yellow">Tag Kuning (Zon Semi-Kritikal)</option>
                  <option value="Green">Tag Hijau (Zon Ringan)</option>
                  <option value="White">Tag Putih (Mati)</option>
                </select>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredVictims.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-300" />
                  Tiada rekod mangsa yang sepadan dengan kriteria carian.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVictims.map((victim) => {
                    const style = getTriageNameAndStyle(victim.triage);
                    const dateObj = new Date(victim.timestamp);
                    const displayTime = dateObj.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", hour12: false });

                    return (
                      <div key={victim.id} className={`p-4 rounded-xl border ${style.bg} transition-all`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${style.badge}`}>
                              Tag {victim.triage === 'Red' ? 'Merah' : victim.triage === 'Yellow' ? 'Kuning' : victim.triage === 'Green' ? 'Hijau' : 'Putih'}
                            </span>
                            <h4 className="text-base font-bold text-slate-800 mt-2">{victim.name}</h4>
                            <p className="text-xs text-slate-500 font-semibold font-mono mt-0.5">Umur/Jantina: {victim.ageSex || "-"}</p>
                          </div>
                          <span className="text-xs font-mono text-slate-400 font-bold">{displayTime}</span>
                        </div>
                        
                        <div className="mt-3 space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                          <div>
                            <span className="font-bold text-slate-500 block">Kawasan Ditemui:</span>
                            <span className="font-medium text-slate-800">{victim.locationFound || "-"}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 block">Kecederaan:</span>
                            <span className="font-medium text-slate-800">{victim.injuryDetails || "-"}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-500 block">Status Terkini:</span>
                            <span className="font-semibold text-slate-950 inline-flex items-center gap-1.5 mt-0.5 bg-white px-2 py-0.5 rounded border border-slate-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {victim.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Menunjukkan {filteredVictims.length} daripada {drillState.victims.length} mangsa berdaftar.</span>
              <button 
                onClick={() => setIsVictimListOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
