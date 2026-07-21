import { useState, useEffect, FormEvent } from "react";
import { UserCheck, CheckCircle2, ShieldAlert, ArrowRight, Smartphone, Compass } from "lucide-react";
import { EvacuationCategory } from "../types";

interface SingleFormProps {
  title: string;
  subtitle: string;
  location: string;
  customCategories?: EvacuationCategory[];
  showDeptForCategories?: EvacuationCategory[];
}

function SingleForm({ 
  title, 
  subtitle, 
  location, 
  customCategories, 
  showDeptForCategories = ["Kakitangan Hospital"] 
}: SingleFormProps) {
  const categoriesList = customCategories || [
    "Kakitangan Hospital",
    "Pesakit",
    "Orang Awam",
    "Agensi/NGO",
    "PAKSI/ERT"
  ];

  const [name, setName] = useState("");
  const [roleOrId, setRoleOrId] = useState("");
  const [category, setCategory] = useState<EvacuationCategory>(categoriesList[0] || "Kakitangan Hospital");
  const [departmentOrWard, setDepartmentOrWard] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredPerson, setRegisteredPerson] = useState<any>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Formulate final department value to include location context
      const isDeptShown = showDeptForCategories.includes(category);
      const deptValue = isDeptShown 
        ? (departmentOrWard.trim() ? `${departmentOrWard.trim()} (${location})` : location)
        : location;

      const response = await fetch("/api/evacuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          roleOrId: roleOrId.trim() || "-",
          category,
          departmentOrWard: deptValue
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRegisteredPerson(data.person);
        setIsSuccess(true);
        // Reset form
        setName("");
        setRoleOrId("");
        setCategory(categoriesList[0] || "Kakitangan Hospital");
        setDepartmentOrWard("");
      } else {
        alert("Ralat semasa menghantar borang. Sila cuba lagi.");
      }
    } catch (error) {
      console.error("Error submitting evacuation:", error);
      alert("Hubungan rangkaian gagal. Sila semak sambungan anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    const regTime = registeredPerson ? new Date(registeredPerson.timestamp).toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "";
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 sm:p-8 text-center space-y-6 animate-fade-in" id={`form-success-${location.replace(/\s+/g, '-').toLowerCase()}`}>
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
            PENDAFTARAN BERJAYA
          </span>
          <h2 className="text-xl font-black text-slate-800 tracking-tight mt-3">Sila Lapor Diri & Tunggu Arahan</h2>
          <p className="text-xs text-slate-500 mt-2">
            Terima kasih, pendaftaran keluar anda di <strong>{location}</strong> telah direkodkan.
          </p>
        </div>

        {/* Registered details summary */}
        {registeredPerson && (
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left text-xs space-y-2 font-medium text-slate-700">
            <div className="flex justify-between border-b border-slate-100 pb-1.5 text-[10px] text-slate-400 font-bold uppercase">
              <span>MAKLUMAT PENDAFTARAN</span>
              <span>MASA: {regTime}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Nama Penuh:</span>
              <span className="text-sm font-bold text-slate-800">{registeredPerson.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Kategori:</span>
                <span className="font-semibold text-slate-800">{registeredPerson.category}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[10px]">No. Pengenalan:</span>
                <span className="font-mono text-slate-800">{registeredPerson.roleOrId}</span>
              </div>
            </div>
            {showDeptForCategories.includes(registeredPerson.category) && (
              <div className="pt-1 border-t border-slate-100/60 mt-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Lokasi Pendaftaran:</span>
                <span className="font-semibold text-slate-800">{registeredPerson.departmentOrWard}</span>
              </div>
            )}
          </div>
        )}

        {/* Assembly Directives */}
        <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl text-left space-y-2">
          <h4 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
            ARAHAN KESELAMATAN (SOP)
          </h4>
          <ul className="text-[11px] text-slate-600 list-disc pl-4 space-y-1 font-medium">
            <li>Sila berkumpul dengan tenang di <strong>Assembly Point Utama (Padang Terbuka HSI)</strong>.</li>
            <li>Laporkan diri kepada <strong>Ketua Warden Tingkat (ERT/PAKSI)</strong> anda.</li>
            <li>Jangan masuk semula ke dalam bangunan sehingga arahan rasmi dikeluarkan.</li>
          </ul>
        </div>

        <button 
          onClick={() => setIsSuccess(false)}
          className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-xs shadow-sm cursor-pointer"
        >
          Daftar Individu Baru / Seterusnya
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden flex flex-col justify-between" id={`form-card-${location.replace(/\s+/g, '-').toLowerCase()}`}>
      <div>
        {/* Banner */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <UserCheck className="w-6 h-6 text-emerald-500 hidden sm:block" />
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block uppercase mb-1">
              Nama Penuh <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required
              placeholder="Contoh: Ahmad bin Fauzi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3.5 py-2 w-full bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Role/ID number */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block uppercase mb-1">
              No Kad Pengenalan / Passport
            </label>
            <input 
              type="text" 
              placeholder="Contoh: 940301-01-XXXX"
              value={roleOrId}
              onChange={(e) => setRoleOrId(e.target.value)}
              className="px-3.5 py-2 w-full bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 block uppercase mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {categoriesList.map((cat) => (
                <label 
                  key={cat} 
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${category === cat ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' : 'bg-slate-50/40 border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                >
                  <input 
                    type="radio" 
                    name={`category-${location.replace(/\s+/g, '-').toLowerCase()}`}
                    checked={category === cat}
                    onChange={() => {
                      setCategory(cat);
                      if (!showDeptForCategories.includes(cat)) {
                        setDepartmentOrWard("");
                      }
                    }}
                    className="accent-emerald-600 w-3.5 h-3.5"
                  />
                  <span className="text-[11px]">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Department or original Ward */}
          {showDeptForCategories.includes(category) && (
            <div className="animate-fade-in">
              <label className="text-[11px] font-bold text-slate-500 block uppercase mb-1">
                Jabatan / Unit / Wad
              </label>
              <input 
                type="text" 
                placeholder="Contoh: Wad Ortopedik 5A, Kecemasan, Unit IT, Lobi Utama"
                value={departmentOrWard}
                onChange={(e) => setDepartmentOrWard(e.target.value)}
                className="px-3.5 py-2 w-full bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-all text-xs flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Menghantar Rekod...</span>
            ) : (
              <>
                <span>Hantar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer info and caution */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center gap-2.5 text-[10px] text-slate-500">
        <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
        <span>Amaran: Sila pastikan anda telah berada di tempat berkumpul yang selamat sebelum mengisi</span>
      </div>
    </div>
  );
}

export default function EvacuationForm() {
  const [currentHash, setCurrentHash] = useState(typeof window !== "undefined" ? window.location.hash : "");

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const baseUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const urlZonBerkumpul = `${baseUrl}#form-zon-berkumpul`;
  const urlBilikGerakan = `${baseUrl}#form-bilik-gerakan`;
  const urlBoth = `${baseUrl}#form`;

  const isLockedZonBerkumpul = currentHash === "#form-zon-berkumpul";
  const isLockedBilikGerakan = currentHash === "#form-bilik-gerakan";

  const [activeFormTab, setActiveFormTab] = useState<"semua" | "zon" | "bilik">("semua");

  useEffect(() => {
    if (currentHash === "#form-zon-berkumpul") {
      setActiveFormTab("zon");
    } else if (currentHash === "#form-bilik-gerakan") {
      setActiveFormTab("bilik");
    } else {
      setActiveFormTab("semua");
    }
  }, [currentHash]);

  return (
    <div className="max-w-6xl mx-auto space-y-6" id="evacuation-form-container">
      
      {/* Real-time scanning helper for testing with separate URLs */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <div className="bg-white/15 p-3 rounded-2xl shrink-0 self-start md:self-auto">
          <Smartphone className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm tracking-tight">Simulasi Kod QR & Pautan Berbeza</h3>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            Dalam situasi bencana sebenar, setiap lokasi mempunyai kod QR / URL tersendiri. Imbas atau klik pautan berbeza mengikut peranan anda:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-wider text-emerald-300 uppercase block">Pautan 1: Zon Berkumpul</span>
                <span className="text-xs font-bold text-white mt-0.5 block">Headcount - Zon Berkumpul</span>
              </div>
              <a 
                href={urlZonBerkumpul}
                className="inline-block bg-white text-emerald-800 text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-md mt-2 hover:bg-emerald-50 transition-colors truncate text-center"
              >
                #form-zon-berkumpul
              </a>
            </div>

            <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black tracking-wider text-emerald-300 uppercase block">Pautan 2: Bilik Gerakan</span>
                <span className="text-xs font-bold text-white mt-0.5 block">Headcount - Bilik Gerakan</span>
              </div>
              <a 
                href={urlBilikGerakan}
                className="inline-block bg-white text-emerald-800 text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-md mt-2 hover:bg-emerald-50 transition-colors truncate text-center"
              >
                #form-bilik-gerakan
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector - only shown when not locked onto a specific deep-linked single form view */}
      {!isLockedZonBerkumpul && !isLockedBilikGerakan && (
        <div className="flex justify-center bg-slate-100 p-1 rounded-2xl max-w-md mx-auto border border-slate-200">
          <button
            onClick={() => setActiveFormTab("semua")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeFormTab === "semua" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Papar Kedua-dua
          </button>
          <button
            onClick={() => setActiveFormTab("zon")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeFormTab === "zon" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Zon Berkumpul
          </button>
          <button
            onClick={() => setActiveFormTab("bilik")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeFormTab === "bilik" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          >
            Bilik Gerakan
          </button>
        </div>
      )}

      {/* Grid containing duplicated side-by-side forms, dynamically hidden based on hash or active tab */}
      <div className={`grid gap-6 ${activeFormTab === "semua" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-xl mx-auto"}`}>
        {/* Form 1: Zon Berkumpul */}
        {(activeFormTab === "semua" || activeFormTab === "zon") && (
          <SingleForm 
            title="Headcount - Zon Berkumpul" 
            subtitle="Sila lengkapkan maklumat anda sebaik sahaja tiba di zon berkumpul." 
            location="Zon Berkumpul"
            customCategories={["Kakitangan Hospital", "Pesakit", "Orang Awam", "Agensi/NGO", "PAKSI/ERT"]}
            showDeptForCategories={["Kakitangan Hospital"]}
          />
        )}

        {/* Form 2: Bilik Gerakan */}
        {(activeFormTab === "semua" || activeFormTab === "bilik") && (
          <SingleForm 
            title="Headcount - Bilik Gerakan" 
            subtitle="Sila lengkapkan maklumat anda sekiranya anda bertugas di Bilik Gerakan." 
            location="Bilik Gerakan"
            customCategories={["Kakitangan Hospital", "Agensi/NGO", "PAKSI/ERT", "Pemerhati"]}
            showDeptForCategories={["Kakitangan Hospital", "PAKSI/ERT", "Pemerhati"]}
          />
        )}
      </div>
    </div>
  );
}
