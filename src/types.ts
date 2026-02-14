export enum DALane {
  ANALYTICS = 'Strategy & Analytics',
  FINANCE = 'Finance / FP&A',
  AUTOMATION = 'AI / Automation',
  SECURITY = 'Cyber / Infra'
}

export enum Sector {
  GOV = 'Gov',
  PE = 'PE',
  CORPORATE = 'Corp',
  STARTUP = 'Startup'
}

export interface MissionBriefing {
  emailDraft: string;
  discoveryQuestion: string;
  internalNote: string;
}

export interface DiagnosticRisk {
  painPoint: string;
  impact: string;
  daSolution: string;
}

export interface DiagnosticResult {
  hypothesis: string;
  risks: DiagnosticRisk[];
  winningMetric: string;
}

export interface Opportunity {
  leadId: string;
  targetName: string;
  companyUrl: string;
  sectorSource: string;
  stageTrigger: string;
  deadline: string; 
  techStack: string; 
  lane: DALane;
  fitScore: number;
  projectValue: string;
  
  // Enrichment fields
  companyLocation?: string;
  companyAddress?: string;
  companySize?: string;
  revenueRange?: string;
  pocEmail?: string;

  // Stability Fields
  sourceUrl: string;
  confidence: number; // 1-100
  dateFound: string;

  pocName: string;
  pocTitle: string;
  pocLinkedIn: string;
  diagnosticLogic: string;
  hook: string;
  accessPoint: string;
  owner: string;
  isCriticalBridgeSprint: boolean; 
  isPEPrioritized: boolean; 
  missionBriefing: MissionBriefing;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface OperationalParameters {
  sector: Sector | 'All Sectors';
  lane: DALane | 'All Lanes';
  budgetTier: string;
  customIntel: string;
  rfpMode?: boolean;
}

export interface TriageResults {
  summary: {
    totalLeads: number;
    highPriorityLeads: number;
    estimatedPipelineValue: string;
  };
  leads: Opportunity[];
  sources: GroundingSource[];
}