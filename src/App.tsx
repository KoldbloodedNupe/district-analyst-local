// ... [Keep all imports same as before]

const App: React.FC = () => {
  // ... [Keep all state and logic same as before]

  // RENDER UPDATES START HERE
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* HEADER: Added flex-col on mobile, flex-row on desktop */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-4 md:px-6 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('SEARCH')}>
            <div className="bg-emerald-500 text-slate-900 p-2 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Presentation size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm md:text-base tracking-tight text-white uppercase italic">District Scout</h1>
                <span className="hidden xs:inline text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">v7.3</span>
              </div>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Strategic Intelligence</p>
            </div>
          </div>

          {/* NAV: Added flex-wrap for small screens */}
          <div className="flex items-center gap-2 md:gap-6 w-full sm:w-auto justify-center">
            <nav className="flex flex-wrap justify-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'SEARCH', icon: Search, label: 'SEARCH' },
                { id: 'TOP_LEADS', icon: Save, label: 'LEADS' },
                { id: 'ACTIVE_PROJECTS', icon: Zap, label: 'PROJECTS' },
                { id: 'ARCHIVE', icon: Archive, label: 'VAULT' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)} 
                  className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all text-[9px] font-black uppercase tracking-widest ${activeView === item.id ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <item.icon size={12} /> <span className="hidden xs:inline">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 md:pl-6">
              <button onClick={handleSelectKey} className="p-2 text-slate-500 hover:text-emerald-400"><Key size={16} /></button>
              <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8">
        {activeView === 'SEARCH' && (
          <>
            {activeTab === 'mission' ? (
              <div className="max-w-2xl mx-auto py-6 md:py-12 space-y-8 md:space-y-12 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-4 md:space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-400/5 text-emerald-400 border border-emerald-400/10 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                    <TrendingUp size={12} /> Market Intelligence Protocol
                  </div>
                  {/* FONT SCALE: Reduced for mobile */}
                  <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none italic uppercase">Identify Strategic Opportunities.</h2>
                  <p className="text-slate-400 text-sm md:text-lg font-medium max-w-lg mx-auto leading-relaxed px-4">Strategic identification of organizational challenges through high-fidelity market mapping.</p>
                </div>
                
                {/* SEARCH FORM: Grid stacks on mobile */}
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 shadow-2xl space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12} /> Industry Focus</label>
                      <select value={params.sector} onChange={(e) => setParams({...params, sector: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs md:text-sm text-white font-bold outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="All Sectors">All Industries</option>
                        {Object.values(Sector).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {/* ... [Repeat similar logic for other selects: use text-xs on mobile] ... */}
                  </div>
                  
                  <button onClick={handleLaunchMission} disabled={isLoading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all">
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} 
                    <span className="text-xs md:text-sm uppercase">{isLoading ? "EXECUTING..." : "FIND OPPORTUNITIES"}</span>
                  </button>
                </div>
              </div>
            ) : (
              // RESULTS VIEW
              <div className="space-y-8 md:space-y-16 animate-in slide-in-from-bottom-6 duration-700">
                {/* STATS BAR: Stack vertically on mobile */}
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-between p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl">
                   {/* ... [Keep internal content but adjust spacing] ... */}
                </div>

                {/* LEAD CARDS: 1 col on mobile, 3 on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                   {/* ... [Mapping logic remains same, Lucide icons handle scaling] ... */}
                </div>
              </div>
            )}
          </>
        )}

        {/* ... [Other Views like TOP_LEADS follow same grid-cols-1 pattern] ... */}
        
        {/* HISTORY TABLE: Added horizontal scroll wrapper */}
        {activeView === 'HISTORY' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-white italic uppercase">Mission Logs</h2>
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-800">
              <table className="w-full text-left border-collapse min-w-[600px]">
                {/* ... [Table content remains same] ... */}
              </table>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER: Stacked on mobile */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-8 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3 opacity-40"><Presentation size={16} /><span className="text-[9px] font-black uppercase tracking-widest italic text-slate-500">District Scout</span></div>
          <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest">&copy; 2025 District Analyst LLC</div>
        </div>
      </footer>
    </div>
  );
}