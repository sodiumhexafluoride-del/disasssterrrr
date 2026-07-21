import type { VercelRequest, VercelResponse } from "@vercel/node";
import { DrillState, EvacuatedPerson, Victim, SituationLog } from "../src/types";
import { initFirebase, isFirebaseActive, getFirebaseState, saveFirebaseState } from "../src/lib/firebaseServer";
import { defaultState } from "../src/lib/defaultState";

let initialized = false;
let memoryState: DrillState = structuredClone(defaultState);

async function getState(): Promise<DrillState> {
  if (!initialized) {
    initFirebase();
    initialized = true;
  }
  if (isFirebaseActive()) {
    const remote = await getFirebaseState();
    if (remote) return remote;
    await saveFirebaseState(memoryState);
  }
  return memoryState;
}

async function saveState(state: DrillState) {
  memoryState = state;
  if (isFirebaseActive()) await saveFirebaseState(state);
}

function cloneState(state: DrillState): DrillState {
  return structuredClone(state);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const path = (req.query.path as string[] | string | undefined);
    const parts = Array.isArray(path) ? path : (path ? [path] : []);
    const route = "/" + parts.join("/");
    const method = req.method || "GET";
    const body = (req.body || {}) as any;

    if (method === "GET" && route === "/state") {
      return res.status(200).json(await getState());
    }

    let state = cloneState(await getState());

    if (method === "POST" && route === "/timer") {
      const { action } = body;
      const now = Date.now();
      if (action === "start" && !state.isRunning) {
        state.isRunning = true; state.startTime = now;
      } else if (action === "pause" && state.isRunning && state.startTime) {
        state.isRunning = false; state.pausedTime += now - state.startTime; state.startTime = null;
      } else if (action === "reset") {
        state.isRunning = false; state.startTime = null; state.pausedTime = 0;
      }
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "POST" && route === "/evacuate") {
      const { name, roleOrId, category, departmentOrWard } = body;
      if (!name || !category) return res.status(400).json({ error: "Nama dan Kategori adalah wajib." });
      const person: EvacuatedPerson = {
        id: "evac-" + Math.random().toString(36).slice(2, 11), name,
        roleOrId: roleOrId || "-", category, departmentOrWard: departmentOrWard || "-",
        timestamp: new Date().toISOString()
      };
      state.evacuatedPersonnel.unshift(person);
      if (!(departmentOrWard && departmentOrWard.includes("Bilik Gerakan"))) {
        state.manualEvacuatedCounts[category] = (state.manualEvacuatedCounts[category] || 0) + 1;
      }
      await saveState(state); return res.status(200).json({ success: true, person });
    }

    if (method === "POST" && route === "/situation") {
      const { situation, type, timeStr } = body;
      if (!situation) return res.status(400).json({ error: "Situasi tidak boleh kosong." });
      const log: SituationLog = {
        id: "log-" + Math.random().toString(36).slice(2, 11),
        time: timeStr || new Date().toTimeString().split(" ")[0],
        situation, type: type || "info"
      };
      state.currentSituation = situation; state.situationLogs.unshift(log);
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "DELETE" && parts[0] === "situation" && parts[1]) {
      state.situationLogs = state.situationLogs.filter(log => log.id !== parts[1]);
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "POST" && route === "/victim") {
      const { id, name, ageSex, triage, locationFound, injuryDetails, status } = body;
      if (!name || !triage) return res.status(400).json({ error: "Nama dan Triage (Warna Tag) adalah wajib." });
      if (id) {
        const index = state.victims.findIndex(v => v.id === id);
        if (index !== -1) {
          const old = state.victims[index].triage;
          state.victims[index] = { ...state.victims[index], name, ageSex: ageSex || "-", triage,
            locationFound: locationFound || "-", injuryDetails: injuryDetails || "-", status: status || "Menunggu Rawatan" };
          if (old !== triage) {
            state.manualTriageCounts[old] = Math.max(0, state.manualTriageCounts[old] - 1);
            state.manualTriageCounts[triage] = (state.manualTriageCounts[triage] || 0) + 1;
          }
        }
      } else {
        const victim: Victim = {
          id: "vic-" + Math.random().toString(36).slice(2, 11), name, ageSex: ageSex || "-", triage,
          locationFound: locationFound || "-", injuryDetails: injuryDetails || "-",
          status: status || "Menunggu Rawatan", timestamp: new Date().toISOString()
        };
        state.victims.unshift(victim);
        state.manualTriageCounts[triage] = (state.manualTriageCounts[triage] || 0) + 1;
      }
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "DELETE" && parts[0] === "victim" && parts[1]) {
      const victim = state.victims.find(v => v.id === parts[1]);
      if (victim) state.manualTriageCounts[victim.triage] = Math.max(0, state.manualTriageCounts[victim.triage] - 1);
      state.victims = state.victims.filter(v => v.id !== parts[1]);
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "DELETE" && parts[0] === "evacuate" && parts[1]) {
      const person = state.evacuatedPersonnel.find(p => p.id === parts[1]);
      if (person && !(person.departmentOrWard && person.departmentOrWard.includes("Bilik Gerakan"))) {
        state.manualEvacuatedCounts[person.category] = Math.max(0, state.manualEvacuatedCounts[person.category] - 1);
      }
      state.evacuatedPersonnel = state.evacuatedPersonnel.filter(p => p.id !== parts[1]);
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "POST" && route === "/reset-all") {
      const reset = cloneState(defaultState);
      reset.isRunning = false; reset.startTime = null; reset.pausedTime = 0;
      reset.currentSituation = "Sistem bersedia. Menunggu latihan bermula.";
      reset.situationLogs = [{ id: "log-init", time: new Date().toTimeString().split(" ")[0],
        situation: "Sistem diaktifkan untuk Latihan Kebakaran HSI.", type: "info" }];
      reset.evacuatedPersonnel = []; reset.victims = [];
      Object.keys(reset.manualEvacuatedCounts).forEach(k => reset.manualEvacuatedCounts[k] = 0);
      Object.keys(reset.manualTriageCounts).forEach(k => reset.manualTriageCounts[k] = 0);
      await saveState(reset); return res.status(200).json(reset);
    }

    if (method === "POST" && route === "/counts/update") {
      const { type, category, value } = body;
      const n = parseInt(value, 10);
      if (Number.isNaN(n)) return res.status(400).json({ error: "Nilai mestilah nombor sah" });
      if (type === "evacuation") state.manualEvacuatedCounts[category] = Math.max(0, n);
      else if (type === "triage") state.manualTriageCounts[category] = Math.max(0, n);
      await saveState(state); return res.status(200).json(state);
    }

    if (method === "POST" && route === "/scenario") {
      const { scenario } = body;
      if (!scenario || typeof scenario !== "string") return res.status(400).json({ error: "Skenario tidak sah." });
      state.scenario = scenario.trim(); await saveState(state); return res.status(200).json(state);
    }

    return res.status(404).json({ error: "API route not found", route });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
