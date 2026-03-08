import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Plus, Zap, Loader2, Trash2, X, Palette, Check, Maximize2, CheckCircle2, History, Clock, Save, AlertCircle, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { optimizeIdea } from '../services/gemini';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_VERSION } from '../config/appVersion';


interface Idea {
    id: number;
    created_at: string;
    content: {
        note: string;
        color?: string;
        title?: string;
        expansion?: string;
        facts?: string[];
        cta?: string;
        isCompleted?: boolean;
    };
}

const NOTE_COLORS = [
    { name: 'Amarelo', bg: 'bg-[#fef3c7]', text: 'text-amber-900', border: 'border-amber-200', dot: 'bg-amber-400' },
    { name: 'Azul', bg: 'bg-[#e0f2fe]', text: 'text-sky-900', border: 'border-sky-200', dot: 'bg-sky-400' },
    { name: 'Rosa', bg: 'bg-[#fce7f3]', text: 'text-pink-900', border: 'border-pink-200', dot: 'bg-pink-400' },
    { name: 'Verde', bg: 'bg-[#dcfce7]', text: 'text-emerald-900', border: 'border-emerald-200', dot: 'bg-emerald-400' },
    { name: 'Roxo', bg: 'bg-[#f3e8ff]', text: 'text-purple-900', border: 'border-purple-200', dot: 'bg-purple-400' },
];

const LOCAL_STORAGE_KEY = 'Blent_boost_idea_drafts';

export const IdeaBank: React.FC = () => {
    const { user, isAdmin, profile: userProfile, refreshProfile } = useAuth();
    const isBlentVersion = APP_VERSION === 'Blent';
    const canUseAI = isAdmin || (APP_VERSION === 'boost');

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [optimizingId, setOptimizingId] = useState<number | null>(null);
    const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduledTime, setScheduledTime] = useState('12:00');
    const [isSendingToPlanner, setIsSendingToPlanner] = useState(false);

    // Refs for synchronization and state tracking
    const selectedIdeaRef = useRef<Idea | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDirtyRef = useRef<boolean>(false);
    const latestDirtyContentRef = useRef<any>(null);

    // Sync ref with state
    useEffect(() => {
        selectedIdeaRef.current = selectedIdea;

        // When an idea is selected, check if there's a local backup that's newer/different
        if (selectedIdea) {
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            const localDraft = drafts[selectedIdea.id];
            if (localDraft && localDraft.note !== selectedIdea.content.note) {
                // Technically we could offer to restore, but for now let's just use it if it's there
                // as the user is complaining about data loss.
                // toast.info('Rascunho local recuperado.');
            }
        }
    }, [selectedIdea]);

    useEffect(() => {
        fetchIdeas();

        // Final sync attempt on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (isDirtyRef.current && selectedIdeaRef.current && latestDirtyContentRef.current) {
                syncUpdateToSupabaseQuietly(selectedIdeaRef.current.id, latestDirtyContentRef.current);
            }
        };
    }, [user]);

    const fetchIdeas = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('library')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'idea')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Merge with local drafts if they exist
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            const mergedData = (data || []).map((item: any) => {
                if (drafts[item.id]) {
                    // Restore ALL draft fields (title, note, expansion, facts, cta, color, etc.)
                    const { updatedAt: _ts, ...draftContent } = drafts[item.id];
                    return { ...item, content: { ...item.content, ...draftContent } };
                }
                return item;
            });

            setIdeas(mergedData as Idea[]);
        } catch (err) {
            console.error('Error fetching ideas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddIdea = async () => {
        if (!user) return;
        const newContent = { note: '', color: 'bg-[#fef3c7]', isCompleted: false };
        try {
            const { data, error } = await supabase
                .from('library')
                .insert([{ user_id: user.id, type: 'idea', content: newContent }])
                .select()
                .single();
            if (error) throw error;
            setIdeas([data as Idea, ...ideas]);
            setSelectedIdea(data as Idea);

            if (data) {
                // Profile will be updated via real-time subscription
            }
        } catch (err) {
            console.error('Error adding idea:', err);
            toast.error('Erro ao criar ideia.');
        }
    };

    const syncUpdateToSupabase = async (id: number, content: any) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('library')
                .update({ content })
                .eq('id', id);

            if (error) throw error;

            // On success, clear local backup for this ID
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            delete drafts[id];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

            isDirtyRef.current = false;
            toast.success('Alterações salvas com sucesso!');


        } catch (error) {
            console.error('Error syncing idea:', error);
            toast.error('Erro ao salvar no banco. O rascunho foi mantido localmente.');
        } finally {
            setTimeout(() => setIsSaving(false), 300);
        }
    };

    const syncUpdateToSupabaseQuietly = (id: number, content: any) => {
        setIsSaving(true);
        supabase
            .from('library')
            .update({ content })
            .eq('id', id)
            .then(({ error }) => {
                if (!error) {
                    const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                    delete drafts[id];
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));
                    isDirtyRef.current = false;
                }
                setIsSaving(false);
            });
    };

    const handleUpdateIdeaContent = (id: number, content: any, immediate = false) => {
        isDirtyRef.current = true;
        latestDirtyContentRef.current = content;

        // Update local state
        setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, content } : idea));
        if (selectedIdea?.id === id) {
            setSelectedIdea(prev => prev ? { ...prev, content } : null);
        }

        // Update LocalStorage Backup
        const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        // Save the FULL content object so all fields (title, expansion, facts, cta, color) are restored on navigate-back
        drafts[id] = { ...content, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

        if (immediate) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            syncUpdateToSupabase(id, content);
            return;
        }

        // Debounce sync
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            syncUpdateToSupabaseQuietly(id, content);
        }, 800);
    };

    const handleBlur = () => {
        if (isDirtyRef.current && selectedIdea && latestDirtyContentRef.current) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            syncUpdateToSupabaseQuietly(selectedIdea.id, latestDirtyContentRef.current);
        }
    };

    const handleManualSave = () => {
        if (selectedIdea) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            syncUpdateToSupabase(selectedIdea.id, selectedIdea.content);
        }
    };

    const handleDeleteIdea = async (id: number) => {
        try {
            const { error } = await supabase.from('library').delete().eq('id', id);
            if (error) throw error;
            setIdeas(ideas.filter(idea => idea.id !== id));

            // Clear draft
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            delete drafts[id];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

            if (selectedIdea?.id === id) setSelectedIdea(null);
            toast.success('Ideia removida.');
        } catch (error) {
            console.error('Error deleting idea:', error);
            toast.error('Erro ao deletar ideia.');
        }
    };

    const handleOptimizeIdea = async (idea: Idea) => {
        if (!canUseAI) {
            toast.error('Otimização com IA disponível apenas no Blent Boost.');
            return;
        }
        if (!idea.content.note) {
            toast.error('Escreva sua ideia antes de otimizar.');
            return;
        }
        setOptimizingId(idea.id);
        try {
            const result = await optimizeIdea(idea.content.note);
            if (result) {
                const newContent = {
                    ...idea.content,
                    title: result.title,
                    expansion: result.expansion,
                    facts: result.facts,
                    cta: result.cta
                };
                handleUpdateIdeaContent(idea.id, newContent, true);
                toast.success('Ideia otimizada e salva!');

                if (newContent) {
                    // Profile will be updated via real-time subscription in AuthContext
                }
            } else {
                toast.error('Não foi possível otimizar a ideia.');
            }
        } catch (error) {
            console.error('Error in optimization:', error);
        } finally {
            setOptimizingId(null);
        }
    };

    const getNoteStyle = (bgColor: string = 'bg-[#fef3c7]') => {
        return NOTE_COLORS.find(c => c.bg === bgColor) || NOTE_COLORS[0];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const activeIdeas = ideas.filter(i => !i.content.isCompleted);
    const completedIdeas = ideas.filter(i => i.content.isCompleted);
    const currentList = showCompleted ? completedIdeas : activeIdeas;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0d0d12] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <header className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d0d12]/60 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10">
                                <Lightbulb className="text-slate-900 dark:text-white w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                                    Meu Banco de <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Ideias</span>
                                </h1>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-2 h-2 animate-spin text-yellow-500" />
                                            Sincronizando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-2 h-2 text-emerald-500" />
                                            Nuvem Atualizada
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

                        <nav className="flex bg-slate-100 dark:bg-white/[0.03] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06]">
                            <button
                                onClick={() => setShowCompleted(false)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    !showCompleted ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30 hover:text-slate-500 dark:text-white/50"
                                )}
                            >
                                Ativas ({activeIdeas.length})
                            </button>
                            <button
                                onClick={() => setShowCompleted(true)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    showCompleted ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30 hover:text-slate-500 dark:text-white/50"
                                )}
                            >
                                Concluídas ({completedIdeas.length})
                            </button>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleAddIdea}
                            className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                            Nova Nota
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {isLoading ? (
                        <div className="col-span-full flex flex-col justify-center items-center py-32 gap-4">
                            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                            <p className="text-sm font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Carregando seus pensamentos...</p>
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 text-center bg-slate-100 dark:bg-white/[0.02] rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-8">
                                {showCompleted ? <History className="w-10 h-10 text-slate-400 dark:text-white/10" /> : <Lightbulb className="w-10 h-10 text-yellow-500/50" />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                {showCompleted ? 'Nenhuma ideia concluída' : 'Tudo vazio por aqui'}
                            </h2>
                            <p className="text-slate-500 dark:text-white/40 max-w-sm font-medium leading-relaxed">
                                {showCompleted
                                    ? 'As ideias que você marcar como feitas aparecerão aqui para seu histórico.'
                                    : 'Transforme seus lampejos de criatividade em posts virais. Crie sua primeira nota agora.'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {currentList.map((idea) => {
                                const style = getNoteStyle(idea.content.color);
                                return (
                                    <motion.div
                                        layout
                                        key={idea.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        role="button"
                                        onClick={() => setSelectedIdea(idea)}
                                        className={cn(
                                            "aspect-square rounded-[32px] p-7 flex flex-col relative transition-all duration-300 hover:-translate-y-2 hover:rotate-1 group shadow-xl",
                                            style.bg,
                                            style.border,
                                            idea.content.isCompleted && "opacity-60 saturate-[0.5]"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-3 h-3 rounded-full", style.dot)} />
                                                <span className={cn("text-[9px] font-black uppercase opacity-40", style.text)}>
                                                    {formatDate(idea.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateIdeaContent(idea.id, { ...idea.content, isCompleted: !idea.content.isCompleted }, true);
                                                    }}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-colors",
                                                        idea.content.isCompleted ? "text-emerald-600 bg-emerald-500/10" : "text-black/20 hover:bg-black/5 hover:text-emerald-600"
                                                    )}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteIdea(idea.id);
                                                    }}
                                                    className="p-2 rounded-xl text-black/20 hover:bg-black/5 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-hidden">
                                            <h3 className={cn("text-lg font-black tracking-tight leading-tight line-clamp-2 mb-2", style.text)}>
                                                {idea.content.title || (idea.content.note ? 'Insight Provisório' : 'Nova Anotação')}
                                            </h3>
                                            <p className={cn("text-sm font-medium opacity-70 line-clamp-4", style.text)}>
                                                {idea.content.note || 'Sem conteúdo ainda...'}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className={cn("text-[9px] font-black uppercase tracking-tighter", style.text)}>Ver Detalhes</span>
                                            <Maximize2 className={cn("w-4 h-4", style.text)} />
                                        </div>

                                        {idea.content.expansion && !idea.content.isCompleted && (
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center shadow-lg border-2 border-[#0d0d12]">
                                                <Zap className="w-4 h-4 text-slate-900 dark:text-white" />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </main>

            {/* Note Editor Modal */}
            <AnimatePresence>
                {selectedIdea && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                handleBlur();
                                setSelectedIdea(null);
                            }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                "relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[95vh]",
                                getNoteStyle(selectedIdea.content.color).bg
                            )}
                        >
                            <button
                                onClick={() => {
                                    handleBlur();
                                    setSelectedIdea(null);
                                }}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-black/20 hover:text-black transition-all z-20"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Left Side: Editorial Note */}
                            <div className="flex-1 p-10 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-2">
                                            {NOTE_COLORS.map((color) => (
                                                <button
                                                    key={color.bg}
                                                    onClick={() => handleUpdateIdeaContent(selectedIdea.id, { ...selectedIdea.content, color: color.bg }, true)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                                                        color.bg,
                                                        selectedIdea.content.color === color.bg ? "border-black/20" : "border-transparent"
                                                    )}
                                                >
                                                    {selectedIdea.content.color === color.bg && <Check className="w-3 h-3 text-black/40" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="h-4 w-px bg-black/10 mx-2" />
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(selectedIdea.created_at)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                handleUpdateIdeaContent(selectedIdea.id, { ...selectedIdea.content, isCompleted: !selectedIdea.content.isCompleted }, true);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                selectedIdea.content.isCompleted
                                                    ? "bg-emerald-500 text-slate-900 dark:text-white"
                                                    : "bg-black/5 text-black/40 hover:bg-black/10 hover:text-black"
                                            )}
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            {selectedIdea.content.isCompleted ? 'Concluída' : 'Ckeck'}
                                        </button>

                                        <button
                                            onClick={handleManualSave}
                                            disabled={!isDirtyRef.current || isSaving}
                                            className={cn(
                                                "flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                                                isDirtyRef.current
                                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                                    : "bg-black/5 text-black/20 cursor-default"
                                            )}
                                        >
                                            {isSaving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            {isDirtyRef.current ? 'Salvar Agora' : 'Salvo'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar-light pr-4">
                                    <textarea
                                        autoFocus
                                        value={selectedIdea.content.note}
                                        onBlur={handleBlur}
                                        onChange={(e) => handleUpdateIdeaContent(selectedIdea.id, { ...selectedIdea.content, note: e.target.value })}
                                        className={cn(
                                            "w-full bg-transparent border-none focus:ring-0 p-0 text-xl md:text-3xl font-bold placeholder:text-black/10 min-h-[400px] resize-none",
                                            getNoteStyle(selectedIdea.content.color).text,
                                            selectedIdea.content.isCompleted && "line-through opacity-50"
                                        )}
                                        placeholder="O que você está pensando? Digite aqui sua ideia..."
                                    />
                                </div>

                                <div className="mt-8 pt-8 border-t border-black/5 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        {canUseAI ? (
                                            <button
                                                onClick={() => handleOptimizeIdea(selectedIdea)}
                                                disabled={optimizingId === selectedIdea.id || selectedIdea.content.isCompleted}
                                                className="px-8 py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:translate-y-[-2px] active:translate-y-[0] transition-all disabled:opacity-30 disabled:translate-y-0"
                                            >
                                                {optimizingId === selectedIdea.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                                                ) : (
                                                    <Zap className="w-5 h-5 text-yellow-400" />
                                                )}
                                                {selectedIdea.content.expansion ? 'Recriar Plano de Conteúdo' : 'Expandir com IA'}
                                            </button>
                                        ) : (
                                            <div className="px-6 py-3 bg-slate-100 rounded-2xl border border-slate-200">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Zap className="w-3 h-3" />
                                                    IA disponível no Boost
                                                </p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (!selectedIdea.content.note && !selectedIdea.content.title) {
                                                    toast.error('Adicione conteúdo à ideia antes de agendar.');
                                                    return;
                                                }
                                                setIsScheduling(true);
                                            }}
                                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:translate-y-[-2px] active:translate-y-[0] transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            <CalendarDays className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div />
                                        <div className="flex flex-col items-end">
                                            {isDirtyRef.current && (
                                                <div className="flex items-center gap-2 text-amber-600 mb-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Alterações Não Salvas</span>
                                                </div>
                                            )}
                                            <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest leading-none">
                                                Backup automático ativado
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: AI Output */}
                            <div className="w-full md:w-[480px] bg-black/5 border-l border-black/5 p-10 overflow-y-auto custom-scrollbar-light">
                                {!selectedIdea.content.expansion && !optimizingId ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                        <div className="w-20 h-20 bg-black/5 rounded-[32px] flex items-center justify-center mb-8">
                                            <Zap className="w-10 h-10 text-black/10" />
                                        </div>
                                        <h4 className="text-lg font-black text-black/60 mb-2">Potencialize sua Ideia</h4>
                                        <p className="text-xs font-bold text-black/30 max-w-[240px] leading-relaxed">
                                            Clique em "Expandir com IA" para transformar sua anotação em um roteiro completo com título, storytelling e CTA.
                                        </p>
                                    </div>
                                ) : optimizingId === selectedIdea.id ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-black/5 border-t-violet-500 rounded-full animate-spin" />
                                            <Zap className="absolute inset-0 m-auto w-6 h-6 text-violet-500" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-black/30 animate-pulse">Consultando Inteligência...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {selectedIdea.content.title && (
                                            <div className="p-6 bg-white rounded-[32px] shadow-sm border border-black/5">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 mb-4 block">Título Estratégico</span>
                                                <h4 className="text-2xl font-black text-black leading-tight tracking-tight">{selectedIdea.content.title}</h4>
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4 block">Roteiro Sugerido</span>
                                            <div className="text-sm font-medium text-black/70 leading-relaxed whitespace-pre-wrap bg-white p-7 rounded-[32px] border border-black/5 shadow-sm">
                                                {selectedIdea.content.expansion}
                                            </div>
                                        </div>

                                        {selectedIdea.content.facts && selectedIdea.content.facts.length > 0 && (
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 block">Contexto e Autoridade</span>
                                                <div className="space-y-4">
                                                    {selectedIdea.content.facts.map((fact, idx) => (
                                                        <div key={idx} className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-black/5 shadow-sm">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                            <span className="text-xs font-bold text-black/60 leading-relaxed">{fact}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedIdea.content.cta && (
                                            <div className="bg-orange-500/10 border border-orange-500/20 p-8 rounded-[32px]">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2 block">Chamada para Ação</span>
                                                <p className="text-sm font-black text-orange-950 italic">"{selectedIdea.content.cta}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Scheduling Modal */}
            <AnimatePresence>
                {isScheduling && selectedIdea && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsScheduling(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <CalendarDays className="w-32 h-32 text-indigo-500" />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Agendar no Planner</h3>
                                <p className="text-xs font-medium text-white/40 mb-8 uppercase tracking-widest">Escolha quando deseja postar esta ideia</p>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Data da Postagem</label>
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Horário Sugerido</label>
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            onClick={() => setIsScheduling(false)}
                                            className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setIsSendingToPlanner(true);
                                                try {
                                                    const [hours, minutes] = scheduledTime.split(':').map(Number);
                                                    const dateObj = new Date(scheduledDate);
                                                    dateObj.setHours(hours, minutes, 0, 0);

                                                    const { error } = await supabase
                                                        .from('planner_posts')
                                                        .insert([{
                                                            user_id: user?.id,
                                                            title: selectedIdea.content.title || 'Nova Ideia',
                                                            description: selectedIdea.content.note,
                                                            caption: selectedIdea.content.expansion || '',
                                                            start_date: scheduledDate,
                                                            scheduled_time: dateObj.toISOString(),
                                                            platform: 'instagram',
                                                            is_idea: true,
                                                            status: 'IDEA'
                                                        }]);

                                                    if (error) throw error;
                                                    toast.success('Ideia enviada para o seu Planner!');
                                                    setIsScheduling(false);
                                                    setSelectedIdea(null);
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error('Erro ao enviar para o Planner.');
                                                } finally {
                                                    setIsSendingToPlanner(false);
                                                }
                                            }}
                                            disabled={isSendingToPlanner}
                                            className="flex-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSendingToPlanner ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )}
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};
