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
  
  // View State
  const [activeView, setActiveView] = useState<'SEARCH' | 'TOP_LEADS' | 'ACTIVE_PROJECTS' | 'HISTORY' | 'ARCHIVE'>('SEARCH');
  const [activeTab, setActiveTab] = useState<'mission' | 'intelligence'>('mission');
  
  // Data State
  const [results, setResults] = useState<TriageResults | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState<OperationalParameters>({
    sector: 'All Sectors',
    lane: 'All Lanes',
    budgetTier: 'All Tiers',
    customIntel: '',
    rfpMode: false
  });

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

  const handleLaunchMission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeProjectData({ ...params });
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-emerald-400"><Loader2 className="animate-spin" /></div>;
  if (!session) return <LoginPage />;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-4 md:px-6 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {setActiveView('SEARCH'); setActiveTab('mission');}}>
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
             <button onClick={handleSignOut} className="text-slate-500 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8">
        {activeView === 'SEARCH' && activeTab === 'mission' && (
          <div className="max-w-2xl mx-auto py-6 md:py-12 space-y-8 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase">Identify Strategic Opportunities.</h2>
              <p className="text-slate-400 text-sm md:text-lg px-4 leading-relaxed">Strategic identification through high-fidelity market mapping.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-6 md:p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Industry Focus</label>
                  <select value={params.sector} onChange={(e) => setParams({...params, sector: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500">
                    <option value="All Sectors">All Industries</option>
                    {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12}/> Tactical Context</label>
                  <input type="text" value={params.customIntel} onChange={(e) => setParams({...params, customIntel: e.target.value})} placeholder="Keywords..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>
              <button onClick={handleLaunchMission} disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} 
                <span className="text-xs uppercase">{isLoading ? "EXECUTING..." : "FIND OPPORTUNITIES"}</span>
              </button>
            </div>
          </div>
        )}

        {activeView === 'SEARCH' && activeTab === 'intelligence' && results && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {results.leads.map(lead => (
                <div key={lead.leadId} className="bg-slate-900 border border-slate-800 p-6 rounded-[1.5rem] space-y-4 hover:border-emerald-500/50 transition-all group">
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{lead.targetName}</h3>
                  <LaneBadge lane={lead.lane} />
                  <p className="text-xs text-slate-400 line-clamp-3 italic">"{lead.diagnosticLogic}"</p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                     <span className="text-[10px] font-black text-emerald-400 tracking-widest">{lead.projectValue}</span>
                     <button onClick={() => setSelectedLeadId(lead.leadId)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">Details <ArrowRight size={10} className="inline ml-1" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
               <button onClick={() => setActiveTab('mission')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white border-b border-transparent hover:border-slate-500 transition-all pb-1">← New Search</button>
            </div>
          </div>
        )}

        {activeView !== 'SEARCH' && (
           <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
             <Database size={40} className="text-slate-700" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Database synchronization in progress...</p>
           </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-8 mt-auto text-center">
        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">&copy; 2026 District Analyst LLC // Integrity v7.3</p>
      </footer>
    </div>
  );
};

export default App;