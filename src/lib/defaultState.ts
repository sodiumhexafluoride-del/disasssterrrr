import { DrillState } from "../types";

export const defaultState: DrillState = {
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
