import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Library,
    Image as ImageIcon,
    Video,
    Target,
    BookOpen,
    Trash2,
    ExternalLink,
    Search,
    Loader2,
    Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { LibraryItem } from '../types';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../config/appVersion';

interface LibraryViewProps {
    userEmail: string;
    onUseItem?: (item: LibraryItem) => void;
}

type FilterType = 'all' | 'static' | 'ad-script' | 'storytelling-script' | 'insight';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    all: { label: 'Todos', color: 'text-slate-900 dark:text-white', icon: <Library className="w-4 h-4" /> },
    static: { label: 'Posts', color: 'text-violet-400', icon: <ImageIcon className="w-4 h-4" /> },
    'ad-script': { label: 'Anúncios', color: 'text-blue-400', icon: <Video className="w-4 h-4" /> },
    'storytelling-script': { label: 'Storytelling', color: 'text-purple-400', icon: <BookOpen className="w-4 h-4" /> },
    insight: { label: 'Insights', color: 'text-emerald-400', icon: <Target className="w-4 h-4" /> },
};

const isAdmin = false; // Note: In a real app this would come from a context or auth, but LibraryView doesn't have it in props yet. 
// Adding it to keep consistency with the logic

export const LibraryView: React.FC<LibraryViewProps> = ({ userEmail, onUseItem }) => {
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [search, setSearch] = useState('');
    const [lastDeletedItem, setLastDeletedItem] = useState<LibraryItem | null>(null);

    useEffect(() => {
        const fetchLibrary = async () => {
            setIsLoading(true);
            try {
                const { user } = (await supabase.auth.getUser()).data;
                if (!user) return;
                const { data, error } = await supabase
                    .from('library')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setLibrary(data as LibraryItem[]);
            } catch (err) {
                console.error('Error fetching library:', err);
                toast.error('Erro ao carregar a biblioteca.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchLibrary();
    }, [userEmail]);

    const handleDelete = async (id: number) => {
        const itemToDelete = library.find(item => item.id === id);
        if (!itemToDelete) return;

        try {
            const { error } = await supabase.from('library').delete().eq('id', id);
            if (error) throw error;

            setLastDeletedItem(itemToDelete);
            setLibrary(prev => prev.filter(item => item.id !== id));

            toast.success('Item removido da biblioteca.', {
                action: {
                    label: 'Desfazer',
                    onClick: () => handleUndo(itemToDelete)
                },
                duration: 5000
            });
        } catch (err) {
            toast.error('Erro ao remover item.');
        }
    };

    const handleUndo = async (item: LibraryItem) => {
        try {
            // Remove the id to let Supabase generate a new one, or keep it if possible
            // To be safe and simple, we insert it back. 
            const { id, created_at, ...rest } = item;
            const { data, error } = await supabase.from('library').insert([rest]).select().single();
            if (error) throw error;

            setLibrary(prev => [data as LibraryItem, ...prev]);
            setLastDeletedItem(null);
            toast.success('Item restaurado com sucesso!');
        } catch (err) {
            console.error('Error undoing delete:', err);
            toast.error('Erro ao restaurar item.');
        }
    };

    const filtered = library.filter(item => {
        const matchType = activeFilter === 'all' || item.type === activeFilter;
        const matchSearch = !search || JSON.stringify(item.content).toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const getItemTitle = (item: LibraryItem) => {
        if (item.type === 'static') return (item.content as any).slides?.[0]?.title || 'Carrossel sem título';
        if (item.type === 'ad-script') return (item.content as any).hook?.slice(0, 60) || 'Anúncio sem título';
        if (item.type === 'storytelling-script') return (item.content as any).title || 'Roteiro sem título';
        if (item.type === 'insight') return `${(item.content as any[])?.length || 0} Insights gerados`;
        return 'Item sem título';
    };

    const countByType = (type: FilterType) =>
        type === 'all' ? library.length : library.filter(i => i.type === type).length;

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-pink-500/15 border border-pink-500/20 rounded-xl">
                                <Library className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Minha Biblioteca</h1>
                                <p className="text-slate-500 dark:text-white/40 text-sm font-medium">Todo o seu conteúdo salvo em um só lugar.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">{library.length} Itens Salvos</span>
                    </div>
                </div>

                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Filter tabs */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl flex-wrap backdrop-blur-md">
                        {(Object.keys(TYPE_LABELS) as FilterType[])
                            .filter(type => {
                                if (APP_VERSION === 'Blent' && !isAdmin) {
                                    return !['ad-script', 'storytelling-script', 'insight'].includes(type);
                                }
                                return true;
                            })
                            .map(type => {
                                const info = TYPE_LABELS[type];
                                const count = countByType(type);
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setActiveFilter(type)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group",
                                            activeFilter === type
                                                ? "text-white"
                                                : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70"
                                        )}
                                    >
                                        {activeFilter === type && (
                                            <motion.div
                                                layoutId="activeFilter"
                                                className="absolute inset-0 bg-violet-600 shadow-lg shadow-violet-500/20"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className={cn("relative z-10 transition-colors", activeFilter === type ? 'text-white' : info.color)}>{info.icon}</span>
                                        <span className="relative z-10">{info.label}</span>
                                        <span className={cn(
                                            "relative z-10 px-1.5 py-0.5 rounded-md text-[9px] transition-colors",
                                            activeFilter === type ? "bg-white/20 text-white" : "bg-white/[0.05] text-white/30"
                                        )}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/20" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar no acervo..."
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#14141e] border border-slate-200 dark:border-white/[0.06] rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 transition-all"
                        />
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-32 flex flex-col items-center justify-center bg-white dark:bg-[#14141e] border border-slate-200 dark:border-white/[0.06] border-dashed rounded-3xl"
                            >
                                <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
                                    <Library className="w-6 h-6 text-slate-400 dark:text-white/20" />
                                </div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                    {search ? 'Nenhum resultado encontrado' : 'Nenhum conteúdo salvo ainda'}
                                </p>
                                <p className="text-[11px] font-medium text-slate-400 dark:text-white/30 max-w-xs text-center">
                                    {search ? 'Tente outro termo de busca.' : `Use as ferramentas do ${APP_VERSION === 'Blent' ? 'Blent' : 'Blent Boost'} para gerar conteúdos e salve-os aqui.`}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                layout
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            >
                                {filtered.map((item) => {
                                    const typeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.static;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            whileHover={{
                                                y: -8,
                                                rotateX: -2,
                                                rotateY: 2,
                                                transition: { duration: 0.2 }
                                            }}
                                            className="perspective-1000"
                                        >
                                            <div className="bg-white dark:bg-[#14141e] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden group flex flex-col hover:border-violet-500/30 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-violet-500/10 h-full">
                                                {/* Thumbnail area */}
                                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-white/[0.02] flex items-center justify-center">
                                                    {/* Type accent bg */}
                                                    <div className={cn(
                                                        "absolute inset-0 opacity-[0.06] pointer-events-none transition-transform group-hover:scale-125 duration-1000",
                                                        item.type === 'ad-script' ? "bg-blue-500" :
                                                            item.type === 'storytelling-script' ? "bg-purple-500" :
                                                                item.type === 'insight' ? "bg-emerald-500" : "bg-violet-500"
                                                    )} />

                                                    {item.type === 'static' ? (
                                                        <div className="w-full h-full p-6 flex items-center justify-center relative">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10" />
                                                            <div
                                                                className="w-full max-w-[140px] aspect-square rounded-2xl shadow-2xl overflow-hidden flex flex-col transform group-hover:scale-105 group-hover:-rotate-3 transition-all duration-500 ring-2 ring-white/10"
                                                                style={{ backgroundColor: (item.content as any).primaryColor, color: (item.content as any).secondaryColor }}
                                                            >
                                                                <div className="p-3 flex-1 flex flex-col justify-center text-center">
                                                                    <p className="text-[10px] font-black leading-tight line-clamp-4">{(item.content as any).slides[0]?.title}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3 relative z-10">
                                                            <motion.div
                                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                                className={cn(
                                                                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg",
                                                                    item.type === 'ad-script' ? "bg-blue-500/10 border border-blue-500/20" :
                                                                        item.type === 'storytelling-script' ? "bg-purple-500/10 border border-purple-500/20" :
                                                                            "bg-emerald-500/10 border border-emerald-500/20"
                                                                )}
                                                            >
                                                                <span className={cn("transform scale-125", typeInfo.color)}>{typeInfo.icon}</span>
                                                            </motion.div>
                                                        </div>
                                                    )}

                                                    {/* Hover actions */}
                                                    <div className="absolute inset-0 bg-[#0f1016]/90 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-md">
                                                        <button
                                                            onClick={() => onUseItem?.(item)}
                                                            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-violet-600 text-white flex items-center justify-center transition-all shadow-lg hover:shadow-violet-600/20"
                                                            title="Usar este item"
                                                        >
                                                            <ExternalLink className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-lg hover:shadow-red-500/20"
                                                            title="Excluir item"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Card footer */}
                                                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2 group-hover:text-violet-400 transition-colors">
                                                            {getItemTitle(item)}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04]",
                                                                typeInfo.color
                                                            )}>
                                                                {typeInfo.icon}
                                                                {typeInfo.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                                                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/25">
                                                            Adicionado em
                                                        </p>
                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white/60">
                                                            {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
