import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2, Save, Copy, Library, PenTool } from "lucide-react";
import { generateStorytellingScript } from "../services/gemini";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { useTokenGate } from "../hooks/useTokenGate";

interface StorytellingGeneratorProps {
  initialData?: any;
  onSave: (type: "storytelling-script", content: any) => void;
}

const DARK_CARD = "bg-white dark:bg-[#14141e] border border-slate-200 dark:border-white/[0.06] rounded-2xl";
const DARK_INPUT = "w-full px-4 py-3 bg-slate-100 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-700 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium";
const LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block";

const SCRIPT_SECTIONS = [
  { key: 'hook', label: '1. Gancho (Hook)', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', tag: 'Primeiros 3 segundos' },
  { key: 'storyBody', label: '2. A História', color: 'text-slate-600 dark:text-white/60', bg: 'bg-slate-100 dark:bg-white/[0.05] border-slate-300 dark:border-white/[0.08]', tag: 'Desenvolvimento' },
  { key: 'lesson', label: '3. Lição / Resolução', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', tag: 'Conexão com objetivo' },
  { key: 'cta', label: '4. CTA', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', tag: 'Chamada para Ação' },
  { key: 'visualCues', label: 'Dicas Visuais', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', tag: 'Filmagem & B-roll' },
];

const renderStructuredContent = (content: any, key?: string): React.ReactNode => {
  if (!content) return null;

  if (Array.isArray(content)) {
    return (
      <ul className="list-disc list-inside space-y-2">
        {content.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {renderStructuredContent(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof content === 'object') {
    // Priority keys for specific formatting
    if (content.time || content.description) {
      return (
        <span className="flex gap-2">
          {content.time && <span className="font-black text-violet-500 shrink-0">[{content.time}]</span>}
          <span>{content.description}</span>
        </span>
      );
    }

    if (content.text || content.visual || content.audio) {
      return (
        <div className="space-y-1">
          {content.text && <p className="font-bold">{content.text}</p>}
          {content.visual && <p className="text-xs opacity-70"><span className="uppercase text-[9px] font-black mr-1">Visual:</span> {content.visual}</p>}
          {content.audio && <p className="text-xs opacity-70"><span className="uppercase text-[9px] font-black mr-1">Áudio:</span> {content.audio}</p>}
        </div>
      );
    }

    // Generic object rendering
    return (
      <div className="pl-2 border-l-2 border-slate-200 dark:border-white/10 space-y-1">
        {Object.entries(content).map(([k, v]) => (
          <div key={k} className="flex gap-2 text-[11px]">
            <span className="font-black uppercase opacity-40 shrink-0">{k}:</span>
            <span>{typeof v === 'object' ? renderStructuredContent(v) : String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  // String/Number rendering
  const text = String(content);
  return (key === 'hook' || key === 'cta') ? `"${text}"` : text;
};

export const StorytellingGenerator: React.FC<StorytellingGeneratorProps> = ({ initialData, onSave }) => {
  const { canAfford, costLabel, isBlocked, deductTokens, TOKEN_COSTS } = useTokenGate();
  const storyCost = TOKEN_COSTS.generateStorytelling;
  const [objective, setObjective] = useState("");
  const [story, setStory] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [cta, setCta] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<any>(initialData || null);

  React.useEffect(() => {
    if (initialData) {
      setGeneratedScript(initialData);
    }
  }, [initialData]);

  const handleGenerate = async () => {
    if (!objective || !story || !audience || !tone || !cta) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    if (!(await deductTokens(storyCost, 'Gerar Roteiro Storytelling'))) return;
    setIsGenerating(true);
    const result = await generateStorytellingScript(objective, story, audience, tone, cta, extraContext);
    if (result) {
      setGeneratedScript(result);
      toast.success("Roteiro gerado com sucesso!");
    } else {
      toast.error("Erro ao gerar roteiro.");
    }
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/20 rounded-xl">
            <Library className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Roteirista Storytelling</h1>
            <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Transforme histórias reais em roteiros que conectam e convertem</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className={cn(DARK_CARD, "p-6 space-y-5")}>
          <div>
            <label className={LABEL}>Objetivo do Vídeo <span className="text-violet-400">*</span></label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Vender mentoria, educar sobre X, entreter..."
              className={DARK_INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>A História <span className="text-violet-400">*</span></label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Conte o que aconteceu. Ex: Um dia eu estava quebrado e decidi..."
              className={cn(DARK_INPUT, "resize-none h-32")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Público-Alvo <span className="text-violet-400">*</span></label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: Empreendedores"
                className={DARK_INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Tom <span className="text-violet-400">*</span></label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Ex: Emocional, Direto"
                className={DARK_INPUT}
              />
            </div>
          </div>

          <div>
            <label className={LABEL}>CTA (Chamada para Ação) <span className="text-violet-400">*</span></label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="Ex: Siga para mais, comente 'EU QUERO'..."
              className={DARK_INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Contexto Adicional <span className="text-slate-400 dark:text-white/20">(opcional)</span></label>
            <input
              type="text"
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Ex: Máximo 60 segundos, tom mais descontraído..."
              className={DARK_INPUT}
            />
          </div>

          <button
            onClick={() => {
              if (isBlocked || !canAfford(storyCost)) return;
              handleGenerate();
            }}
            disabled={isGenerating || !objective || !story || !audience || !tone || !cta || !canAfford(storyCost)}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-violet-500/20"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Escrevendo Roteiro...</>
            ) : (
              <><PenTool className="w-5 h-5" /> Gerar Roteiro Storytelling
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 border border-white/20 rounded-md px-1.5 py-0.5">
                  {costLabel('generateStorytelling')}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div>
          {generatedScript ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(DARK_CARD, "overflow-hidden")}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-slate-100 dark:bg-white/[0.02]">
                <h2 className="text-sm font-black tracking-tight text-slate-800 dark:text-white/80">
                  {generatedScript.title || "Roteiro Gerado"}
                </h2>
                <button
                  onClick={() => onSave("storytelling-script", generatedScript)}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Save className="w-3 h-3" /> Salvar
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                {SCRIPT_SECTIONS.map(({ key, label, color, bg, tag }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", bg, color)}>{label}</span>
                        <span className="text-[9px] text-slate-400 dark:text-white/20 font-medium">{tag}</span>
                      </div>
                      <button onClick={() => copyToClipboard(generatedScript[key])} className="text-slate-400 dark:text-white/20 hover:text-slate-600 dark:text-white/60 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className={cn("text-sm font-medium text-slate-700 dark:text-white/70 leading-relaxed p-4 rounded-xl border whitespace-pre-wrap", bg)}>
                      {renderStructuredContent(generatedScript[key], key)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 dark:border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-white/20 p-8 text-center">
              <Library className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-bold uppercase tracking-widest">
                Preencha os dados e gere<br />seu roteiro de storytelling
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
