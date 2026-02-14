import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  ExternalLink,
  Zap,
  Globe,
  ShieldCheck,
  Briefcase,
  Link as LinkIcon,
  DollarSign,
  Linkedin,
  Mail,
  Clock,
  Cpu,
  MousePointerClick,
  ArrowRight,
  AlertTriangle,
  Copy,
  MessageSquare,
  Database,
  Search,
  Loader2,
  ShieldAlert,
  Activity,
  XCircle,
  TrendingUp,
  FileText,
  Presentation,
  MapPin,
  Users,
  Key,
  LogOut,
  History,
  Save,
  ArrowUpRight,
  Trash2,
  CheckCircle,
  Play,
  FileSearch,
  Target,
  Waves,
  Archive,
  ChevronDown
} from 'lucide-react';
import { analyzeProjectData, generateMissionBriefing, generateDiagnostic } from './geminiService.ts';
import { 
  logMission, 
  saveTopLead, 
  getMissionHistory, 
  getLeadsByStatus, 
  updateLeadStatus,
  getTopLeads,
  getActiveProjects,
  getArchivedLeads,
  MissionLog, 
  SavedLead 
} from './persistenceService.ts';
import { TriageResults, Sector, DALane, OperationalParameters, Opportunity, MissionBriefing, DiagnosticResult } from './types.ts';
import LaneBadge from './components/LaneBadge.tsx';
import LoginPage from './components/LoginPage.tsx';
import { supabase } from './supabaseClient.ts';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  
  // View State
  const [activeView, setActiveView] = useState<'SEARCH' | 'TOP_LEADS' | 'ACTIVE_PROJECTS' | 'HISTORY' | 'ARCHIVE'>('SEARCH');
  const [activeTab, setActiveTab] = useState<'mission' | 'intelligence'>('mission');
  const [dossierTab, setDossierTab] = useState<'comm' | 'strategy'>('comm');
  
  // Data State
  const [missionHistory, setMissionHistory] = useState<MissionLog[]>([]);
  const [inboxLeads, setInboxLeads] = useState<SavedLead[]>([]);
  const [activeProjects, setActiveProjects] = useState<SavedLead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<SavedLead[]>([]);
  const [results, setResults] = useState<TriageResults | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [currentBriefing, setCurrentBriefing] = useState<MissionBriefing | null>(null);
  const [currentDiagnostic, setCurrentDiagnostic] = useState<DiagnosticResult | null>(null);
  const [rfpMode, setRfpMode] = useState(false);
  
  // Loading & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [archiveLoadingView, setArchiveLoadingView] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const briefingRef = useRef<HTMLElement>(null);

  const [params, setParams] = useState<OperationalParameters>({
    sector: 'All Sectors',
    lane: 'All Lanes',
    budgetTier: 'All Tiers',
    customIntel: '',
    rfpMode: false
  });

  // Improved selection logic to find lead across all potential data sources
  const selectedLeadFromSearch = results?.leads.find(l => l.leadId === selectedLeadId);
  const selectedSavedLead = [...inboxLeads, ...activeProjects, ...archivedLeads].find(l => l.id === selectedLeadId);
  const activeSelectedLead: Opportunity | null = selectedLeadFromSearch || (selectedSavedLead ? selectedSavedLead.lead_data : null);

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Key Check
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        setHasKey(true);
      }
    };
    if (session) {
      checkKey();
    }
  }, [session]);

  // Sync Briefing Data on selection
  useEffect(() => {
    if (selectedSavedLead) {
      setCurrentBriefing(selectedSavedLead.dossier_data);
      setCurrentDiagnostic(null);
      setDossierTab('comm');
    } else if (selectedLeadFromSearch) {
      setCurrentBriefing(selectedLeadFromSearch.missionBriefing);
      setCurrentDiagnostic(null);
      setDossierTab('comm');
    } else {
      setCurrentBriefing(null);
      setCurrentDiagnostic(null);
    }
  }, [selectedLeadId, results, inboxLeads, activeProjects, archivedLeads]);

  // Data Refresh Logic
  useEffect(() => {
    if (!session) return;
    if (activeView === 'HISTORY') {
      fetchHistory();
    } else if (activeView === 'TOP_LEADS') {
      fetchInbox();
    } else if (activeView === 'ACTIVE_PROJECTS') {
      fetchActiveProjects();
    } else if (activeView === 'ARCHIVE') {
      fetchArchive();
    }
  }, [activeView, session]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await getMissionHistory();
      setMissionHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchInbox = async () => {
    setVaultLoading(true);
    try {
      const data = await getTopLeads();
      setInboxLeads(data);
    } finally {
      setVaultLoading(false);
    }
  };

  const fetchActiveProjects = async () => {
    setActiveLoading(true);
    try {
      const data = await getActiveProjects();
      setActiveProjects(data);
    } finally {
      setActiveLoading(false);
    }
  };

  const fetchArchive = async () => {
    setArchiveLoadingView(true);
    try {
      const data = await getArchivedLeads();
      setArchivedLeads(data);
    } finally {
      setArchiveLoadingView(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleLaunchMission = async () => {
    setIsLoading(true);
    setError(null);
    setArchiveStatus('idle');
    try {
      const searchParams = { ...params, rfpMode };
      const data = await analyzeProjectData(searchParams);
      setResults(data);
      if (data.leads.length > 0) {
        const topLead = [...data.leads].sort((a, b) => b.fitScore - a.fitScore)[0];
        setSelectedLeadId(topLead.leadId);
      }
      if (session?.user) {
        logMission(session.user, searchParams, data);
      }
      setActiveTab('intelligence');
    } catch (err: any) {
      setError("Intelligence Hub Alert: Market analysis session interrupted.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepDive = async () => {
    if (!activeSelectedLead) return;
    setBriefingLoading(true);
    setError(null);
    try {
      const briefing = await generateMissionBriefing(activeSelectedLead);
      setCurrentBriefing(briefing);
    } catch (err: any) {
      setError("Intelligence Synthesis Alert: Strategic briefing synthesis failed.");
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!activeSelectedLead) return;
    setDiagnosticLoading(true);
    try {
      const diagnosticData = await generateDiagnostic(activeSelectedLead);
      setCurrentDiagnostic(diagnosticData);
    } catch (err: any) {
      setError("Operational Insights Alert: Diagnostic synthesis failed.");
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleBucketChange = async (id: string, newStatus: 'inbox' | 'active' | 'closed' | 'archive', e: React.MouseEvent | React.ChangeEvent) => {
    if ('stopPropagation' in e) e.stopPropagation();
    try {
      await updateLeadStatus(id, newStatus);
      // Immediate state refresh
      fetchInbox();
      fetchActiveProjects();
      fetchArchive();
    } catch (err) {
      alert("Operational failure: Lead status synchronization failed.");
    }
  };

  const handleArchiveLeadSave = async (lead: Opportunity) => {
    if (!session?.user) return;
    setIsArchiving(true);
    setArchiveStatus('idle');
    try {
      await saveTopLead(session.user, lead, currentBriefing);
      setArchiveStatus('success');
      setTimeout(() => setArchiveStatus('idle'), 3000);
      fetchInbox();
    } catch (err) {
      setArchiveStatus('error');
      setTimeout(() => setArchiveStatus('idle'), 3000);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestoreFromHistory = (log: MissionLog) => {
    setResults(log.full_results);
    setParams({
      sector: log.sector as Sector,
      lane: log.lane as DALane,
      budgetTier: 'Restored',
      customIntel: 'Search history',
      rfpMode: log.full_results.summary.totalLeads > 0 ? (log.full_results.leads[0] as any).stageTrigger?.includes("RFP") : false
    });
    if (log.full_results.leads.length > 0) {
      setSelectedLeadId(log.full_results.leads[0].leadId);
    }
    setActiveView('SEARCH');
    setActiveTab('intelligence');
  };

  const highFitLeads = results?.leads.filter(l => l.fitScore >= 8).sort((a, b) => b.fitScore - a.fitScore) || [];

  const scrollToBriefing = () => {
    setTimeout(() => {
      briefingRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const calculatePartnerRevenue = (projectValueStr: string) => {
    const numericValue = parseInt(projectValueStr.replace(/[^\d]/g, ''));
    if (isNaN(numericValue)) return 'TBD';
    return `$${(numericValue * 0.8).toLocaleString()}`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const StatusDropdown = ({ id, currentStatus }: { id: string, currentStatus: string }) => (
    <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
      <select 
        value={currentStatus}
        onChange={(e) => handleBucketChange(id, e.target.value as any, e)}
        className="bg-slate-950 text-slate-400 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none pr-8 transition-all hover:border-slate-600"
      >
        <option value="inbox">Inbox</option>
        <option value="active">Active</option>
        <option value="closed">Closed Won</option>
        <option value="archive">Archive</option>
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600" />
    </div>
  );

  const EngagementBrief = ({ lead }: { lead: Opportunity }) => (
    <section ref={briefingRef} className="bg-[#0f1421] border-2 border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-10 mt-12">
      <div className="absolute top-10 right-10 pointer-events-none opacity-[0.03] select-none rotate-[15deg]">
         <span className="text-[120px] font-black text-white border-[20px] border-white px-20 py-10 rounded-full tracking-[0.2em] uppercase">INTERNAL ONLY</span>
      </div>
      <div className="relative z-10 space-y-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-slate-800/50 pb-10">
          <div className="flex items-start gap-8">
            <div className="p-5 bg-indigo-500/10 text-indigo-400 rounded-3xl border border-indigo-500/20 mt-1 shadow-inner"><Mail size={32} /></div>
            <div className="space-y-1">
              <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em]">ENGAGEMENT BRIEF</h3>
              <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-tight">{lead.targetName}</h2>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-4 border-y border-slate-800/30 mt-6">
                 <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest"><MapPin size={14} className="text-slate-500" /> {lead.companyLocation || 'Global Operations'}</div>
                 <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest"><Users size={14} className="text-slate-500" /> {lead.companySize || 'N/A'}</div>
                 <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest"><TrendingUp size={14} className="text-emerald-500" /> $100M+ (BUDGET ESTIMATE)</div>
              </div>
              <div className="flex gap-12 mt-8">
                <div className="space-y-1.5"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EST. PROJECT VALUE</p><p className="text-2xl font-black text-white tabular-nums">{lead.projectValue || 'TBD'}</p></div>
                <div className="w-px h-12 bg-slate-800" />
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">PARTNER REVENUE</p>
                  <p className="text-2xl font-black text-emerald-400 italic tabular-nums">{calculatePartnerRevenue(lead.projectValue)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mr-4 shadow-xl">
              <button onClick={() => setDossierTab('comm')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${dossierTab === 'comm' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Communication</button>
              <button onClick={() => setDossierTab('strategy')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${dossierTab === 'strategy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Insights</button>
            </div>
            {!selectedSavedLead && (
              <button onClick={() => handleArchiveLeadSave(lead)} disabled={isArchiving || briefingLoading} className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase transition-all shadow-2xl ${archiveStatus === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'}`}>
                {isArchiving ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />} {archiveStatus === 'success' ? 'LOGGED' : 'SAVE LEAD'}
              </button>
            )}
          </div>
        </div>
        <div className="min-h-[500px]">
           {dossierTab === 'comm' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="lg:col-span-7 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><FileText size={18} className="text-slate-400"/><h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Outreach Protocol</h4></div>
                    <button onClick={() => handleDeepDive()} disabled={briefingLoading} className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50">
                      {briefingLoading ? <Loader2 className="animate-spin" size={12}/> : <Zap size={12}/>} Synthesize Outreach
                    </button>
                 </div>
                 <div className="relative group">
                   <div className="absolute top-4 right-4 z-20">
                     <button onClick={() => handleCopy(currentBriefing?.emailDraft || "", 'draft')} className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 backdrop-blur-sm"><Copy size={12}/> {copyStatus === 'draft' ? 'COPIED' : 'COPY DRAFT'}</button>
                   </div>
                   <div className="p-8 bg-[#070a11] border-2 border-slate-800/50 rounded-3xl font-mono text-sm text-slate-300 whitespace-pre-line leading-relaxed shadow-inner min-h-[350px]">
                     <div className="mb-8 border-b border-slate-800/50 pb-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Draft: Strategic Engagement</div>
                     {currentBriefing?.emailDraft || "Decision system ready. Initiate briefing synthesis to generate custom outreach protocols."}
                   </div>
                 </div>
               </div>
               <div className="lg:col-span-5 space-y-8">
                 <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
                    <div className="flex items-center gap-3"><Briefcase size={18} className="text-slate-400"/><h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Stakeholder Identity</h4></div>
                    <div className="space-y-4 pt-4 border-t border-slate-800/50">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Target Persona</p>
                        <p className="text-xl font-black text-white">{lead.pocName}</p>
                        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-tight">{lead.pocTitle}</p>
                      </div>
                      <div className="space-y-2.5 pt-4">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Direct Contact (Predicted)</p>
                         <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${getConfidenceColor(lead.confidence)} shadow-sm`} />
                              <span className="text-[11px] font-mono text-slate-300">{lead.pocEmail || 'Analysis Pending...'}</span>
                            </div>
                            <Copy size={14} className="text-slate-600 cursor-pointer hover:text-indigo-400 transition-colors" onClick={() => handleCopy(lead.pocEmail || "", 'email')}/>
                         </div>
                         <div className="flex items-center gap-2 mt-2">
                           <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Intelligence Confidence:</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${lead.confidence > 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{lead.confidence || 0}%</span>
                         </div>
                      </div>
                    </div>
                 </div>
                 <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3"><MessageSquare size={18} className="text-indigo-400"/><h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em]">Discovery Question</h4></div>
                    <p className="text-lg font-black text-white italic leading-snug">"{currentBriefing?.discoveryQuestion || 'Strategic hypothesis pending synthesis...'}"</p>
                 </div>
                 <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-8 space-y-3 shadow-xl">
                    <div className="flex items-center gap-3"><ShieldAlert size={18} className="text-amber-500"/><h4 className="text-[11px] font-black uppercase text-amber-500 tracking-[0.2em]">Strategic Insight Note</h4></div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{currentBriefing?.internalNote || 'Strategic context awaiting account deep dive...'}</p>
                 </div>
               </div>
             </div>
           ) : (
             <div className="animate-in fade-in slide-in-from-left-4 duration-500 space-y-12">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3"><Activity size={18} className="text-emerald-400"/><h4 className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.2em]">Operational Assessment</h4></div>
                  {!currentDiagnostic && (
                    <button onClick={() => handleRunDiagnostic()} disabled={diagnosticLoading} className="flex items-center gap-2 bg-emerald-500 text-slate-900 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg">
                      {diagnosticLoading ? <Loader2 className="animate-spin" size={14}/> : <Cpu size={14}/>} {diagnosticLoading ? 'SYNTESIZING...' : 'Run Strategic Diagnostic'}
                    </button>
                  )}
               </div>
               <div className="bg-[#070a11] border-l-4 border-emerald-500 p-10 rounded-r-3xl shadow-xl space-y-4">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">Primary Objective</p>
                  <p className="text-2xl font-black text-white italic leading-tight">"{currentDiagnostic?.hypothesis || `Friction identified in ${lead.lane} trajectory. Synthesis required.`}"</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {(currentDiagnostic?.risks || []).map((risk, idx) => (
                    <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between shadow-xl group hover:border-red-500/30 transition-all">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-red-500/50"><AlertTriangle size={16}/><span className="text-[9px] font-black uppercase tracking-widest">Strategic Risk {idx + 1}</span></div>
                        <div className="space-y-3">
                          <h5 className="text-lg font-black text-white italic leading-tight uppercase">{risk.painPoint}</h5>
                          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{risk.impact}</p>
                        </div>
                      </div>
                      <div className="mt-10 pt-6 border-t border-slate-800/50 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-500/60"><ShieldCheck size={14}/><span className="text-[9px] font-black uppercase tracking-widest">Solution Framework</span></div>
                        <p className="text-[11px] font-black text-slate-200 tracking-tight leading-relaxed">{risk.daSolution}</p>
                      </div>
                    </div>
                  ))}
               </div>
               <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 shadow-2xl">
                  <div className="flex flex-col items-center justify-center p-6 bg-emerald-500 text-slate-900 rounded-3xl shadow-lg ring-4 ring-emerald-500/10 shrink-0">
                     <Target size={28} className="mb-2"/>
                     <span className="text-[8px] font-black uppercase tracking-widest text-center leading-none">Primary Indicator</span>
                  </div>
                  <div className="text-center md:text-left">
                     <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">{currentDiagnostic?.winningMetric || 'Primary KPI awaiting synthesis...'}</h4>
                     <div className="flex items-center gap-2 text-emerald-400/60 text-[10px] font-black uppercase tracking-widest"><Waves size={14}/> Operational Logic Engine Live</div>
                  </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </section>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f19] text-emerald-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Establishing Secure Connection...</p>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('SEARCH')}>
            <div className="bg-emerald-500 text-slate-900 p-2 rounded-lg shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400">
              <Presentation size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base tracking-tight text-white uppercase italic">District Scout</h1>
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">v7.3 WORKFLOW</span>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em]">Strategic Intelligence // Operational Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setActiveView('SEARCH')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${activeView === 'SEARCH' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                <Search size={14} /> SEARCH
              </button>
              <button onClick={() => setActiveView('TOP_LEADS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${activeView === 'TOP_LEADS' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                <Save size={14} /> TOP LEADS
              </button>
              <button onClick={() => setActiveView('ACTIVE_PROJECTS')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${activeView === 'ACTIVE_PROJECTS' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                <Zap size={14} /> PROJECTS
              </button>
              <button onClick={() => setActiveView('ARCHIVE')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${activeView === 'ARCHIVE' ? 'bg-slate-800 text-white shadow-lg ring-1 ring-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>
                <Archive size={14} /> ARCHIVE
              </button>
            </nav>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-6 ml-2">
              <button onClick={handleSelectKey} className="p-2.5 text-slate-500 hover:text-emerald-400 transition-colors" title="API Key"><Key size={18} /></button>
              <button onClick={handleSignOut} className="p-2.5 text-slate-500 hover:text-red-400 transition-colors" title="Sign Out"><LogOut size={18} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8">
        {activeView === 'SEARCH' && (
          <>
            {activeTab === 'mission' ? (
              <div className="max-w-2xl mx-auto py-12 space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/5 text-emerald-400 border border-emerald-400/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                    <TrendingUp size={14} className="animate-pulse" /> Market Intelligence Protocol
                  </div>
                  <h2 className="text-5xl font-black text-white tracking-tighter leading-none italic uppercase">Identify Strategic Opportunities.</h2>
                  <p className="text-slate-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">Strategic identification of organizational challenges through high-fidelity market mapping.</p>
                </div>
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-[2rem] p-8 md:p-10 shadow-2xl space-y-8 relative overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Industry Focus</label>
                      <select value={params.sector} onChange={(e) => setParams({...params, sector: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer">
                        <option value="All Sectors">All Industry Focus Areas</option>
                        {Object.values(Sector).map(s => <option key={s} value={s}>{s} Market</option>)}
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Briefcase size={14} /> Service Area</label>
                      <select value={params.lane} onChange={(e) => setParams({...params, lane: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer">
                        <option value="All Lanes">All Service Areas</option>
                        {Object.values(DALane).map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><DollarSign size={14} /> Valuation Tier</label>
                      <select value={params.budgetTier} onChange={(e) => setParams({...params, budgetTier: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer">
                        <option value="All Tiers">All Value Tiers</option>
                        <option value={"<$25k"}>Engagement Pilot {"(<$25k)"}</option>
                        <option value={"$25k-$50k"}>Strategic Project {"($25k-$50k)"}</option>
                        <option value={"$50k-$100k"}>Infrastructure Build {"($50k-$100k)"}</option>
                        <option value={"$100k+"}>Enterprise Transformation {"($100k+)"}</option>
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={14} /> Tactical Context</label>
                      <input type="text" value={params.customIntel} onChange={(e) => setParams({...params, customIntel: e.target.value})} placeholder="Keywords: 'Data Infrastructure', 'Private Equity'..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500 transition-all" />
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <button onClick={() => setRfpMode(!rfpMode)} className={`group relative flex items-center gap-3 px-8 py-3 rounded-xl border-2 transition-all duration-300 font-black text-[11px] uppercase tracking-[0.25em] ${rfpMode ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                      <FileSearch className={`w-4 h-4 ${rfpMode ? 'animate-pulse' : ''}`} /> {rfpMode ? 'RFP / CONTRACTS: ON' : 'RFP / CONTRACTS: OFF'}
                      {rfpMode && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-lg">LIVE</span>}
                    </button>
                  </div>
                  {error && <div className="flex items-center gap-3 text-red-400 bg-red-400/10 p-5 rounded-xl border border-red-400/20"><AlertCircle size={20} /><span className="text-xs font-bold">{error}</span></div>}
                  <button onClick={handleLaunchMission} disabled={isLoading} className="group w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />} {isLoading ? "EXECUTING MISSION..." : "FIND STRATEGIC OPPORTUNITIES"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-16 animate-in slide-in-from-bottom-6 duration-700">
                <section className="space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-8 justify-between p-8 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <div className="space-y-1 text-center md:text-left flex-1">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest italic tracking-[0.2em]">Market Intelligence // Active Search</span>
                      </div>
                      <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Identified Engagements</h2>
                    </div>
                    <div className="flex gap-10 items-center">
                      <div className="text-center md:text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Targets Identified</p>
                        <p className="text-2xl font-black text-white tabular-nums">{highFitLeads.length}</p>
                      </div>
                      <div className="w-px h-10 bg-slate-800" />
                      <div className="text-center md:text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Pipeline</p>
                        <p className="text-2xl font-black text-emerald-400 tabular-nums">{results?.summary.estimatedPipelineValue}</p>
                      </div>
                    </div>
                  </div>
                  
                  {highFitLeads.length === 0 ? (
                    <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 flex flex-col items-center justify-center gap-6 text-center">
                      <XCircle size={48} className="text-slate-700" />
                      <h3 className="text-xl font-black text-white uppercase italic">No High-Confidence Targets Identified</h3>
                      <button onClick={() => { setResults(null); setActiveTab('mission'); }} className="px-8 py-3 bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-slate-700 hover:bg-slate-700">Refine Intelligence protocol</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {highFitLeads.map((lead) => (
                        <div key={lead.leadId} onClick={() => { setSelectedLeadId(lead.leadId); scrollToBriefing(); }} className={`relative p-6 bg-slate-900 border-2 rounded-[2rem] transition-all cursor-pointer group shadow-xl ${selectedLeadId === lead.leadId ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-800 hover:border-slate-700'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col">
                              <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors leading-tight">{lead.targetName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{lead.sectorSource} Market</span>
                                <a href={lead.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"><ExternalLink size={10} /> Verify</a>
                              </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${lead.fitScore >= 9 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>{lead.fitScore.toFixed(1)}</div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-4">
                            {lead.companyLocation && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /><span className="text-[11px] font-bold">{lead.companyLocation}</span></div>}
                            {lead.companySize && <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-slate-500" /><span className="text-[11px] font-bold">{lead.companySize}</span></div>}
                          </div>
                          <div className="mb-4 space-y-2">
                            <LaneBadge lane={lead.lane} />
                            <p className="text-[11px] font-medium text-slate-400 italic line-clamp-2">"{lead.diagnosticLogic}"</p>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10">{lead.techStack}</span>
                            <span className="text-[10px] font-black text-white">{lead.projectValue}</span>
                          </div>
                          <div className="mt-4 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 flex justify-between items-center group/contact">
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-2 h-2 rounded-full ${getConfidenceColor(lead.confidence)} shadow-sm`} />
                                <span className="text-xs font-black text-slate-200 uppercase tracking-tight truncate">{lead.pocName}</span>
                              </div>
                              {lead.pocEmail && <div className="text-[10px] text-indigo-400 font-mono truncate"><Mail className="inline w-3 h-3 mr-1" />{lead.pocEmail}</div>}
                            </div>
                            {lead.pocLinkedIn && lead.pocLinkedIn !== 'NA' && <a href={lead.pocLinkedIn} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-2.5 bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl"><Linkedin className="w-4 h-4 text-blue-400" /></a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
                {activeSelectedLead && <EngagementBrief lead={activeSelectedLead} />}
                <div className="flex justify-center py-10"><button onClick={() => { setResults(null); setSelectedLeadId(null); setActiveTab('mission'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-10 py-4 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3">Close Dashboard // Reset View <ArrowRight size={14} /></button></div>
              </div>
            )}
          </>
        )}

        {activeView === 'TOP_LEADS' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-800 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400"><Save size={20} /><span className="text-[10px] font-black uppercase tracking-[0.3em]">SECURE INBOX</span></div>
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Qualified Targets</h2>
                <p className="text-slate-500 font-medium">Market opportunities identified for strategic outreach.</p>
              </div>
              <div className="text-right"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Size</p><p className="text-4xl font-black text-white tabular-nums">{inboxLeads.length}</p></div>
            </div>
            {vaultLoading ? <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="animate-spin text-emerald-400" size={32} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Decrypting Inbox...</p></div> : 
              inboxLeads.length === 0 ? (
                <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 flex flex-col items-center justify-center gap-6 text-center">
                  <Database size={48} className="opacity-20" /><h3 className="text-xl font-black text-white uppercase italic">Vault Empty</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {inboxLeads.map((vaultItem) => (
                    <div key={vaultItem.id} onClick={() => { setSelectedLeadId(vaultItem.id); scrollToBriefing(); }} className={`bg-slate-900 border-2 rounded-[2rem] p-8 space-y-6 transition-all group relative overflow-hidden cursor-pointer ${selectedLeadId === vaultItem.id ? 'border-emerald-500' : 'border-slate-800 hover:border-emerald-500/50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1"><h3 className="text-xl font-black text-white uppercase italic leading-tight">{vaultItem.target_name}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{vaultItem.target_role}</p></div>
                        <StatusDropdown id={vaultItem.id} currentStatus={vaultItem.status || 'inbox'} />
                      </div>
                      <div className="flex items-center justify-between"><LaneBadge lane={vaultItem.lead_data.lane} /><a href={vaultItem.lead_data.sourceUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[9px] text-blue-400 hover:underline flex items-center gap-1"><ExternalLink size={10}/> Verify Source</a></div>
                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2"><Clock size={12} /> {new Date(vaultItem.created_at).toLocaleDateString()}</div>
                        <div className="text-emerald-400 font-bold">{vaultItem.lead_data.projectValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            {activeSelectedLead && <EngagementBrief lead={activeSelectedLead} />}
          </div>
        )}

        {activeView === 'ACTIVE_PROJECTS' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-800 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-400"><Zap size={20} /><span className="text-[10px] font-black uppercase tracking-[0.3em]">OPERATIONAL PIPELINE</span></div>
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Engagement Pipeline</h2>
                <p className="text-slate-500 font-medium">Active and closed-won mandates in progress.</p>
              </div>
              <div className="text-right"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pipeline Count</p><p className="text-4xl font-black text-white tabular-nums">{activeProjects.length}</p></div>
            </div>
            {activeLoading ? <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="animate-spin text-blue-400" size={32} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing Pipeline...</p></div> : 
              activeProjects.length === 0 ? (
                <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 flex flex-col items-center justify-center gap-6 text-center">
                  <Play size={48} className="opacity-20 text-blue-400" /><h3 className="text-xl font-black text-white uppercase italic">Pipeline Inactive</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {activeProjects.map((project) => (
                    <div key={project.id} onClick={() => { setSelectedLeadId(project.id); scrollToBriefing(); }} className={`bg-slate-900 border-2 rounded-[2rem] p-8 space-y-6 transition-all group relative overflow-hidden cursor-pointer ${selectedLeadId === project.id ? 'border-blue-500' : 'border-slate-800 hover:border-blue-500/50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1"><h3 className="text-xl font-black text-white uppercase italic leading-tight">{project.target_name}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.target_role}</p></div>
                        <StatusDropdown id={project.id} currentStatus={project.status || 'active'} />
                      </div>
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Project Revenue</p>
                        <p className="text-2xl font-black text-emerald-400 italic tabular-nums">{calculatePartnerRevenue(project.lead_data.projectValue)}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2"><Clock size={12} /> {new Date(project.created_at).toLocaleDateString()}</div>
                        {project.status === 'active' ? <div className="flex items-center gap-1.5 text-blue-400 animate-pulse"><Activity size={12} /> IN SPRINT</div> : <div className="flex items-center gap-1.5 text-emerald-500"><CheckCircle size={12} /> CLOSED WON</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            {activeSelectedLead && <EngagementBrief lead={activeSelectedLead} />}
          </div>
        )}

        {activeView === 'ARCHIVE' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-800 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-500"><Archive size={20} /><span className="text-[10px] font-black uppercase tracking-[0.3em]">STRATEGIC ARCHIVE</span></div>
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Strategic Archive</h2>
                <p className="text-slate-500 font-medium">Historical intelligence storage for pattern recognition.</p>
              </div>
            </div>
            {archiveLoadingView ? <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="animate-spin text-slate-500" size={32} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Accessing Vault...</p></div> : 
              archivedLeads.length === 0 ? (
                <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 flex flex-col items-center justify-center gap-6 text-center">
                  <Archive size={48} className="opacity-20 text-slate-500" /><h3 className="text-xl font-black text-white uppercase italic">Archive Empty</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {archivedLeads.map((project) => (
                    <div key={project.id} onClick={() => { setSelectedLeadId(project.id); scrollToBriefing(); }} className={`bg-slate-900/40 border-2 rounded-[2rem] p-8 space-y-6 transition-all group relative overflow-hidden grayscale opacity-70 hover:grayscale-0 hover:opacity-100 cursor-pointer ${selectedLeadId === project.id ? 'border-slate-400' : 'border-slate-800'}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1"><h3 className="text-xl font-black text-white uppercase italic leading-tight">{project.target_name}</h3><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{project.target_role}</p></div>
                        <StatusDropdown id={project.id} currentStatus={project.status || 'archive'} />
                      </div>
                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2"><Clock size={12} /> Archived: {new Date(project.created_at).toLocaleDateString()}</div>
                        <div className="font-bold">{project.lead_data.projectValue}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            {activeSelectedLead && <EngagementBrief lead={activeSelectedLead} />}
          </div>
        )}

        {activeView === 'HISTORY' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-800 pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-400"><History size={20} /><span className="text-[10px] font-black uppercase tracking-[0.3em]">OPERATIONAL LOGS</span></div>
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Mission Logs</h2>
                <p className="text-slate-500 font-medium">Chronological record of intelligence protocols.</p>
              </div>
            </div>
            {historyLoading ? <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="animate-spin text-blue-400" size={32} /><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading History...</p></div> : 
              missionHistory.length === 0 ? (
                <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[3rem] py-32 flex flex-col items-center justify-center gap-6 text-center">
                  <History size={48} className="opacity-20" /><h3 className="text-xl font-black text-white uppercase italic">No History</h3>
                </div>
              ) : (
                <div className="overflow-hidden bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-slate-950 border-b border-slate-800"><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector Focus</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Area</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Leads</th><th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {missionHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="p-6 font-mono text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="p-6 font-black text-white text-sm italic uppercase">{log.sector}</td>
                          <td className="p-6"><span className="bg-slate-950 text-blue-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-blue-500/20">{log.lane}</span></td>
                          <td className="p-6 font-black text-white tabular-nums">{log.result_count}</td>
                          <td className="p-6"><button onClick={() => handleRestoreFromHistory(log)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-400 transition-all">Restore <ArrowUpRight size={14} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-8 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 grayscale opacity-40"><Presentation size={18} /><span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-slate-500">District Analyst Strategy Hub</span></div>
          <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">&copy; 2025 District Analyst LLC // Integrity v7.3</div>
        </div>
      </footer>
    </div>
  );
}

export default App;