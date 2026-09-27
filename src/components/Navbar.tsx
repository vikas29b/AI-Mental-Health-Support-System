import React from 'react';
import { 
  HeartHandshake, 
  Activity, 
  BarChart3, 
  ShieldAlert, 
  Terminal, 
  PhoneCall, 
  Lock
} from 'lucide-react';

export type AppView = 'chat' | 'inspector' | 'powerbi' | 'workbench' | 'api';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onOpenCrisisHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenCrisisHelp,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-md shadow-teal-500/20">
              <HeartHandshake className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  AegisMind
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Enterprise AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sub-Second Crisis Detection & BI Analytics Backend
              </p>
            </div>
          </div>

          {/* Nav Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setCurrentView('chat')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'chat'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Support Chat</span>
            </button>

            <button
              onClick={() => setCurrentView('inspector')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'inspector'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Pipeline Monitor</span>
            </button>

            <button
              onClick={() => setCurrentView('powerbi')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'powerbi'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Power BI Warehouse</span>
            </button>

            <button
              onClick={() => setCurrentView('workbench')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'workbench'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Crisis Workbench</span>
            </button>

            <button
              onClick={() => setCurrentView('api')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentView === 'api'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>FastAPI Docs</span>
            </button>
          </nav>

          {/* Emergency Crisis Hotline Quick-Trigger Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-700/40">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>PII Scrubbing Active</span>
            </div>

            <button
              onClick={onOpenCrisisHelp}
              className="flex items-center space-x-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm shadow-rose-600/20 active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
              <span>Crisis Helpline 988</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setCurrentView('chat')}
            className={`px-2 py-1 rounded ${currentView === 'chat' ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setCurrentView('inspector')}
            className={`px-2 py-1 rounded ${currentView === 'inspector' ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setCurrentView('powerbi')}
            className={`px-2 py-1 rounded ${currentView === 'powerbi' ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
          >
            Power BI
          </button>
          <button
            onClick={() => setCurrentView('workbench')}
            className={`px-2 py-1 rounded ${currentView === 'workbench' ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
          >
            Workbench
          </button>
          <button
            onClick={() => setCurrentView('api')}
            className={`px-2 py-1 rounded ${currentView === 'api' ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
          >
            API
          </button>
        </div>
      </div>
    </header>
  );
};
