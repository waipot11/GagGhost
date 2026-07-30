import React from 'react';
import { Film, Zap, DollarSign, Vote, Sparkles, Coins, Flame } from 'lucide-react';

interface Props {
  activeTab: 'feed' | 'studio' | 'monetize' | 'vote';
  setActiveTab: (tab: 'feed' | 'studio' | 'monetize' | 'vote') => void;
  coins: number;
  isAutoPilotActive: boolean;
}

export const HeaderNavbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  coins,
  isAutoPilotActive,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-emerald-900/40 text-slate-100 px-3 sm:px-6 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Status */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div
            onClick={() => setActiveTab('feed')}
            className="cursor-pointer flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-0.5 shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xl">
                👻
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">
                  GagGhost AI
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                  v2.5 AUTO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                หนังสั้นสยองขวัญหักมุมตลก 100% Automation & Streaming
              </p>
            </div>
          </div>

          {/* Mobile Coins & Auto Status */}
          <div className="flex items-center gap-2 md:hidden">
            {isAutoPilotActive && (
              <span className="flex items-center gap-1 text-[11px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-700 animate-pulse">
                <Flame className="w-3 h-3 text-emerald-400" /> Auto-Pilot
              </span>
            )}
            <div className="flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-700/50 px-2.5 py-1 rounded-full text-xs font-semibold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{coins}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto justify-center">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Film className="w-4 h-4 text-emerald-300" />
            <span>📺 สตรีมมิ่ง Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
              activeTab === 'studio'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>⚡ สตูดิโอ Auto-Pipeline</span>
            {isAutoPilotActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('vote')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'vote'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Vote className="w-4 h-4 text-purple-400" />
            <span>🗳️ โหวตจุดหักมุม</span>
          </button>

          <button
            onClick={() => setActiveTab('monetize')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'monetize'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>💰 ศูนย์สร้างรายได้</span>
          </button>
        </nav>

        {/* Desktop Coins & Quick Auto Status */}
        <div className="hidden md:flex items-center gap-3">
          {isAutoPilotActive ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/90 text-emerald-400 border border-emerald-600/80 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
              <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>24/7 Auto-Pilot บอทกำลังทำงาน</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-900 text-slate-400 border border-slate-800 px-3 py-1 rounded-full text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>พร้อมสั่งปั๊มคลิป</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-amber-950/90 text-amber-300 border border-amber-600/60 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-amber-950/30">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coins} คอยน์</span>
          </div>
        </div>
      </div>
    </header>
  );
};
