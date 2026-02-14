import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, AlertCircle, ExternalLink, Zap, Globe, ShieldCheck, 
  Briefcase, Link as LinkIcon, DollarSign, Linkedin, Mail, Clock, 
  Cpu, MousePointerClick, ArrowRight, AlertTriangle, Copy, 
  MessageSquare, Database, Search, Loader2, ShieldAlert, Activity, 
  XCircle, TrendingUp, FileText, Presentation, MapPin, Users, 
  Key, LogOut, History, Save, ArrowUpRight, Trash2, CheckCircle, 
  Play, FileSearch, Target, Waves, Archive, ChevronDown 
} from 'lucide-react';
import { analyzeProjectData, generateMissionBriefing, generateDiagnostic } from './geminiService.ts';
import { 
  logMission, saveTopLead, getMissionHistory, updateLeadStatus,
  getTopLeads, getActiveProjects, getArchivedLeads, MissionLog, SavedLead 
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

  const selectedLeadFromSearch = results?.leads.find(l => l.leadId === selectedLeadId);
  const selectedSavedLead = [...inboxLeads, ...activeProjects, ...archivedLeads].find(l => l.id === selectedLeadId);
  const activeSelectedLead: Opportunity | null = selectedLeadFromSearch || (selectedSavedLead ? selectedSavedLead.lead_data : null);

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

  useEffect(() => {
    if (!session) return;
    if (activeView === 'HISTORY') fetchHistory();
    else if (activeView === 'TOP_LEADS') fetchInbox();
    else if (activeView === 'ACTIVE_PROJECTS') fetchActiveProjects();
    else if (activeView === 'ARCHIVE') fetchArchive();
  }, [activeView, session]);

  const fetchHistory = async () => { setHistoryLoading(true); try { const data = await getMissionHistory(); setMissionHistory(data); } finally { setHistoryLoading(false); } };
  const fetchInbox = async () => { setVaultLoading(true); try { const data = await getTopLeads(); setInboxLeads(data); } finally { setVaultLoading(false); } };
  const fetchActiveProjects = async () => { setActiveLoading(true); try { const data = await getActiveProjects(); setActiveProjects(data); } finally { setActiveLoading(false); } };
  const fetchArchive = async () => { setArchiveLoadingView(true); try { const data = await getArchivedLeads(); setArchivedLeads(data); } finally { setArchiveLoadingView(false); } };

  const handleLaunchMission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeProjectData({ ...params, rfpMode });
      setResults(data);
      if (data.leads.length > 0) setSelectedLeadId(data.leads[0].leadId);
      setActiveTab('intelligence');
    } catch (err) {
      setError("Intelligence Hub Alert: Connection Interrupted.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };
  const handleSelectKey = () => alert("API Configuration strictly managed via Environment Variables.");

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-emerald-400"><Loader2 className="animate-spin" /></div>;
  if (!session) return <LoginPage />;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-4 md:px-6 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('SEARCH')}>
            <div className="bg-emerald-500 text-slate-900 p-2 rounded-lg"><Presentation size={18} /></div>
            <div>
              <h1 className="font-black text-sm md:text-base text-white uppercase italic">District Scout</h1>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">v7.3 WORKFLOW</p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'SEARCH', icon: Search, label: 'SEARCH' },
              { id: 'TOP_LEADS', icon: Save, label: 'LEADS' },
              { id: 'ACTIVE_PROJECTS', icon: Zap, label: 'PROJECTS' },
              { id: 'ARCHIVE', icon: Archive, label: 'VAULT' }
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${activeView === item.id ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
                <item.icon size={12} /> <span className="hidden xs:inline">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
             <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8">
        {activeView === 'SEARCH' && activeTab === 'mission' && (
          <div className="max-w-2xl mx-auto py-6 md:py-12 space-y-8 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase">Identify Strategic Opportunities.</h2>
              <p className="text-slate-400 text-sm md:text-lg px-4">Strategic identification through high-fidelity market mapping.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-6 md:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div