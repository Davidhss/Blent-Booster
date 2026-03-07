import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Lightbulb,
    Zap,
    Target,
    ArrowRight,
    Loader2,
    Copy,
    Save,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    MessageSquarePlus,
    Rocket
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateContentStrategy, expandContentIdea } from '../services/gemini';
import { ContentIdea } from '../types';
import { toast } from 'sonner';
import { useTokenGate } from '../hooks/useTokenGate';
import { supabase } from '../lib/supabase';

interface ContentIdeasGeneratorProps {
    userEmail: string;
    onSave: (type: any, content: any) => void | Promise<void>;
}

const DARK_CARD = "bg-white dark:bg-[#14141e] border border-slate-200 dark:border-white/[0.06] rounded-2xl";
const DARK_INPUT = "w-full px-4 py-3 bg-slate-100 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] rounded-xl text-slate-700 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium resize-none text-left";
const LABEL = "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block text-left";

export const ContentIdeasGenerator: React.FC<ContentIdeasGeneratorProps> = ({ userEmail, onSave }) => {
    const { canAfford, costLabel, isBlocked, deductTokens, TOKEN_COSTS } = useTokenGate();
    const strategyCost = TOKEN_COSTS.generateInsights;
    const expandCost = TOKEN_COSTS.optimizeIdea;

    const [productInfo, setProductInfo] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [ideas, setIdeas] = useState<ContentIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
    const [isExpanding, setIsExpanding] = useState(false);
    const [userInstructions, setUserInstructions] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('saved_audience, saved_product')
                .eq('email', userEmail)
                .single();

            if (data) {
                if (data.saved_audience) setTargetAudience(data.saved_audience);
                if (data.saved_product) setProductInfo(data.saved_product);
            }
        };
        fetchProfile();
    }, [userEmail]);

    const handleGenerate = async () => {
        if (!targetAudience) {
            toast.error('Preencha os dados do público.');
            return;
        }
        if (!(await deductTokens('generateInsights'))) return;

        setIsGenerating(true);
        setIdeas([]);
        setSelectedIdea(null);

        const result = await generateContentStrategy(productInfo, targetAudience);
        if (result && result.ideas) {
            setIdeas(result.ideas);
            toast.success('5 Ideias geradas com sucesso!');
        } else {
            toast.error('Erro ao gerar ideias.');
        }
        setIsGenerating(false);
    };

    const handleExpand = async (idea: ContentIdea) => {
        if (!targetAudience) return;
        if (!(await deductTokens('optimizeIdea'))) return;

        setIsExpanding(true);
        const result = await expandContentIdea(
            idea.title,
            idea.description,
            productInfo,
            targetAudience,
            userInstructions
        );

        if (result) {
            const updatedIdea = { ...idea, expanded: result };
            setSelectedIdea(updatedIdea);
            setIdeas(prev => prev.map(i => i.id === idea.id ? updatedIdea : i));
            toast.success('Roteiro de funil gerado!');
        } else {
            toast.error('Erro ao expandir ideia.');
        }
        setIsExpanding(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado para a área de transferência!');
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8">
            <header className="mb-10 text-left">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-violet-500/15 border border-violet-500/20 rounded-xl">
                        <Lightbulb className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Gerador de Ideias Magnéticas</h1>
                        <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Crie 5 ideias de conteúdos baseadas em funil de conversão</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col: Setup & List */}
                <div className="lg:col-span-5 space-y-6">
                    <div className={cn(DARK_CARD, "p-6 space-y-5")}>

                        <div>
                            <label className={LABEL}>Seu Produto ou Oferta Principal</label>
                            <textarea
                                value={productInfo}
                                onChange={(e) => setProductInfo(e.target.value)}
                                placeholder="Ex: Mentoria de Escala para Freelancers..."
                                className={DARK_INPUT}
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className={LABEL}>Para quem você vende? (Público-Alvo)</label>
                            <textarea
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                placeholder="Descreva seu público..."
                                className={DARK_INPUT}
                                rows={3}
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || isBlocked || !productInfo || !targetAudience}
                            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-violet-500/20"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                            <span>{isGenerating ? 'Mapeando Estratégia...' : 'Gerar 5 Ideias de Conteúdo'}</span>
                            {!isGenerating && (
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 border border-white/20 rounded-md px-1.5 py-0.5">
                                    {costLabel('generateInsights')}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Ideas List */}
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {ideas.map((idea, index) => (
                                <motion.button
                                    key={idea.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => setSelectedIdea(idea)}
                                    className={cn(
                                        "w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden",
                                        selectedIdea?.id === idea.id
                                            ? "bg-violet-600 border-violet-500 shadow-xl shadow-violet-500/20"
                                            : "bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:border-violet-500/50"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center font-black italic",
                                            selectedIdea?.id === idea.id ? "bg-white text-violet-600" : "bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-violet-400"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                                                    selectedIdea?.id === idea.id ? "bg-white/20 text-white" : "bg-violet-500/10 text-violet-400"
                                                )}>
                                                    {String(idea.purpose || '')}
                                                </span>
                                            </div>
                                            <h4 className={cn(
                                                "text-sm font-bold leading-tight",
                                                selectedIdea?.id === idea.id ? "text-white" : "text-slate-900 dark:text-white"
                                            )}>
                                                {String(idea.title || '')}
                                            </h4>
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-4 h-4 transition-transform",
                                            selectedIdea?.id === idea.id ? "text-white translate-x-1" : "text-slate-400 group-hover:translate-x-1"
                                        )} />
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Col: Details & Expansion */}
                <div className="lg:col-span-7 text-left">
                    <AnimatePresence mode="wait">
                        {selectedIdea ? (
                            <motion.div
                                key={selectedIdea.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={cn(DARK_CARD, "overflow-hidden flex flex-col min-h-[500px]")}
                            >
                                {/* Header-like actions */}
                                <div className="p-6 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="p-2 bg-violet-500/20 rounded-lg shrink-0">
                                            <Sparkles className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase italic tracking-tight">{selectedIdea.title}</h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">{String(selectedIdea.purpose || '')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onSave('content-strategy', selectedIdea)}
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Salvar na Biblioteca
                                    </button>
                                </div>

                                <div className="p-6 flex-1 space-y-6">
                                    {/* Base Concept */}
                                    <div className="p-4 bg-slate-100 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/[0.05]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-3.5 h-3.5 text-blue-400" />
                                            <span className={LABEL + " mb-0"}>Conceito da Ideia</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-white/60 leading-relaxed italic">
                                            "{selectedIdea.description}"
                                        </p>
                                    </div>

                                    {/* Expansion Form */}
                                    {!selectedIdea.expanded && (
                                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                                            <div>
                                                <label className={LABEL}>Instruções Adicionais (Opcional)</label>
                                                <textarea
                                                    value={userInstructions}
                                                    onChange={(e) => setUserInstructions(e.target.value)}
                                                    placeholder="Ex: Use um tom mais ousado, cite tal referência, adicione um CTA para o link da bio..."
                                                    className={DARK_INPUT}
                                                    rows={2}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleExpand(selectedIdea)}
                                                disabled={isExpanding || !productInfo || !targetAudience || isBlocked}
                                                className="w-full py-4 bg-white dark:bg-white/5 border border-violet-500/30 hover:border-violet-500 text-violet-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                                            >
                                                {isExpanding ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquarePlus className="w-5 h-5" />}
                                                <span>{isExpanding ? 'Criando Roteiro de Funil...' : 'Desenvolver em um Roteiro Completo'}</span>
                                                {!isExpanding && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 border border-violet-500/20 rounded-md px-1.5 py-0.5">
                                                        {costLabel('optimizeIdea')}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Expanded Content */}
                                    {selectedIdea.expanded && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* Funnel Steps */}
                                            <div className="grid grid-cols-1 gap-4">
                                                {[
                                                    { title: 'Topo do Funil (Atração)', text: selectedIdea.expanded.hook, icon: Rocket, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                                    { title: 'Meio do Funil (Desenvolvimento)', text: selectedIdea.expanded.content, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                                                    { title: 'Fundo do Funil (Conversão)', text: selectedIdea.expanded.cta, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                                                ].map((step) => (
                                                    <div key={step.title} className="p-5 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.01] hover:border-violet-500/20 transition-all text-left">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={cn("p-1.5 rounded-lg", step.bg)}>
                                                                    <step.icon className={cn("w-3.5 h-3.5", step.color)} />
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white/80">{step.title}</span>
                                                            </div>
                                                            <button onClick={() => copyToClipboard(step.text)} className="p-2 text-slate-400 hover:text-violet-400 transition-colors">
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm font-medium text-slate-600 dark:text-white/60 leading-relaxed whitespace-pre-wrap">
                                                            {typeof step.text === 'string' ? step.text : JSON.stringify(step.text)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Visual Notes */}
                                            <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    <span className={LABEL + " mb-0"}>Sugestões de Gravação/Edição</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-500 dark:text-white/40 leading-relaxed italic bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                                                    {typeof selectedIdea.expanded.visualNotes === 'string' ? selectedIdea.expanded.visualNotes : JSON.stringify(selectedIdea.expanded.visualNotes)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 dark:border-white/[0.05] rounded-2xl flex flex-col items-center justify-center text-slate-400 dark:text-white/20 p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                                    <Lightbulb className="w-8 h-8 opacity-20" />
                                </div>
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest leading-relaxed">
                                        Selecione uma ideia para<br />visualizar os detalhes
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 dark:text-white/30 mt-2">
                                        Gere o roteiro completo no funil de vendas<br />clicando em "Desenvolver"
                                    </p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
