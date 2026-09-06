// ============================================================
// THE PHOTO NEVER LIES — Core Type Definitions
// ============================================================

export type EvidenceStatus = 'locked' | 'unreviewed' | 'investigating' | 'verified' | 'complete';
export type ClueType = 'vehicle' | 'person' | 'object' | 'location' | 'text' | 'timestamp';
export type DecisionId = 'report' | 'publish' | 'sell' | 'investigate';
export type EndingId = 'good-investigator' | 'the-scoop' | 'the-fixer' | 'dig-deeper';

export interface ClueZone {
  id: string;
  label: string;
  description: string;
  // Descriptive region (for UI hints, not computer vision)
  region: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'any';
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  detail: string;
  type: ClueType;
  evidenceId: string;
  linkedEntities: string[];
  xp: number;
  isDiscovered?: boolean; // runtime state
}

export interface Evidence {
  id: string;
  title: string;
  caseId: string;
  location: string;
  timestamp: string;
  imageSrc: string; // URL or base64
  description: string;
  anomalyHint: string;
  status: EvidenceStatus;
  clueZones: ClueZone[];
  clueIds: string[]; // IDs of clues discoverable in this evidence
}

export interface Suspect {
  id: string;
  alias: string;
  description: string;
  linkedClueIds: string[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  linkedClueIds: string[];
}

export interface Decision {
  id: DecisionId;
  label: string;
  description: string;
  consequence: string;
  reputationDelta: number;
  heatDelta: number;
  endingId: EndingId;
}

export interface Ending {
  id: EndingId;
  title: string;
  headline: string;
  narrative: string;
  reputationChange: number;
  heatChange: number;
  badge: string;
}

export interface Case {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  briefing: string;
  timestamp: string;
  status: 'open' | 'closed' | 'cold';
  evidence: Evidence[];
  clues: Clue[];
  suspects: Suspect[];
  locations: Location[];
  decisions: Decision[];
  endings: Ending[];
}

// ============================================================
// Player / Game State Types
// ============================================================

export interface InvestigationMeta {
  evidenceId: string;
  annotations: {
    type: string;
    note: string;
  }[];
  discoveredClueIds: string[];
  savedImage: string; // base64
  timestamp: string;
}

export interface PlayerState {
  reputation: number;
  heat: number;
  casesCompleted: number;
  rank: string;
}

export interface GameState {
  currentCaseId: string | null;
  player: PlayerState;
  discoveredClues: string[];
  reviewedEvidence: string[];
  savedImages: Record<string, string>; // evidenceId → base64
  investigationMeta: Record<string, InvestigationMeta>;
  decision: DecisionId | null;
  ending: EndingId | null;
  progress: number; // 0-100
}

// ============================================================
// Board Node Types (Evidence Board)
// ============================================================

export type NodeType = 'evidence' | 'clue' | 'suspect' | 'location' | 'vehicle' | 'event';

export interface BoardNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  isDiscovered: boolean;
  connections: string[]; // IDs of connected nodes
  x?: number; // layout position
  y?: number;
}

// ============================================================
// AI Assistant Types
// ============================================================

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AssistantContext {
  caseId: string;
  discoveredClues: Clue[];
  reviewedEvidence: Evidence[];
  currentEvidenceId?: string;
}
