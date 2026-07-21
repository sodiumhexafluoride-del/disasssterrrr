import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DrillState, EvacuatedPerson, Victim, SituationLog } from "./src/types";
import { initFirebase, isFirebaseActive, getFirebaseState, saveFirebaseState } from "./src/lib/firebaseServer";


const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Default initial state representing an active fire drill at Hospital Sultan Ismail
const defaultState: DrillState = {
  isRunning: false,
  startTime: null,
  pausedTime: 0,
  scenario: "Sistem Pengurusan Bencana Nyata & Selaras",
  currentSituation: "Latihan Kebakaran (Fire Drill) bermula. Bangunan sedang dikosongkan secara berperingkat.",
  situationLogs: [
    {
      id: "log-1",
      time: "09:00:00",
      situation: "Penggera kebakaran utama HSI diaktifkan di Blok Clinical.",
      type: "critical"
    },
    {
      id: "log-2",
      time: "09:02:15",
      situation: "Panggilan kecemasan disimulasikan kepada Balai Bomba dan Penyelamat (BBP) Johor Bahru.",
      type: "warning"
    },
    {
      id: "log-3",
      time: "09:05:30",
      situation: "Pasukan PAKSI / ERT HSI mula digerakkan ke zon-zon pengungsian.",
      type: "info"
    },
    {
      id: "log-4",
      time: "09:12:00",
      situation: "Kakitangan dan pesakit stabil dari Wad 5A & 5B mula tiba di Tapak Berkumpul Utama (Assembly Point).",
      type: "success"
    }
  ],
  evacuatedPersonnel: [
    {
      id: "evac-1",
      name: "Ahmad Syahmi bin Razali",
      roleOrId: "Staff-9821",
      category: "Kakitangan Hospital",
      departmentOrWard: "Jabatan Kecemasan & Trauma",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: "evac-2",
      name: "Nurul Izzah binti Hamdan",
      roleOrId: "Staff-7762",
      category: "Kakitangan Hospital",
      departmentOrWard: "Wad Kanak-Kanak 4C",
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString()
    },
    {
      id: "evac-3",
      name: "Roslan bin Abu Bakar",
      roleOrId: "P-33421",
      category: "Pesakit",
      departmentOrWard: "Wad Ortopedik 3A",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: "evac-4",
      name: "Chong Wei Kiat",
      roleOrId: "P-55210",
      category: "Pesakit",
      departmentOrWard: "Klinik Pakar Pesakit Luar",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    {
      id: "evac-5",
      name: "Santhi a/p Subramaniam",
      roleOrId: "Pelawat-012891",
      category: "Orang Awam",
      departmentOrWard: "Lobi Utama",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: "evac-6",
      name: "Farhan bin Daniel",
      roleOrId: "ERT-02",
      category: "PAKSI/ERT",
      departmentOrWard: "Unit Keselamatan",
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString()
    },
    {
      id: "evac-7",
      name: "Kpl Md Zulkifli (APM)",
      roleOrId: "APM-889",
      category: "Agensi/NGO",
      departmentOrWard: "Angkatan Pertahanan Awam",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    }
  ],
  victims: [
    {
      id: "vic-1",
      name: "Kamil bin Osman",
      ageSex: "42 / Lelaki",
      triage: "Red",
      locationFound: "Tangga Kecemasan Blok B",
      injuryDetails: "Sesak nafas teruk akibat sedutan asap pebal, tidak sedarkan diri",
      status: "Menerima bantuan oksigen di Khemah Rawatan Merah",
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    {
      id: "vic-2",
      name: "Mariam binti Yusof",
      ageSex: "65 / Perempuan",
      triage: "Yellow",
      locationFound: "Laluan Aras 2 Blok Klinikal",
      injuryDetails: "Kecederaan disyaki patah pergelangan kaki kanan semasa evakuasi",
      status: "Kaki dipasang splint, menunggu giliran ambulans",
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: "vic-3",
      name: "Lim Ah Seng",
      ageSex: "19 / Lelaki",
      triage: "Green",
      locationFound: "Kawasan Parkir Pelawat",
      injuryDetails: "Luka calar-calar ringan di bahagian lengan kiri",
      status: "Diberikan rawatan pencucian luka & balutan",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    }
  ],
  manualEvacuatedCounts: {
    "Kakitangan Hospital": 14,
    "Pesakit": 9,
    "Orang Awam": 6,
    "Agensi/NGO": 4,
    "PAKSI/ERT": 8,
    "Pemerhati": 0
  },
  manualTriageCounts: {
    "Red": 1,
    "Yellow": 1,
    "Green": 1,
    "White": 0
  }
};

// Helper to read database
function getDbState(): DrillState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (!parsed.scenario) {
        parsed.scenario = "Sistem Pengurusan Bencana Nyata & Selaras";
      }
      return parsed;
    }
  } catch (error) {
    console.error("Error reading database file, resetting to default:", error);
  }
  // If reading fails or file doesn't exist, write and return default
  saveDbState(defaultState);
  return defaultState;
}

// Helper to save database
function saveDbState(state: DrillState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf8");
    if (isFirebaseActive()) {
      saveFirebaseState(state).catch(err => {
        console.error("🔥 [Firebase] Error saving state to Firestore:", err);
      });
    }
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

async function startServer() {
  // Initialize Firebase Admin SDK
  initFirebase();

  // If Firebase is active, try to fetch initial state and write to local cache (db.json)
  if (isFirebaseActive()) {
    console.log("🔥 [Firebase] Fetching active state on startup...");
    try {
      const fbState = await getFirebaseState();
      if (fbState) {
        console.log("🔥 [Firebase] Successfully loaded state from Firestore. Synchronizing local cache.");
        fs.writeFileSync(DB_PATH, JSON.stringify(fbState, null, 2), "utf8");
      } else {
        console.log("🔥 [Firebase] No existing state found in Firestore. Seeding current local state to Firestore.");
        const currentLocalState = getDbState();
        await saveFirebaseState(currentLocalState);
      }
    } catch (error) {
      console.error("🔥 [Firebase] Failed to synchronize state on startup:", error);
    }
  }

  const app = express();
  app.use(express.json());

  // API Endpoints
  
  // 1. Get entire drill state (dashboard sync)
  app.get("/api/state", (req, res) => {
    res.json(getDbState());
  });

  // 2. Start/Pause/Reset timer
  app.post("/api/timer", (req, res) => {
    const { action } = req.body;
    const state = getDbState();
    
    const now = Date.now();
    if (action === "start") {
      if (!state.isRunning) {
        state.isRunning = true;
        state.startTime = now;
      }
    } else if (action === "pause") {
      if (state.isRunning && state.startTime) {
        state.isRunning = false;
        state.pausedTime += (now - state.startTime);
        state.startTime = null;
      }
    } else if (action === "reset") {
      state.isRunning = false;
      state.startTime = null;
      state.pausedTime = 0;
    }
    
    saveDbState(state);
    res.json(state);
  });

  // 3. Register evacuation person (Form Route)
  app.post("/api/evacuate", (req, res) => {
    const { name, roleOrId, category, departmentOrWard } = req.body;
    
    if (!name || !category) {
      return res.status(400).json({ error: "Nama dan Kategori adalah wajib." });
    }

    const state = getDbState();
    
    const newPerson: EvacuatedPerson = {
      id: "evac-" + Math.random().toString(36).substr(2, 9),
      name,
      roleOrId: roleOrId || "-",
      category,
      departmentOrWard: departmentOrWard || "-",
      timestamp: new Date().toISOString()
    };

    state.evacuatedPersonnel.unshift(newPerson); // Put at start of list
    
    // Increment the counters ONLY if not registered for Bilik Gerakan
    const isBilikGerakan = departmentOrWard && departmentOrWard.includes("Bilik Gerakan");
    if (!isBilikGerakan) {
      if (state.manualEvacuatedCounts[category] !== undefined) {
        state.manualEvacuatedCounts[category] += 1;
      } else {
        state.manualEvacuatedCounts[category] = 1;
      }
    }

    saveDbState(state);
    res.json({ success: true, person: newPerson });
  });

  // 4. Update the current situation status and add log
  app.post("/api/situation", (req, res) => {
    const { situation, type, timeStr } = req.body;
    if (!situation) {
      return res.status(400).json({ error: "Situasi tidak boleh kosong." });
    }

    const state = getDbState();
    
    // Determine timestamp
    let formattedTime = timeStr;
    if (!formattedTime) {
      const now = new Date();
      formattedTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    }

    const newLog: SituationLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      time: formattedTime,
      situation,
      type: type || "info"
    };

    state.currentSituation = situation;
    state.situationLogs.unshift(newLog);

    saveDbState(state);
    res.json(state);
  });

  // 5. Delete situation log
  app.delete("/api/situation/:id", (req, res) => {
    const { id } = req.params;
    const state = getDbState();
    state.situationLogs = state.situationLogs.filter(log => log.id !== id);
    saveDbState(state);
    res.json(state);
  });

  // 6. Manage Victims (Add / Edit)
  app.post("/api/victim", (req, res) => {
    const { id, name, ageSex, triage, locationFound, injuryDetails, status } = req.body;
    
    if (!name || !triage) {
      return res.status(400).json({ error: "Nama dan Triage (Warna Tag) adalah wajib." });
    }

    const state = getDbState();

    if (id) {
      // Edit existing victim
      const index = state.victims.findIndex(v => v.id === id);
      if (index !== -1) {
        const oldTriage = state.victims[index].triage;
        state.victims[index] = {
          ...state.victims[index],
          name,
          ageSex: ageSex || "-",
          triage,
          locationFound: locationFound || "-",
          injuryDetails: injuryDetails || "-",
          status: status || "Menunggu Rawatan"
        };
        
        // Recalculate dynamic triage count adjustments
        if (oldTriage !== triage) {
          state.manualTriageCounts[oldTriage] = Math.max(0, state.manualTriageCounts[oldTriage] - 1);
          state.manualTriageCounts[triage] = (state.manualTriageCounts[triage] || 0) + 1;
        }
      }
    } else {
      // Add new victim
      const newVictim: Victim = {
        id: "vic-" + Math.random().toString(36).substr(2, 9),
        name,
        ageSex: ageSex || "-",
        triage,
        locationFound: locationFound || "-",
        injuryDetails: injuryDetails || "-",
        status: status || "Menunggu Rawatan",
        timestamp: new Date().toISOString()
      };
      
      state.victims.unshift(newVictim);
      
      // Increment counter
      state.manualTriageCounts[triage] = (state.manualTriageCounts[triage] || 0) + 1;
    }

    saveDbState(state);
    res.json(state);
  });

  // 7. Delete victim
  app.delete("/api/victim/:id", (req, res) => {
    const { id } = req.params;
    const state = getDbState();
    
    const victimToDelete = state.victims.find(v => v.id === id);
    if (victimToDelete) {
      const trg = victimToDelete.triage;
      state.manualTriageCounts[trg] = Math.max(0, state.manualTriageCounts[trg] - 1);
    }
    
    state.victims = state.victims.filter(v => v.id !== id);
    saveDbState(state);
    res.json(state);
  });

  // 8. Delete evacuated person
  app.delete("/api/evacuate/:id", (req, res) => {
    const { id } = req.params;
    const state = getDbState();
    
    const personToDelete = state.evacuatedPersonnel.find(p => p.id === id);
    if (personToDelete) {
      const cat = personToDelete.category;
      const isBilikGerakan = personToDelete.departmentOrWard && personToDelete.departmentOrWard.includes("Bilik Gerakan");
      if (!isBilikGerakan) {
        state.manualEvacuatedCounts[cat] = Math.max(0, state.manualEvacuatedCounts[cat] - 1);
      }
    }
    
    state.evacuatedPersonnel = state.evacuatedPersonnel.filter(p => p.id !== id);
    saveDbState(state);
    res.json(state);
  });

  // 9. Reset and re-seed the system (e.g. for a brand-new drill session)
  app.post("/api/reset-all", (req, res) => {
    const resetState: DrillState = {
      isRunning: false,
      startTime: null,
      pausedTime: 0,
      scenario: "Sistem Pengurusan Bencana Nyata & Selaras",
      currentSituation: "Sistem bersedia. Menunggu latihan bermula.",
      situationLogs: [
        {
          id: "log-init",
          time: new Date().toTimeString().split(' ')[0],
          situation: "Sistem diaktifkan untuk Latihan Kebakaran HSI.",
          type: "info"
        }
      ],
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
      manualTriageCounts: {
        "Red": 0,
        "Yellow": 0,
        "Green": 0,
        "White": 0
      }
    };
    
    saveDbState(resetState);
    res.json(resetState);
  });

  // 10. Update manual count override directly (for fast corrections)
  app.post("/api/counts/update", (req, res) => {
    const { type, category, value } = req.body;
    const state = getDbState();
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return res.status(400).json({ error: "Nilai mestilah nombor sah" });
    }

    if (type === "evacuation") {
      state.manualEvacuatedCounts[category as any] = Math.max(0, numValue);
    } else if (type === "triage") {
      state.manualTriageCounts[category as any] = Math.max(0, numValue);
    }
    
    saveDbState(state);
    res.json(state);
  });

  // 11. Update active scenario name
  app.post("/api/scenario", (req, res) => {
    const { scenario } = req.body;
    if (!scenario || typeof scenario !== "string") {
      return res.status(400).json({ error: "Skenario tidak sah." });
    }
    const state = getDbState();
    state.scenario = scenario.trim();
    saveDbState(state);
    res.json(state);
  });

  // Serve static assets and bundle configurations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Disaster Management Server running on http://localhost:${PORT}`);
  });
}

startServer();
