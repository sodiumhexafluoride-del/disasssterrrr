/**
 * Types for Disaster Management System - Hospital Sultan Ismail (HSI)
 */

export type EvacuationCategory = 
  | 'Kakitangan Hospital'
  | 'Pesakit'
  | 'Orang Awam'
  | 'Agensi/NGO'
  | 'PAKSI/ERT'
  | 'Pemerhati';

export type TriageCategory = 'Red' | 'Yellow' | 'Green' | 'White';

export interface EvacuatedPerson {
  id: string;
  name: string;
  roleOrId: string; // Employee ID, Patient ID, or Phone No
  category: EvacuationCategory;
  departmentOrWard?: string; // Optional ward or department name
  timestamp: string; // ISO string
}

export interface Victim {
  id: string;
  name: string;
  ageSex?: string; // e.g. "34 / Lelaki" or "50 / Perempuan"
  triage: TriageCategory;
  locationFound?: string; // Where the victim was found
  injuryDetails?: string; // Description of injury
  status: string; // e.g., "Menunggu Rawatan", "Dirawat di Zon Merah", "Dirujuk ke HSA"
  timestamp: string; // ISO string
}

export interface SituationLog {
  id: string;
  time: string; // Clock time (e.g. "10:15 AM" or drill relative time)
  situation: string; // Description of event
  type?: 'info' | 'warning' | 'critical' | 'success';
}

export interface DrillState {
  isRunning: boolean;
  startTime: number | null; // epoch timestamp
  pausedTime: number; // accumulated milliseconds
  scenario?: string;
  currentSituation: string;
  situationLogs: SituationLog[];
  evacuatedPersonnel: EvacuatedPerson[];
  victims: Victim[];
  // Manual counts override or baseline counts if needed
  manualEvacuatedCounts: Record<EvacuationCategory, number>;
  manualTriageCounts: Record<TriageCategory, number>;
}
