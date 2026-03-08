import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Target,
  Video,
  User,
  Library,
  ShieldAlert,
  Zap,
  Home,
  LogOut,
  Settings,
  Lightbulb,
  Bug,
  Coins,
  CalendarDays,
  Rocket,
  LayoutGrid,
  MessageSquare,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ToolType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TokenWidget } from './TokenWidget';
import { APP_VERSION } from '../config/appVersion';


interface SidebarProps {
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;
  userProfile?: any;
  onOpenBugReport?: () => void;
}

const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Início', color: 'text-zinc-400', activeColor: 'bg-zinc-500' },
  { id: 'remix', icon: Sparkles, label: 'Blent Boost', color: 'text-violet-400', activeColor: 'bg-violet-500' },
  { id: 'insights', icon: Target, label: 'Audience Insights', color: 'text-blue-400', activeColor: 'bg-blue-500' },
  { id: 'strategy', icon: Rocket, label: 'Gerador de Ideias', color: 'text-violet-400', activeColor: 'bg-violet-500' },
  { id: 'ads', icon: Video, label: 'Roteirista de Anúncios', color: 'text-orange-400', activeColor: 'bg-orange-500' },
  { id: 'storytelling', icon: BookOpen, label: 'Roteirista Storytelling', color: 'text-emerald-400', activeColor: 'bg-emerald-500' },
  { id: 'ideas', icon: Lightbulb, label: 'Banco de Ideias', color: 'text-yellow-400', activeColor: 'bg-yellow-500' },
  { id: 'planner', icon: CalendarDays, label: 'Planner (Beta)', color: 'text-indigo-400', activeColor: 'bg-indigo-500' },
  { id: 'library', icon: Library, label: 'Meu Acervo', color: 'text-pink-400', activeColor: 'bg-pink-500' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTool, setCurrentTool, userProfile, onOpenBugReport }) => {
  const { isAdmin, isSimulatingUser, isActualAdmin, toggleSimulationMode, signOut } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className="fixed bottom-0 left-0 right-0 h-16 md:h-screen md:sticky md:top-0 md:w-[72px] bg-[#0d0d12] border-t md:border-t-0 md:border-r border-white/[0.06] flex flex-row md:flex-col items-center justify-between md:justify-start px-2 md:px-0 py-2 md:py-6 gap-2 md:gap-4 z-50 shrink-0">
      {/* Logo */}
      <div className="hidden md:flex w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
        <Zap className="w-5 h-5 text-white" />
      </div>

      {/* Divider */}
      <div className="hidden md:block w-8 h-px bg-white/[0.06]" />

      <nav className="flex flex-row md:flex-col gap-1 md:gap-2 flex-1 md:w-full md:px-3 overflow-x-auto md:overflow-x-visible overflow-y-hidden md:overflow-y-auto custom-scrollbar items-center">
        {NAV_ITEMS.filter(item => {
          // Admin sees everything
          if (isAdmin) return true;

          // In Blent mode, only show specific tools
          if (APP_VERSION === 'Blent') {
            return ['home', 'library', 'remix', 'planner', 'ideas'].includes(item.id);
          }

          // Basic/Default items everyone sees in Boost mode
          if (['home', 'library', 'remix', 'strategy'].includes(item.id)) return true;

          // Mapping menu IDs to feature flags
          const featureMapping: Record<string, string> = {
            'insights': 'audience_insights',
            'ads': 'ad_generator',
            'storytelling': 'storytelling',
            'ideas': 'idea_bank',
            'planner': 'planner'
          };

          const requiredFeature = featureMapping[item.id];
          if (requiredFeature) {
            return (userProfile?.features || []).includes(requiredFeature);
          }

          return true;
        }).map((item) => {
          const isActive = currentTool === item.id;

          let displayLabel = item.label;
          if (item.id === 'remix' && APP_VERSION === 'Blent') {
            displayLabel = 'Blent';
          } else if (item.id === 'remix' && !isAdmin && APP_VERSION === 'boost') {
            // Keep it as Blent Boost for users in boost mode
          }

          return (
            <button
              key={item.id}
              id={`sidebar-${item.id}`}
              onClick={() => setCurrentTool(item.id as ToolType)}
              className={cn(
                "relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all duration-200 group flex items-center justify-center shrink-0 md:mx-auto",
                isActive
                  ? "bg-white/10 shadow-inner"
                  : "text-white/30 hover:bg-white/5 hover:text-white/70"
              )}
            >
              {isActive && (
                <span className={cn("absolute bottom-0 md:bottom-auto md:left-0 md:top-1/2 md:-translate-y-1/2 w-4 md:w-0.5 h-0.5 md:h-6 rounded-full", item.activeColor)} />
              )}
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? item.color : '')} />
              {/* Tooltip */}
              <span className="hidden md:block absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a24] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10 shadow-xl">
                {displayLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="md:mt-auto flex flex-row md:flex-col items-center gap-1 md:gap-3 md:w-full md:px-3 relative shrink-0" ref={menuRef}>
        {/* Token Widget */}
        <div className="hidden md:block">
          {(isAdmin || APP_VERSION === 'boost') && <TokenWidget onClick={() => setCurrentTool('tokens')} />}
        </div>

        {/* Tokens / Loja */}
        {(isAdmin || APP_VERSION === 'boost') && (
          <button
            onClick={() => setCurrentTool('tokens')}
            className={cn(
              "relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all duration-200 group flex items-center justify-center md:mx-auto",
              currentTool === 'tokens'
                ? "bg-white/10"
                : "text-white/30 hover:bg-white/5 hover:text-white/70"
            )}
          >
            {currentTool === 'tokens' && (
              <span className="absolute bottom-0 md:bottom-auto md:left-0 md:top-1/2 md:-translate-y-1/2 w-4 md:w-0.5 h-0.5 md:h-6 bg-violet-500 rounded-full" />
            )}
            <Coins className={cn("w-5 h-5", currentTool === 'tokens' ? 'text-violet-400' : '')} />
            <span className="hidden md:block absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a24] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] border border-white/10">
              Tokens & Plano
            </span>
          </button>
        )}

        {isActualAdmin && (
          <button
            onClick={toggleSimulationMode}
            className={cn(
              "hidden relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all duration-200 group md:flex items-center justify-center md:mx-auto md:mt-2",
              isSimulatingUser
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-white/30 hover:bg-white/5 hover:text-white/70"
            )}
          >
            {isSimulatingUser ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            <span className="hidden md:block absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a24] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] border border-white/10">
              {isSimulatingUser ? 'Sair do Modo Usuário' : 'Visualizar como Usuário'}
            </span>
          </button>
        )}

        {isActualAdmin && (
          <button
            onClick={() => setCurrentTool('admin')}
            className={cn(
              "hidden relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all duration-200 group md:flex items-center justify-center md:mx-auto",
              currentTool === 'admin'
                ? "bg-white/10"
                : "text-white/30 hover:bg-white/5 hover:text-white/70"
            )}
          >
            {currentTool === 'admin' && (
              <span className="absolute bottom-0 md:bottom-auto md:left-0 md:top-1/2 md:-translate-y-1/2 w-4 md:w-0.5 h-0.5 md:h-6 bg-red-500 rounded-full" />
            )}
            <ShieldAlert className={cn("w-5 h-5", currentTool === 'admin' ? 'text-red-400' : '')} />
            <span className="hidden md:block absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a24] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] border border-white/10">
              Admin
            </span>
          </button>
        )}



        {/* Bug Report Toggle */}
        <button
          onClick={() => onOpenBugReport && onOpenBugReport()}
          className="hidden relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all duration-200 group md:flex items-center justify-center md:mx-auto text-white/30 hover:bg-white/5 hover:text-orange-400"
        >
          <Bug className="w-5 h-5 transition-colors" />
          <span className="hidden md:block absolute left-full ml-4 px-3 py-1.5 bg-[#1a1a24] text-white text-[11px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[60] border border-white/10 shadow-xl">
            Reportar Bug
          </span>
        </button>

        {/* Profile Dropdown Toggle */}
        <button
          id="sidebar-profile"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className={cn(
            "relative w-8 h-8 md:w-12 md:h-12 rounded-full transition-all duration-200 md:mx-auto p-[1px] md:p-0.5 border-2",
            showProfileMenu || currentTool === 'profile' ? "border-violet-500" : "border-transparent hover:border-white/20"
          )}
        >
          <img
            src={userProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${userProfile?.name || 'User'}&background=8b5cf6&color=fff`}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        </button>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute right-0 bottom-full mb-4 md:mb-0 md:left-full md:bottom-0 ml-4 w-48 bg-[#14141e] border border-white/[0.08] rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="px-3 py-2 border-b border-white/[0.06] mb-2">
              <p className="text-sm font-bold text-white truncate">{userProfile?.name || 'Usuário'}</p>
              <p className="text-[10px] text-white/40 truncate">@{userProfile?.handle || 'username'}</p>
            </div>

            <button
              onClick={() => {
                setCurrentTool('profile');
                setShowProfileMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors text-xs font-bold"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        )}
      </div>
    </aside >
  );
};
