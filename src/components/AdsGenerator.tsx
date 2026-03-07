import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Video,
  Zap,
  ShieldAlert,
  Heart,
  Trophy,
  HelpCircle,
  Loader2,
  Copy,
  Save,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateAdScript } from '../services/gemini';
import { AdScript } from '../types';
import { toast } from 'sonner';
import { useTokenGate } from '../hooks/useTokenGate';

interface AdsGeneratorProps {
  userEmail: string;
  initialData?: AdScript | null;
  onSave: (type: 'ad-script', content: any) => void;
}

const TONE_OPTIONS = [
  { id: 'pain', name: 'Dor', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { id: 'fear', name: 'Medo', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { id: 'desire', name: 'Desejo', icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'difficulty', name: 'Dificuldade', icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
];

const DARK_CARD = "bg-white dark:bg-[#14141e] border border-slate-200 dark:border-white/[0.06] rounded-2xl";
const DARK_INPUT = "w-full px-4 py-3 bg-slate-100 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-700 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium resize-none";
const LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block";

export const AdsGenerator: React.FC<AdsGeneratorProps> = ({ userEmail, initialData, onSave }) => {
  const { canAfford, costLabel, isBlocked, deductTokens, TOKEN_COSTS } = useTokenGate();
  const adCost = TOKEN_COSTS.generateAd;
  const [productInfo, setProductInfo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'pain' | 'fear' | 'desire' | 'difficulty'>('pain');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<Partial<AdScript> | null>(initialData || null);

  React.useEffect(() => {
    if (initialData) {
      setGeneratedScript(initialData);
      setTone(initialData.tone || 'pain');
      // Podem não existir se a lib não salva esses inputs, mas se quisermos, podemos extrair.
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!targetAudience) return;
    if (!(await deductTokens('generateAd'))) return;
    setIsGenerating(true);
    const result = await generateAdScript(productInfo, targetAudience, tone);
    if (result) {
      setGeneratedScript({ ...result, tone, title: `Script: ${targetAudience.substring(0, 20)}...` });
      toast.success('Roteiro gerado com sucesso!');
    } else {
      toast.error('Erro ao gerar roteiro.');
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-orange-500/15 border border-orange-500/20 rounded-xl">
            <Video className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Roteirista de Anúncios</h1>
            <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Scripts de alta conversão para Meta Ads</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className={cn(DARK_CARD, "p-6 space-y-5")}>

          <div>
            <label className={LABEL}>O que você vende?</label>
            <textarea
              value={productInfo}
              onChange={(e) => setProductInfo(e.target.value)}
              placeholder="Ex: Mentoria para Creators que desejam escalar seu faturamento através de infoprodutos..."
              className={DARK_INPUT}
              rows={3}
            />
          </div>

          <div>
            <label className={LABEL}>Para quem você vende?</label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex: Mães empreendedoras que têm pouco tempo e querem trabalhar de casa..."
              className={DARK_INPUT}
              rows={3}
            />
          </div>

          <div>
            <label className={LABEL}>Ângulo do Anúncio</label>
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTone(item.id as any)}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all flex flex-col items-center gap-2 text-center",
                    tone === item.id
                      ? cn(item.bg, "shadow-lg")
                      : "bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:bg-white/[0.05]"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", tone === item.id ? item.color : 'text-slate-400 dark:text-white/30')} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", tone === item.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-white/40')}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (isBlocked || !canAfford(adCost)) return;
              handleGenerate();
            }}
            disabled={isGenerating || !targetAudience || !productInfo || (!canAfford(adCost))}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-violet-500/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            <span>{isGenerating ? 'Gerando...' : 'Gerar Roteiro'}</span>
            {!isGenerating && (
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 border border-white/20 rounded-md px-1.5 py-0.5">
                {costLabel('generateAd')}
              </span>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div>
          {generatedScript ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(DARK_CARD, "overflow-hidden")}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-slate-100 dark:bg-white/[0.02]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60">Script Gerado</h3>
                <button
                  onClick={() => onSave('ad-script', generatedScript)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Salvar
                </button>
              </div>

              <div className="p-6 space-y-6">
                {[
                  { label: '1. Gancho (Hook)', key: 'hook', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                  { label: '2. Corpo (Body)', key: 'body', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
                  { label: '3. CTA', key: 'cta', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                ].map(({ label, key, color, bg }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", bg, color)}>{label}</span>
                      <button onClick={() => copyToClipboard((generatedScript as any)[key]!)} className="text-slate-400 dark:text-white/20 hover:text-slate-900 dark:text-white transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                      {(generatedScript as any)[key]}
                    </p>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Dicas de Otimização</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-white/40 leading-relaxed">{generatedScript.optimizationTips}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 dark:border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-white/20 p-8 text-center">
              <Video className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-bold uppercase tracking-widest">Preencha os dados ao lado<br />para gerar seu roteiro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
