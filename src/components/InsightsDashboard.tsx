import React from 'react';
import { motion } from 'motion/react';
import {
  Brain,
  ShieldAlert,
  HelpCircle,
  Heart,
  Trophy,
  Flag,
  Copy,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Insight {
  question: string;
  category: string;
  strategy: string;
  hook: string;
}

interface InsightsDashboardProps {
  insights: Insight[];
  onCopyHook: (hook: string) => void;
}

const CATEGORY_CONFIG: Record<string, { icon: React.FC<any>, color: string, bg: string }> = {
  'Objeção Oculta': { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  'Dúvida Técnica': { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'Desabafo Emocional': { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  'Desejo Aspiracional': { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  'Mito/Crença': { icon: Flag, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
};

const CategoryIcon = ({ category }: { category: string }) => {
  const config = CATEGORY_CONFIG[category];
  if (!config) return <Brain className="w-4 h-4 text-violet-400" />;
  const Icon = config.icon;
  return <Icon className={cn("w-4 h-4", config.color)} />;
};

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ insights, onCopyHook }) => {
  if (insights.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-5">
        <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center animate-pulse">
          <Brain className="w-8 h-8 text-violet-400/50" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-600 dark:text-white/60">Aguardando sua entrada</h3>
          <p className="text-slate-400 dark:text-white/25 text-sm max-w-xs mx-auto leading-relaxed">
            Preencha os dados ao lado para mapearmos a psicologia do seu público.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, i) => {
        const config = CATEGORY_CONFIG[insight.category] || { color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' };
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200 dark:border-white/[0.07] overflow-hidden group hover:border-white/[0.12] transition-all"
          >
            <div className="p-5 space-y-4">
              {/* Category + Question */}
              <div className="space-y-2">
                <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest", config.bg, config.color)}>
                  <CategoryIcon category={insight.category} />
                  {insight.category}
                </div>
                <h4 className="text-sm font-bold leading-snug text-slate-700 dark:text-white/90 group-hover:text-slate-900 dark:text-white transition-colors">
                  "{insight.question}"
                </h4>
              </div>

              {/* Strategy + Hook */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.06]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                    <Zap className="w-3 h-3" />
                    Estratégia
                  </div>
                  <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">{insight.strategy}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                    <ArrowRight className="w-3 h-3" />
                    Hook
                  </div>
                  <button
                    onClick={() => onCopyHook(insight.hook)}
                    className="w-full text-left p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs font-bold text-violet-300 group/hook hover:bg-violet-500/20 transition-all flex items-start justify-between gap-2"
                  >
                    <span className="line-clamp-3">"{insight.hook}"</span>
                    <Copy className="w-3 h-3 opacity-0 group-hover/hook:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
