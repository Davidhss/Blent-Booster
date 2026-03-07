import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Loader2,
  Save,
  Zap,
  ChevronDown,
  FileImage,
  FileText,
  Image
} from 'lucide-react';
import { ExportFormat } from '../types';
import { cn } from '../lib/utils';
import { APP_VERSION } from '../config/appVersion';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  isGeneratingCaption: boolean;
  isExporting: boolean;
  onGenerateCaption: () => void;
  onDownload: (format: ExportFormat) => void;
  onSave?: () => void;
  exportFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { value: 'png', label: 'PNG', icon: <Image className="w-3.5 h-3.5" /> },
  { value: 'jpeg', label: 'JPEG', icon: <FileImage className="w-3.5 h-3.5" /> },
  { value: 'pdf', label: 'PDF', icon: <FileText className="w-3.5 h-3.5" /> },
];

export const Header: React.FC<HeaderProps> = ({
  isGeneratingCaption,
  isExporting,
  onGenerateCaption,
  onDownload,
  onSave,
  exportFormat,
  onFormatChange,
}) => {
  const { isAdmin } = useAuth();
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFormatMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFormat = FORMAT_OPTIONS.find(f => f.value === exportFormat) || FORMAT_OPTIONS[0];

  return (
    <header className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d0d12]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap className="text-slate-900 dark:text-white w-4 h-4" />
          </div>
          <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
            Blent{(isAdmin || APP_VERSION === 'boost') && <span className="text-violet-400">Boost</span>}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {(isAdmin || APP_VERSION === 'boost') && (
            <button
              onClick={onGenerateCaption}
              disabled={isGeneratingCaption}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-all text-sm font-semibold text-slate-700 dark:text-white/70 hover:text-slate-900 dark:text-white disabled:opacity-40"
            >
              {isGeneratingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-400" />}
              Gerar Legenda
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-all text-sm font-semibold text-slate-700 dark:text-white/70 hover:text-slate-900 dark:text-white"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              Salvar
            </button>
          )}

          {/* Export button with format dropdown */}
          <div className="relative flex items-center" ref={menuRef}>
            {/* Format selector */}
            <button
              onClick={() => setShowFormatMenu(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-l-xl bg-violet-700 hover:bg-violet-600 text-slate-900 dark:text-white text-xs font-bold transition-all border-r border-violet-900"
              title="Escolher formato de exportação"
            >
              {currentFormat.icon}
              {currentFormat.label}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showFormatMenu && "rotate-180")} />
            </button>

            {/* Export action */}
            <button
              onClick={() => onDownload(exportFormat)}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-r-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-slate-900 dark:text-white text-sm font-bold transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar
            </button>

            {/* Format dropdown */}
            {showFormatMenu && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-[#14141e] border border-slate-300 dark:border-white/[0.08] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {FORMAT_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => { onFormatChange(f.value); setShowFormatMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                      exportFormat === f.value
                        ? "bg-violet-600 text-slate-900 dark:text-white"
                        : "text-slate-500 dark:text-white/50 hover:bg-slate-100 dark:bg-white/5 hover:text-slate-900 dark:text-white"
                    )}
                  >
                    {f.icon}
                    <span>{f.label}</span>
                    {f.value === 'png' && <span className="ml-auto text-[9px] opacity-50 uppercase">Padrão</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
