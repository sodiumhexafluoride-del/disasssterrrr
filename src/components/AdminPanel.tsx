import { useState, useEffect, FormEvent } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  Users, 
  Activity, 
  ShieldAlert, 
  Edit3, 
  ArrowRight,
  RefreshCw,
  FileText,
  Send,
  Search,
  Database,
  Cloud,
  Wifi,
  WifiOff
} from "lucide-react";
import { DrillState, EvacuationCategory, TriageCategory, Victim } from "../types";

const PRESET_EVENTS: { text: string; type: "info" | "warning" | "critical" | "success" }[] = [
  { text: "Penemuan Api / Jeritan api", type: "critical" },
  { text: "Tindakan awal memadam kebakaran", type: "warning" },
  { text: "Mengaktifkan alat penggera kebakaran", type: "warning" },
  { text: "Pemberitahuan ketua unit", type: "info" },
  { text: "Menelefon operator", type: "info" },
  { text: "Ketibaan ERT", type: "success" },
  { text: "Penerimaan makluman kebakaran ( telefon )", type: "info" },
  { text: "Isyarat kebakaran diterima di control panel", type: "info" },
  { text: "Pembantu keselamatan tiba di control panel", type: "info" },
  { text: "Pasukan Teknikal Medivest tiba di control panel", type: "info" },
  { text: "Pegawai ke lokasi kebakaran", type: "info" },
  { text: "Pengesahan punca kebakaran", type: "warning" },
  { text: "Pengumuman kod \"JINGGA\"", type: "critical" },
  { text: "Panggilan ke Balai BOMBA & PDRM", type: "critical" },
  { text: "Pemberitahuan kebakaran kepada Pengarah", type: "info" },
  { text: "Pembukaan Bilik Gerakan", type: "success" },
  { text: "Ketibaan Pengarah", type: "info" },
  { text: "Briefing Pengarah", type: "info" },
  { text: "PKN dimaklumkan", type: "info" },
  { text: "CPRC dimaklumkan", type: "info" },
  { text: "MECC dimaklumkan", type: "info" },
  { text: "Arahan Evakuasi", type: "critical" },
  { text: "Pengumuman Evakuasi", type: "warning" },
  { text: "Evakuasi", type: "warning" },
  { text: "Pesakit / orang awam tiba", type: "info" },
  { text: "Penyelia Zon berkumpul tiba", type: "info" },
  { text: "Headcount", type: "info" },
  { text: "Bomba tiba dilokasi", type: "success" },
  { text: "Aktiviti pemadaman dilakukan", type: "warning" },
  { text: "Rawatan pesakit di Medical Base", type: "info" },
  { text: "Menerima arahan untuk Stand Down", type: "info" },
  { text: "Stand Down", type: "success" }
];

interface AdminPanelProps {
  drillState: DrillState;
  onRefresh: () => void;
}

export default function AdminPanel({ drillState, onRefresh }: AdminPanelProps) {
  // Navigation tabs for the Admin Panel
  const [activeSubTab, setActiveSubTab] = useState<"timer" | "victims" | "evacuees" | "firebase">("timer");

  // Timer loading states
  const [isTimerLoading, setIsTimerLoading] = useState(false);

  // Scenario settings state
  const [scenarioInput, setScenarioInput] = useState(drillState.scenario || "");
  const [isScenarioSubmitting, setIsScenarioSubmitting] = useState(false);

  // Firebase connection status state
  const [firebaseStatus, setFirebaseStatus] = useState<{
    active: boolean;
    projectId: string | null;
    usingAdc: boolean;
    hasServiceAccount: boolean;
  } | null>(null);
  const [isFbStatusLoading, setIsFbStatusLoading] = useState(false);

  // Fetch Firebase status
  const fetchFirebaseStatus = async () => {
    setIsFbStatusLoading(true);
    try {
      const res = await fetch("/api/firebase/status");
      if (res.ok) {
        const data = await res.json();
        setFirebaseStatus(data);
      }
    } catch (err) {
      console.error("Error fetching Firebase status:", err);
    } finally {
      setIsFbStatusLoading(false);
    }
  };

  // Sync with prop updates
  useEffect(() => {
    if (drillState.scenario) {
      setScenarioInput(drillState.scenario);
    }
    fetchFirebaseStatus();
  }, [drillState.scenario]);

  // Situation Announcement Form state
  const [situationText, setSituationText] = useState("");
  const [situationType, setSituationType] = useState<"info" | "warning" | "critical" | "success">("info");
  const [customTime, setCustomTime] = useState("");
  const [isSituationSubmitting, setIsSituationSubmitting] = useState(false);
  const [presetSearch, setPresetSearch] = useState("");

  // Victim Form state
  const [victimId, setVictimId] = useState<string | null>(null); // For editing
  const [victimName, setVictimName] = useState("");
  const [victimAgeSex, setVictimAgeSex] = useState("");
  const [victimTriage, setVictimTriage] = useState<TriageCategory>("Green");
  const [victimLocation, setVictimLocation] = useState("");
  const [victimInjury, setVictimInjury] = useState("");
  const [victimStatus, setVictimStatus] = useState("Menunggu Rawatan");
  const [isVictimSubmitting, setIsVictimSubmitting] = useState(false);

  // Manual Overrides state
  const [overrideCategory, setOverrideCategory] = useState<EvacuationCategory>("Kakitangan Hospital");
  const [overrideEvacValue, setOverrideEvacValue] = useState("");
  const [overrideTriage, setOverrideTriage] = useState<TriageCategory>("Red");
  const [overrideTriageValue, setOverrideTriageValue] = useState("");

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
  } | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger: boolean = false,
    confirmText: string = "Sahkan",
    cancelText: string = "Batal"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
      confirmText,
      cancelText,
      isDanger
    });
  };

  const handleUpdateScenario = async (e: FormEvent) => {
    e.preventDefault();
    if (!scenarioInput.trim()) return;

    setIsScenarioSubmitting(true);
    try {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenarioInput })
      });
      if (response.ok) {
        onRefresh();
        showToast("Senario utama berjaya dikemaskini!", "success");
      } else {
        showToast("Gagal mengemaskini senario.", "error");
      }
    } catch (err) {
      console.error("Error updating scenario:", err);
      showToast("Ralat rangkaian semasa mengemaskini senario.", "error");
    } finally {
      setIsScenarioSubmitting(false);
    }
  };

  // Handler for timer controls
  const handleTimerAction = async (action: "start" | "pause" | "reset") => {
    if (action === "reset") {
      triggerConfirm(
        "Set Semula Pemasa",
        "Adakah anda pasti mahu set semula pemasa? Tempoh stopwatch latihan akan dikembalikan semula ke format 00:00:00.",
        async () => {
          setIsTimerLoading(true);
          try {
            const response = await fetch("/api/timer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "reset" })
            });
            if (response.ok) {
              onRefresh();
              showToast("Pemasa berjaya diset semula!", "success");
            }
          } catch (err) {
            console.error("Error updating timer:", err);
            showToast("Gagal set semula pemasa.", "error");
          } finally {
            setIsTimerLoading(false);
          }
        },
        true,
        "Ya, Set Semula",
        "Batal"
      );
      return;
    }

    setIsTimerLoading(true);
    try {
      const response = await fetch("/api/timer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        onRefresh();
        showToast(action === "start" ? "Pemasa latihan bermula!" : "Pemasa latihan diberhentikan seketika.", "info");
      }
    } catch (err) {
      console.error("Error updating timer:", err);
    } finally {
      setIsTimerLoading(false);
    }
  };

  // Handler for posting situation log
  const handlePostSituation = async (e: FormEvent) => {
    e.preventDefault();
    if (!situationText.trim()) return;

    setIsSituationSubmitting(true);
    try {
      const response = await fetch("/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: situationText.trim(),
          type: situationType,
          timeStr: customTime.trim() || undefined
        })
      });
      if (response.ok) {
        setSituationText("");
        setCustomTime("");
        onRefresh();
        showToast("Situasi baharu berjaya diumumkan!", "success");
      }
    } catch (err) {
      console.error("Error posting situation:", err);
      showToast("Gagal mengumumkan situasi.", "error");
    } finally {
      setIsSituationSubmitting(false);
    }
  };

  // Handler to post preset situation directly
  const handlePostPresetDirectly = async (text: string, type: "info" | "warning" | "critical" | "success") => {
    setIsSituationSubmitting(true);
    try {
      const response = await fetch("/api/situation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: text,
          type: type
        })
      });
      if (response.ok) {
        onRefresh();
        showToast(`"${text}" berjaya diumumkan!`, "success");
      }
    } catch (err) {
      console.error("Error posting preset situation:", err);
      showToast("Gagal mengumumkan situasi.", "error");
    } finally {
      setIsSituationSubmitting(false);
    }
  };

  // Delete situation log
  const handleDeleteLog = async (id: string) => {
    triggerConfirm(
      "Padam Log Situasi",
      "Adakah anda pasti mahu memadam log situasi ini dari garis masa pengumuman?",
      async () => {
        try {
          const response = await fetch(`/api/situation/${id}`, {
            method: "DELETE"
          });
          if (response.ok) {
            onRefresh();
            showToast("Log situasi berjaya dipadam.", "success");
          }
        } catch (err) {
          console.error("Error deleting log:", err);
          showToast("Gagal memadam log situasi.", "error");
        }
      },
      true,
      "Padam",
      "Batal"
    );
  };

  // Handler for victim registration (Add / Edit)
  const handleSaveVictim = async (e: FormEvent) => {
    e.preventDefault();
    if (!victimName.trim()) return;

    setIsVictimSubmitting(true);
    try {
      const response = await fetch("/api/victim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: victimId || undefined,
          name: victimName.trim(),
          ageSex: victimAgeSex.trim() || "-",
          triage: victimTriage,
          locationFound: victimLocation.trim() || "-",
          injuryDetails: victimInjury.trim() || "-",
          status: victimStatus.trim() || "Menunggu Rawatan"
        })
      });

      if (response.ok) {
        // Clear victim form
        setVictimId(null);
        setVictimName("");
        setVictimAgeSex("");
        setVictimTriage("Green");
        setVictimLocation("");
        setVictimInjury("");
        setVictimStatus("Menunggu Rawatan");
        onRefresh();
        showToast(victimId ? "Rekod mangsa berjaya dikemaskini!" : "Mangsa berjaya didaftarkan!", "success");
      }
    } catch (err) {
      console.error("Error saving victim:", err);
      showToast("Ralat menyimpan rekod mangsa.", "error");
    } finally {
      setIsVictimSubmitting(false);
    }
  };

  // Set victim fields for editing
  const handleEditVictim = (victim: Victim) => {
    setVictimId(victim.id);
    setVictimName(victim.name);
    setVictimAgeSex(victim.ageSex || "");
    setVictimTriage(victim.triage);
    setVictimLocation(victim.locationFound || "");
    setVictimInjury(victim.injuryDetails || "");
    setVictimStatus(victim.status || "Menunggu Rawatan");
    setActiveSubTab("victims");
  };

  // Delete a victim
  const handleDeleteVictim = async (id: string) => {
    triggerConfirm(
      "Padam Rekod Mangsa",
      "Adakah anda pasti mahu memadam rekod mangsa ini dari pangkalan data triage?",
      async () => {
        try {
          const response = await fetch(`/api/victim/${id}`, {
            method: "DELETE"
          });
          if (response.ok) {
            onRefresh();
            showToast("Rekod mangsa berjaya dipadam.", "success");
          }
        } catch (err) {
          console.error("Error deleting victim:", err);
          showToast("Gagal memadam rekod mangsa.", "error");
        }
      },
      true,
      "Padam",
      "Batal"
    );
  };

  // Delete an evacuated register
  const handleDeleteEvacuee = async (id: string) => {
    triggerConfirm(
      "Padam Rekod Pendaftaran Keluar",
      "Adakah anda pasti mahu memadam rekod pendaftaran keluar selamat bagi individu ini?",
      async () => {
        try {
          const response = await fetch(`/api/evacuate/${id}`, {
            method: "DELETE"
          });
          if (response.ok) {
            onRefresh();
            showToast("Rekod pendaftaran berjaya dipadam.", "success");
          }
        } catch (err) {
          console.error("Error deleting evacuee:", err);
          showToast("Gagal memadam rekod pendaftaran.", "error");
        }
      },
      true,
      "Padam",
      "Batal"
    );
  };

  // Update manual overrides
  const handleUpdateManualCount = async (type: "evacuation" | "triage") => {
    const category = type === "evacuation" ? overrideCategory : overrideTriage;
    const value = type === "evacuation" ? overrideEvacValue : overrideTriageValue;

    if (!value.trim()) return;

    try {
      const response = await fetch("/api/counts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category, value })
      });
      if (response.ok) {
        if (type === "evacuation") setOverrideEvacValue("");
        else setOverrideTriageValue("");
        onRefresh();
        showToast("Pembetulan manual berjaya dikemaskini!", "success");
      }
    } catch (err) {
      console.error("Error updating count:", err);
      showToast("Gagal mengemaskini nilai manual.", "error");
    }
  };

  // Reset drill session back to empty
  const handleResetAll = async () => {
    triggerConfirm(
      "Kosongkan Sesi Latihan",
      "AMARAN: Ini akan mengosongkan SEMUA data latihan (pendaftaran selamat, log pengumuman situasi, data mangsa) dan memulakan sesi baharu dari kosong. Adakah anda pasti?",
      async () => {
        try {
          const response = await fetch("/api/reset-all", {
            method: "POST"
          });
          if (response.ok) {
            onRefresh();
            showToast("Sistem berjaya dikosongkan untuk latihan baharu!", "success");
          }
        } catch (err) {
          console.error("Error resetting drill:", err);
          showToast("Gagal mengosongkan sesi latihan.", "error");
        }
      },
      true,
      "Kosongkan Sesi",
      "Batal"
    );
  };

  return (
    <div className="space-y-6" id="admin-panel-main">
      
      {/* Top Section - Active Drill Status Overview */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-red-500 tracking-wider bg-red-950 px-2.5 py-1 rounded-full border border-red-900 uppercase">
            BILIK GERAKAN BENCANA (ADMIN)
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white mt-3">Panel Pengurusan Latihan Kebakaran HSI</h2>
          <p className="text-xs text-slate-400 mt-1">Mengawal pemasa dashboard, mengumumkan situasi semasa, dan mengurus klasifikasi mangsa secara masa nyata.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleResetAll} 
            className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/35 hover:text-red-300 font-bold text-xs rounded-xl border border-red-900 transition-all cursor-pointer"
          >
            Kosongkan Sesi Latihan
          </button>
          <button 
            onClick={onRefresh}
            className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan Data
          </button>
        </div>
      </div>

      {/* Admin Nav Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab("timer")}
          className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeSubTab === "timer" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Clock className="w-4 h-4" />
          ⏱️ Pemasa & Log Situasi
        </button>
        <button
          onClick={() => setActiveSubTab("victims")}
          className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeSubTab === "victims" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Activity className="w-4 h-4" />
          🏥 Pengurusan Mangsa Triage
        </button>
        <button
          onClick={() => setActiveSubTab("evacuees")}
          className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeSubTab === "evacuees" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Users className="w-4 h-4" />
          👥 Kakitangan Selamat & Pembetulan
        </button>
        <button
          onClick={() => {
            setActiveSubTab("firebase");
            fetchFirebaseStatus();
          }}
          className={`px-5 py-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeSubTab === "firebase" ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <Cloud className="w-4 h-4 text-amber-500 animate-pulse" />
          🔌 Sambungan Firebase
        </button>
      </div>

      {/* --- SUB-TAB CONTENTS --- */}

      {/* SUB-TAB 1: TIMER & SITUATION LOGS */}
      {activeSubTab === "timer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" id="admin-timer-tab">
          
          {/* Card left: Timer Controls and Situation Form */}
          <div className="space-y-6">
            
            {/* 1. Timer Controls */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                KAWALAN UTAMA PEMASA (STOPWATCH)
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full sm:w-1/2 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">STATUS TIMA SEKARANG</span>
                  <span className={`text-2xl font-black font-mono tracking-tight ${drillState.isRunning ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {drillState.isRunning ? 'SEDANG BERJALAN' : 'BERHENTI SEBENTAR'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-1/2 justify-center">
                  {!drillState.isRunning ? (
                    <button
                      onClick={() => handleTimerAction("start")}
                      disabled={isTimerLoading}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 flex-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Mula
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTimerAction("pause")}
                      disabled={isTimerLoading}
                      className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 flex-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Pause className="w-4 h-4 fill-white" /> Pause
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleTimerAction("reset")}
                    disabled={isTimerLoading}
                    className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Set Semula Pemasa"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* 1.5 Scenario Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                KONFIGURASI SENARIO KEJADIAN
              </h3>
              
              <form onSubmit={handleUpdateScenario} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Nama Senario / Latihan Utama</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: LATIHAN KEBAKARAN & PENYELAMATAN WAD HSI"
                    value={scenarioInput}
                    onChange={(e) => setScenarioInput(e.target.value)}
                    className="px-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Teks ini akan menggantikan pengumuman tajuk senario asal di dashboard utama dan footer.</p>
                </div>

                <button
                  type="submit"
                  disabled={isScenarioSubmitting || !scenarioInput.trim()}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isScenarioSubmitting ? "Mengemaskini..." : "Simpan Nama Senario"}
                </button>
              </form>
            </div>

            {/* 2. Urus Log Situasi Terkini */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-full">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                URUS LOG SITUASI TERKINI ({drillState.situationLogs.length})
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[440px] pr-1">
                {drillState.situationLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Tiada rekod situasi ditemui. Sila tambah menggunakan borang sebelah.
                  </div>
                ) : (
                  drillState.situationLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-500">{log.time}</span>
                          <span className={`px-2 py-0.2 text-[9px] font-bold border rounded uppercase ${log.type === 'critical' ? 'bg-red-50 text-red-600 border-red-200' : log.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' : log.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            {log.type === 'critical' ? 'Bahaya' : log.type === 'warning' ? 'Amaran' : log.type === 'success' ? 'Selesai' : 'Info'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 mt-1 leading-relaxed">{log.situation}</p>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Padam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Card right: Situation Announcement Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
              UMUMKAN SITUASI / PERISTIWA BARU
            </h3>
            
            <form onSubmit={handlePostSituation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Pengumuman Situasi (Bahasa Malaysia)</label>
                <textarea
                  required
                  placeholder="Contoh: Unit Bomba mula memasuki sayap kiri Blok Klinikal bagi memadamkan kebakaran utama."
                  value={situationText}
                  onChange={(e) => setSituationText(e.target.value)}
                  rows={3}
                  className="px-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block uppercase mb-1.5">Kategori Impak</label>
                  <select
                    value={situationType}
                    onChange={(e: any) => setSituationType(e.target.value)}
                    className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                  >
                    <option value="info">Info / Maklumat Am (Biru)</option>
                    <option value="success">Kejayaan / Selesai (Hijau)</option>
                    <option value="warning">Amaran / Perhatian (Kuning)</option>
                    <option value="critical">Bahaya / Kritikal (Merah)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block uppercase mb-1.5">Waktu Rekod (Kosongkan untuk automatik)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 09:15:30"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSituationSubmitting || !situationText.trim()}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tambah & Papar Situasi
              </button>
            </form>

            <div className="pt-5 border-t border-slate-100 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  PILIH DARIPADA ACARA PRE-LOAD
                </h4>
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                  {PRESET_EVENTS.length} Preset
                </span>
              </div>

              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari senarai acara..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Scrollable list of preset events */}
              <div className="max-h-[380px] overflow-y-auto border border-slate-100 rounded-xl bg-slate-50 p-3 space-y-2 scrollbar-thin">
                {PRESET_EVENTS.filter(p => p.text.toLowerCase().includes(presetSearch.toLowerCase())).map((preset, idx) => {
                  // Get color styles based on type
                  let indicatorColor = "bg-blue-500";
                  if (preset.type === "warning") {
                    indicatorColor = "bg-amber-500";
                  } else if (preset.type === "critical") {
                    indicatorColor = "bg-red-500";
                  } else if (preset.type === "success") {
                    indicatorColor = "bg-emerald-500";
                  }

                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3.5 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200 group gap-3"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 ${indicatorColor}`}></span>
                        <span className="text-base text-slate-900 font-black leading-relaxed break-words" title={preset.text}>
                          {preset.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Fill Form Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSituationText(preset.text);
                            setSituationType(preset.type);
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-extrabold rounded-lg text-xs transition-all cursor-pointer"
                          title="Masukkan ke dalam borang di atas"
                        >
                          Isi Borang
                        </button>
                        {/* Send Directly Button */}
                        <button
                          type="button"
                          disabled={isSituationSubmitting}
                          onClick={() => handlePostPresetDirectly(preset.text, preset.type)}
                          className="p-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white active:bg-emerald-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          title="Hantar serta merta"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {PRESET_EVENTS.filter(p => p.text.toLowerCase().includes(presetSearch.toLowerCase())).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Tiada keputusan ditemui.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TRIAGE VICTIMS MANAGEMENT */}
      {activeSubTab === "victims" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="admin-victims-tab">
          
          {/* Left panel: Add/Edit Victim Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              {victimId ? (
                <>
                  <Edit3 className="w-4 h-4 text-red-500" />
                  KEMASKINI BUTIRAN MANGSA
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-slate-500" />
                  DAFTAR MANGSA BARU
                </>
              )}
            </h3>

            <form onSubmit={handleSaveVictim} className="space-y-4">
              {victimId && (
                <div className="bg-amber-50 text-amber-800 p-2 text-xs rounded border border-amber-100 flex justify-between items-center">
                  <span>Sedang Mengemaskini Mangsa Terpilih</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setVictimId(null);
                      setVictimName("");
                      setVictimAgeSex("");
                      setVictimTriage("Green");
                      setVictimLocation("");
                      setVictimInjury("");
                      setVictimStatus("Menunggu Rawatan");
                    }}
                    className="font-bold underline uppercase text-[10px]"
                  >
                    Batal
                  </button>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Nama Mangsa <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mohd Firdaus bin Isa"
                  value={victimName}
                  onChange={(e) => setVictimName(e.target.value)}
                  className="px-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                />
              </div>

              {/* Age / Sex */}
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Umur & Jantina</label>
                <input
                  type="text"
                  placeholder="Contoh: 32 / Lelaki atau 45 / Perempuan"
                  value={victimAgeSex}
                  onChange={(e) => setVictimAgeSex(e.target.value)}
                  className="px-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                />
              </div>

              {/* Triage Tag */}
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1.5">Klasifikasi Triage (Tag Warna)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "Red", label: "Merah (Kritikal)", color: "border-red-500 bg-red-50 text-red-700" },
                    { value: "Yellow", label: "Kuning (Separa)", color: "border-amber-500 bg-amber-50 text-amber-700" },
                    { value: "Green", label: "Hijau (Ringan)", color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                    { value: "White", label: "Putih (Mati)", color: "border-slate-400 bg-slate-50 text-slate-700" }
                  ].map((item) => (
                    <label 
                      key={item.value} 
                      className={`px-3 py-2 rounded-lg border text-center flex items-center gap-1.5 cursor-pointer transition-all ${victimTriage === item.value ? item.color + ' border-2 ring-1' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <input
                        type="radio"
                        name="triage-color"
                        checked={victimTriage === item.value}
                        onChange={() => setVictimTriage(item.value as any)}
                        className="sr-only"
                      />
                      <span className="text-[10px] font-bold mx-auto">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Found location */}
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Lokasi Ditemui (Wad/Aras)</label>
                <input
                  type="text"
                  placeholder="Contoh: Aras 3 Blok A, Lift No. 2"
                  value={victimLocation}
                  onChange={(e) => setVictimLocation(e.target.value)}
                  className="px-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                />
              </div>

              {/* Injuries */}
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Kecederaan / Gejala</label>
                <input
                  type="text"
                  placeholder="Contoh: Melecur 20%, Terseliat Bahu, Sesak Nafas"
                  value={victimInjury}
                  onChange={(e) => setVictimInjury(e.target.value)}
                  className="px-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                />
              </div>

              {/* Current Status */}
              <div>
                <label className="text-xs font-bold text-slate-500 block uppercase mb-1">Status Rawatan Semasa</label>
                <input
                  type="text"
                  placeholder="Contoh: Menunggu Rawatan, Stabil, Dirujuk ke HSA"
                  value={victimStatus}
                  onChange={(e) => setVictimStatus(e.target.value)}
                  className="px-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isVictimSubmitting || !victimName.trim()}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {victimId ? (
                  <>
                    <Edit3 className="w-4 h-4" /> Simpan Kemaskini Mangsa
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Daftarkan Mangsa
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right panel: List of all victims with actions */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[600px]">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              MANGSA DI DAFTAR DALAM SISTEM ({drillState.victims.length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {drillState.victims.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Tiada rekod mangsa bencana berdaftar. Gunakan panel sebelah kiri untuk mendaftar.
                </div>
              ) : (
                drillState.victims.map((victim) => {
                  let triageBadge = "bg-green-100 text-green-800 border-green-200";
                  if (victim.triage === "Red") triageBadge = "bg-red-600 text-white border-red-700";
                  else if (victim.triage === "Yellow") triageBadge = "bg-amber-400 text-slate-950 border-amber-500";
                  else if (victim.triage === "White") triageBadge = "bg-slate-200 text-slate-800 border-slate-300";

                  return (
                    <div key={victim.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${triageBadge}`}>
                            Tag {victim.triage === 'Red' ? 'Merah' : victim.triage === 'Yellow' ? 'Kuning' : victim.triage === 'Green' ? 'Hijau' : 'Putih'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800">{victim.name}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                          <p><span className="font-bold text-slate-400">Umur/Sex:</span> {victim.ageSex}</p>
                          <p><span className="font-bold text-slate-400">Lokasi:</span> {victim.locationFound}</p>
                          <p className="sm:col-span-2 md:col-span-1"><span className="font-bold text-slate-400">Kecederaan:</span> {victim.injuryDetails}</p>
                        </div>
                        <p className="text-xs">
                          <span className="font-bold text-slate-400">Status Semasa:</span>{" "}
                          <span className="font-semibold text-slate-800">{victim.status}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 sm:self-start">
                        <button
                          onClick={() => handleEditVictim(victim)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all cursor-pointer"
                          title="Kemaskini"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVictim(victim.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
                          title="Padam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EVACUEES & MANUAL OVERRIDES */}
      {activeSubTab === "evacuees" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="admin-evacuees-tab">
          
          {/* Left Panel: Manual Overrides Count (Fast adjustments) */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  PEMBETULAN MANUAL EVAKUASI
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Adakalanya sesetengah mangsa/kakitangan tidak membawa peranti untuk mengisi borang. Anda boleh melaras atau menetapkan jumlah terkumpul terus dari sini untuk dipaparkan di Dashboard.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Kategori Pemindahan</label>
                  <select
                    value={overrideCategory}
                    onChange={(e: any) => setOverrideCategory(e.target.value)}
                    className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all mb-2"
                  >
                    <option value="Kakitangan Hospital">Kakitangan Hospital</option>
                    <option value="Pesakit">Pesakit</option>
                    <option value="Orang Awam">Orang Awam</option>
                    <option value="Agensi/NGO">Agensi/NGO</option>
                    <option value="PAKSI/ERT">PAKSI/ERT</option>
                    <option value="Pemerhati">Pemerhati</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={`Contoh: 15`}
                      value={overrideEvacValue}
                      onChange={(e) => setOverrideEvacValue(e.target.value)}
                      className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all font-mono"
                    />
                    <button
                      onClick={() => handleUpdateManualCount("evacuation")}
                      disabled={!overrideEvacValue}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      Ubah Count
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <label className="text-xs font-bold text-slate-500 block mb-1">Kategori Triage (Pembetulan Manual)</label>
                  <select
                    value={overrideTriage}
                    onChange={(e: any) => setOverrideTriage(e.target.value)}
                    className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all mb-2"
                  >
                    <option value="Red">Tag Merah (Zon Kritikal)</option>
                    <option value="Yellow">Tag Kuning (Zon Semi-Kritikal)</option>
                    <option value="Green">Tag Hijau (Zon Ringan)</option>
                    <option value="White">Tag Putih (Mati)</option>
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={`Contoh: 5`}
                      value={overrideTriageValue}
                      onChange={(e) => setOverrideTriageValue(e.target.value)}
                      className="px-3 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition-all font-mono"
                    />
                    <button
                      onClick={() => handleUpdateManualCount("triage")}
                      disabled={!overrideTriageValue}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
                    >
                      Ubah Count
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel (2 spans): Evacuees Registered on Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col h-[600px]">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              SILA BERSIHKAN / PADAM REGISTER KAKITANGAN SELAMAT ({drillState.evacuatedPersonnel.length})
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {drillState.evacuatedPersonnel.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Belum ada individu yang mendaftar pemindahan keluar menggunakan borang atasan talian.
                </div>
              ) : (
                drillState.evacuatedPersonnel.map((person) => {
                  const dateObj = new Date(person.timestamp);
                  const displayTime = dateObj.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", hour12: false });

                  return (
                    <div key={person.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-extrabold text-slate-800">{person.name}</h4>
                          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[9px] rounded font-bold border border-slate-300">
                            {person.category}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-500 font-semibold font-mono">
                          <p>ID: {person.roleOrId}</p>
                          <p>Wad/Dept: {person.departmentOrWard}</p>
                          <p className="text-slate-400">Daftar: {displayTime}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteEvacuee(person.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
                        title="Padam Rekod"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "firebase" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6 animate-fade-in" id="firebase-config-tab">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-amber-500 w-5 h-5" />
                Integrasi & Sambungan Firebase HSI
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Pantau status sambungan pelayan terus ke Cloud Firestore bagi penyimpanan data luar talian & masa nyata.</p>
            </div>
            <button 
              onClick={fetchFirebaseStatus}
              disabled={isFbStatusLoading}
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200/60 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFbStatusLoading ? 'animate-spin' : ''}`} />
              Uji Sambungan
            </button>
          </div>

          {/* Status Display Card */}
          {firebaseStatus?.active ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-emerald-950">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <Wifi className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">AKTIF & BERHUBUNG</span>
                  <span className="text-xs font-semibold text-emerald-700">Firebase Firestore</span>
                </div>
                <h4 className="text-base font-black">Sambungan Awan Selamat Beroperasi</h4>
                <p className="text-xs text-emerald-800 max-w-2xl font-medium leading-relaxed">
                  Sistem berjaya disambungkan ke Cloud Firestore! Semua data pendaftaran pemindahan (headcount), log situasi semasa, dan triage mangsa akan disimpan secara automatik ke awan dan dikongsi antara semua peranti penyelia dalam masa nyata (real-time).
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-200/50 text-xs font-mono">
                  <p><span className="font-bold text-emerald-700">ID Projek:</span> {firebaseStatus.projectId}</p>
                  <p>
                    <span className="font-bold text-emerald-700">Kredensial:</span>{" "}
                    {firebaseStatus.usingAdc ? "ADC (Google Cloud Integration)" : "Kunci Akaun Perkhidmatan (Service Account)"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-amber-950">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
                <WifiOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase">SESI LUAR TALIAN (FALLBACK)</span>
                  <span className="text-xs font-semibold text-amber-700">Pangkalan Data Lokal</span>
                </div>
                <h4 className="text-base font-black">Beroperasi Dalam Mod Sesi Mandiri (Lokal Cache)</h4>
                <p className="text-xs text-amber-800 max-w-2xl font-medium leading-relaxed">
                  Sistem kini berjalan secara lokal di pelayan ini menggunakan fail cache <code className="bg-amber-100/60 px-1 py-0.2 rounded">src/data/db.json</code>. Walaupun semua ciri pendaftaran, pemasa, dan triage berfungsi sepenuhnya, data tidak akan disegerakkan ke pangkalan data awan jika anda mempunyai berbilang replika pelayan.
                </p>
              </div>
            </div>
          )}

          {/* Guide Card */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-slate-500" />
              PANDUAN KONFIGURASI SAMBUNGAN AWAN (CLOUD)
            </h4>
            
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
              <div className="flex gap-3">
                <span className="flex justify-center items-center w-5 h-5 bg-slate-900 text-white rounded-full font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-extrabold text-slate-800">Dapatkan Akaun Firebase</p>
                  <p className="mt-0.5 text-slate-500">Cipta projek Firebase secara percuma di <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold underline hover:text-red-700">Konsol Firebase</a>.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex justify-center items-center w-5 h-5 bg-slate-900 text-white rounded-full font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-extrabold text-slate-800">Aktifkan Cloud Firestore</p>
                  <p className="mt-0.5 text-slate-500">Dalam projek anda, aktifkan pangkalan data **Cloud Firestore** dalam zon serantau pilihan anda (cth. <code className="bg-slate-200/50 px-1 py-0.2 rounded text-[10px]">asia-southeast1</code> untuk Malaysia).</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex justify-center items-center w-5 h-5 bg-slate-900 text-white rounded-full font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-extrabold text-slate-800">Jana Kunci Perkhidmatan (Service Account Credentials)</p>
                  <p className="mt-0.5 text-slate-500">Pergi ke **Project Settings &rarr; Service Accounts**, pilih *Node.js* dan klik **Generate New Private Key**. Fail JSON kunci peribadi akan dimuat turun secara automatik ke komputer anda.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex justify-center items-center w-5 h-5 bg-slate-900 text-white rounded-full font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-extrabold text-slate-800">Tetapkan Secrets dalam AI Studio</p>
                  <p className="mt-0.5 text-slate-500">Buka panel **Secrets / Settings** di AI Studio dan masukkan pembolehubah persekitaran (Environment Variables) berikut berdasarkan nilai di dalam fail JSON kunci peribadi anda:</p>
                  
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[10px] space-y-2.5 mt-2 border border-slate-800 select-all shadow-inner">
                    <div>
                      <span className="text-red-400 font-bold block"># 1. Project ID</span>
                      <span>FIREBASE_PROJECT_ID="<span className="text-emerald-400">project_id_anda</span>"</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-bold block"># 2. Client Email</span>
                      <span>FIREBASE_CLIENT_EMAIL="<span className="text-emerald-400">firebase-adminsdk-xxx@project_id.iam.gserviceaccount.com</span>"</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-bold block"># 3. Private Key</span>
                      <span>FIREBASE_PRIVATE_KEY="<span className="text-emerald-400">-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...</span>"</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">Nota: Pastikan anda menukar semua aksara baris baharu (\n) di dalam Private Key menjadi teks rentetan dwi-aksara "\n" seperti format di atas agar pelayan boleh membacanya dengan tepat.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex justify-center items-center w-5 h-5 bg-slate-900 text-white rounded-full font-bold text-[10px] shrink-0 mt-0.5">5</span>
                <div>
                  <p className="font-extrabold text-slate-800">Sambungan Automatik</p>
                  <p className="mt-0.5 text-slate-500">Setelah Secrets disimpan, pelayan Express kami akan dikesan semula dan dihubungkan secara terus ke Cloud Firestore. Klik **Uji Sambungan** di atas untuk mengesahkan status!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${confirmModal.isDanger ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{confirmModal.title}</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{confirmModal.message}</p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {confirmModal.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer ${
                    confirmModal.isDanger 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-slate-950 hover:bg-slate-800"
                  }`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xl max-w-sm flex items-center gap-3 animate-slide-up-fade font-medium text-xs">
          <div className={`w-2 h-2 rounded-full ${toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"}`} />
          <p>{toast.message}</p>
        </div>
      )}

    </div>
  );
}
