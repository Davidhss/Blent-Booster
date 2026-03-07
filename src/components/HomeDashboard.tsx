import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTokenGate, PLAN_MAX_TOKENS } from '../hooks/useTokenGate';
import {
    Loader2, Sparkles, Layout, Video, BookOpen, Quote, Target, TrendingUp, Infinity as InfinityIcon,
    Zap, ShoppingCart, Rocket, Lightbulb, CalendarDays, Library, Trophy, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_VERSION } from '../config/appVersion';
import confetti from 'canvas-confetti';
import { AnimatePresence } from 'motion/react';


const MOTIVATIONAL_QUOTES = [
    { quote: "O conteúdo que você tem preguiça de criar é o que vai te levar para o próximo nível.", tip: "Dica: Transforme suas dúvidas de iniciante em tutoriais avançados." },
    { quote: "Seu primeiro post será o pior de todos. Celebre isso e continue.", tip: "Dica: Consistência bate talento quando o talento não é consistente." },
    { quote: "Pessoas compram de pessoas, não de logomarcas. Mostre seus bastidores.", tip: "Dica: Use os stories para documentar os erros, não apenas os acertos." },
    { quote: "Um bom gancho (hook) vale mais que uma hora de edição impecável.", tip: "Dica: Gaste 50% do seu tempo de criação nos primeiros 3 segundos do vídeo." },
    { quote: "A confusão é inimiga da conversão. Seja dolorosamente claro na sua promessa.", tip: "Dica: Se uma criança de 10 anos não entende seu post, reescreva-o." }
];

import { ToolType } from '../types';

interface HomeDashboardProps {
    setCurrentTool: (tool: ToolType) => void;
    totalItemsCount?: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ setCurrentTool, totalItemsCount = 0 }) => {
    const { user, isAdmin, profile: userProfile } = useAuth();
    const { tokenBalance, planMax, planLabel, planKey, percentage, isLowBalance, isBlocked, isUnlimited } = useTokenGate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ posts: 0, ads: 0, storytelling: 0, insights: 0, strategy: 0, total: 0 });
    const [todayPosts, setTodayPosts] = useState<any[]>([]);
    const [dailyInspiration, setDailyInspiration] = useState(MOTIVATIONAL_QUOTES[0]);

    const isBlentVersion = APP_VERSION === 'Blent' && !isAdmin;

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setDailyInspiration(MOTIVATIONAL_QUOTES[randomIndex]);

        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('library')
                .select('type')
                .eq('user_id', user?.id)
                .gte('created_at', today.toISOString());

            if (error) throw error;

            const newStats = { posts: 0, ads: 0, storytelling: 0, insights: 0, strategy: 0, total: 0 };
            if (data) {
                newStats.total = data.length;
                data.forEach(item => {
                    if (item.type === 'static') newStats.posts++;
                    else if (item.type === 'ad-script') newStats.ads++;
                    else if (item.type === 'storytelling-script') newStats.storytelling++;
                    else if (item.type === 'insight') newStats.insights++;
                    else if (item.type === 'content-strategy') newStats.strategy++;
                });
            }
            setStats(newStats);

            // Stats are fetched above. Today's planner posts below.

            // Fetch today's planner posts
            // Reuse the existing 'today' variable declared at the start of the function
            const offsetMs = today.getTimezoneOffset() * 60000;
            const localIsoToday = new Date(today.getTime() - offsetMs).toISOString().split('T')[0];

            const { data: plannerData } = await supabase
                .from('planner_posts')
                .select('*')
                .eq('user_id', user?.id)
                .eq('start_date', localIsoToday)
                .order('scheduled_time', { ascending: true, nullsFirst: false });

            setTodayPosts(plannerData || []);
        } catch (error) {
            console.error('Error fetching today stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // No internal totalItems state anymore, using totalItemsCount prop






    const tokensUsed = isUnlimited ? 0 : planMax - tokenBalance;
    const barPercent = isUnlimited ? 100 : Math.max(0, Math.min(100, (tokenBalance / planMax) * 100));
    const barColor = isBlocked
        ? '#f87171'
        : isLowBalance
            ? '#fbbf24'
            : isUnlimited
                ? '#a78bfa'
                : '#34d399';

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-12 min-h-screen relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

            {/* Premium Hero Greeting */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative py-12 px-8 rounded-[40px] bg-gradient-to-br from-[#1a1a2e] to-[#0d0d12] border border-white/5 overflow-hidden group shadow-2xl"
            >
                {/* Floating Decorative Icons */}
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-[15%] text-violet-500/20"
                >
                    <Video className="w-16 h-16" />
                </motion.div>
                <motion.div
                    animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 left-[10%] text-indigo-500/20"
                >
                    <Rocket className="w-12 h-12" />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/2 right-[10%] text-pink-500/20"
                >
                    <Sparkles className="w-20 h-20" />
                </motion.div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Dashboard Criativa</span>
                        </motion.div>

                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[1.1]">
                                Deixe sua marca no <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400">mundo digital.</span>
                            </h1>
                            <p className="text-lg text-white/40 font-medium max-w-xl">
                                Bem-vindo, {userProfile?.name?.split(' ')[0] || 'Criador'}! Pronto para transformar suas ideias em conteúdo viral hoje?
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                            <button
                                onClick={() => setCurrentTool('remix')}
                                className="px-8 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center gap-2 group/btn"
                            >
                                Começar a Criar
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setCurrentTool('ideas')}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                            >
                                Buscar Inspiração
                            </button>
                        </div>
                    </div>

                    {/* Stats Summary Bubble */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-full md:w-auto grid grid-cols-2 gap-4 shrink-0"
                    >
                        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
                                <Zap className="w-5 h-5 text-violet-400" />
                            </div>
                            <span className="text-2xl font-black text-white">{stats.total}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Criados Hoje</span>
                        </div>
                        <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center group hover:bg-white/10 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
                                <Library className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-2xl font-black text-white">{totalItemsCount}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Total Acervo</span>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/*     TOKEN WALLET     */}
            {/*     TOKEN WALLET (Only for Boost/Admin)     */}
            {!isBlentVersion && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className={cn(
                        "relative rounded-3xl p-6 border overflow-hidden",
                        isBlocked
                            ? "bg-red-950/30 border-red-500/20"
                            : isLowBalance
                                ? "bg-amber-950/20 border-amber-500/20"
                                : "bg-white dark:bg-[#14141e] border-slate-200 dark:border-white/[0.06]"
                    )}
                >
                    {/* glow */}
                    <div className="absolute top-0 right-0 w-64 h-40 blur-[90px] rounded-full"
                        style={{ background: isBlocked ? 'rgba(239,68,68,0.12)' : isLowBalance ? 'rgba(251,191,36,0.1)' : 'rgba(139,92,246,0.08)' }} />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                        {/* Icon */}
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                            isBlocked ? "bg-red-500/10 border border-red-500/20"
                                : isLowBalance ? "bg-amber-500/10 border border-amber-500/20"
                                    : isUnlimited ? "bg-violet-500/10 border border-violet-500/20"
                                        : "bg-emerald-500/10 border border-emerald-500/20"
                        )}>
                            {isUnlimited
                                ? <InfinityIcon className="w-7 h-7 text-violet-400" />
                                : <Zap className="w-7 h-7" style={{ color: barColor }} />
                            }
                        </div>

                        {/* Main info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Carteira de Tokens</p>
                                    {isUnlimited ? (
                                        <div className="flex items-center gap-2">
                                            <InfinityIcon className="w-5 h-5 text-violet-400" />
                                            <span className="text-xl font-black text-violet-300">Acesso Ilimitado Ativado</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-white" style={{ color: barColor }}>
                                                {tokenBalance.toLocaleString()}
                                            </span>
                                            <span className="text-sm font-bold text-white/30">/ {planMax.toLocaleString()} créditos</span>
                                        </div>
                                    )}
                                </div>

                                {/* Plan badge */}
                                <div className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                                    isUnlimited
                                        ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                                        : "bg-white/[0.04] border-white/[0.08] text-white/50"
                                )}>
                                    {isUnlimited ? '¡ ' : ''}{planLabel}
                                </div>
                            </div>

                            {/* Progress bar */}
                            {!isUnlimited && (
                                <div className="space-y-1.5">
                                    <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barPercent}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            style={{ background: `linear-gradient(90deg, ${barColor}99, ${barColor})`, boxShadow: `0 0 8px ${barColor}60` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/25">
                                        <span>{tokensUsed.toLocaleString()} usados</span>
                                        <span>{barPercent.toFixed(0)}% disponível</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA button */}
                        <button
                            onClick={() => setCurrentTool('tokens')}
                            className={cn(
                                "shrink-0 flex items-center gap-2 py-2.5 px-4 rounded-2xl border font-bold text-xs transition-all",
                                isBlocked || isLowBalance
                                    ? "bg-violet-600 border-violet-500 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                                    : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white"
                            )}
                        >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {isBlocked ? 'Comprar Créditos' : isLowBalance ? 'Renovar Créditos' : 'Loja de Tokens'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Low balance inline alert (Only for Boost/Admin) */}
            {isLowBalance && !isUnlimited && !isBlentVersion && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20"
                >
                    <span className="text-lg"> </span>
                    <p className="text-sm font-bold text-amber-300 flex-1">
                        Seus créditos estão acabando! Garanta mais na nossa loja para não parar sua produção.
                    </p>
                    <button
                        onClick={() => setCurrentTool('tokens')}
                        className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 transition-all whitespace-nowrap"
                    >
                        Ver Loja
                    </button>
                </motion.div>
            )}

            {/* Inspirational Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={cn(
                    "relative bg-white dark:bg-[#14141e] rounded-[40px] p-10 border border-slate-200 dark:border-white/[0.06] overflow-hidden group transition-all"
                )}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full group-hover:bg-violet-500/20 transition-colors duration-700" />

                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-2xl flex items-center justify-center shrink-0">
                        <Quote className="w-8 h-8 text-violet-400 opacity-50" />
                    </div>
                    <div className="space-y-3 flex-1">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">"{dailyInspiration.quote}"</h2>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <Target className="w-4 h-4 text-violet-400" />
                            <span className="text-xs font-bold text-violet-300">{dailyInspiration.tip}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Production Stats today */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {isBlentVersion ? 'Impacto Criativo' : 'Produção de Hoje'}
                        </h2>
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 dark:text-white/20" />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Motivational / Creative Mindset Section */}
                        {/* Focus / Goal Card */}
                        <div className="bg-white dark:bg-[#14141e] rounded-[40px] p-8 border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40">Status</span>
                                </div>

                                <h3 className="text-2xl font-black text-white mb-2 leading-tight">Mergulhe no Fluxo</h3>
                                <p className="text-sm text-white/40 font-medium">Você já produziu <span className="text-emerald-400 font-black">{stats.total}</span> conteúdos hoje. Qual será o próximo grande hit?</p>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">
                                        <span>Ritmo de Criação</span>
                                        <span className="text-emerald-400">{Math.min(stats.total * 20, 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(stats.total * 20, 100)}%` }}
                                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Access Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: isBlentVersion ? 'Blent' : 'Remix Boost', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'hover:border-violet-500/30', tool: 'remix' as ToolType },
                                ...(isBlentVersion ? [
                                    { label: 'Banco de Ideias', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'hover:border-yellow-500/30', tool: 'ideas' as ToolType },
                                    { label: 'Planner Beta', icon: CalendarDays, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'hover:border-indigo-500/30', tool: 'planner' as ToolType },
                                    { label: 'Meu Acervo', icon: Library, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'hover:border-pink-500/30', tool: 'library' as ToolType },
                                ] : [
                                    { label: 'Gerador Ideias', icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'hover:border-violet-500/30', tool: 'strategy' as ToolType },
                                    { label: 'Novo Insight', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/30', tool: 'insights' as ToolType },
                                    { label: 'Novo Ad', icon: Video, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'hover:border-orange-500/30', tool: 'ads' as ToolType },
                                    { label: 'Storytelling', icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/30', tool: 'storytelling' as ToolType },
                                ])
                            ].map((stat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentTool(stat.tool)}
                                    className={cn(
                                        "bg-white dark:bg-[#14141e] rounded-[32px] p-6 border border-slate-200 dark:border-white/[0.06] transition-all duration-300 relative overflow-hidden group text-left flex flex-col justify-between h-full shadow-lg hover:shadow-xl hover:scale-[1.02] hover:bg-white/[0.02]",
                                        stat.border
                                    )}
                                    style={{ animationDelay: `${idx * 0.4}s` }}
                                >
                                    <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500", stat.bg)} />
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-slate-200 dark:border-white/[0.05]", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-1">Acesso Rápido</div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-400 transition-colors">{stat.label}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TODAY'S AGENDA (Sidebar) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 flex items-center gap-2">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Agenda de Hoje
                        </h2>
                        <button
                            onClick={() => setCurrentTool('planner')}
                            className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            Ver Todo Planner
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#14141e] rounded-3xl border border-slate-200 dark:border-white/[0.06] overflow-hidden flex flex-col min-h-[400px]">
                        {todayPosts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                                    <CalendarDays className="w-8 h-8 text-white/10" />
                                </div>
                                <p className="text-sm font-bold text-white/20 leading-relaxed">Nenhum post planejado para hoje. <br /> Que tal começar agora?</p>
                                <button
                                    onClick={() => setCurrentTool('planner')}
                                    className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Abrir Planner
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3">
                                {todayPosts.map((post, idx) => (
                                    <div
                                        key={post.id}
                                        className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/30 transition-all group cursor-pointer"
                                        onClick={() => setCurrentTool('planner')}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                                                {post.scheduled_time ? new Date(post.scheduled_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                            </span>
                                            <div className={cn(
                                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                                post.is_posted ? "bg-green-500/10 text-green-400" : "bg-indigo-500/10 text-indigo-400"
                                            )}>
                                                {post.is_posted ? 'Publicado' : 'Pendente'}
                                            </div>
                                        </div>
                                        <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">{post.title}</h4>
                                        <div className="flex items-center gap-2 mt-3">
                                            <img
                                                src={`https://www.google.com/s2/favicons?domain=${post.platform}.com&sz=32`}
                                                className="w-3 h-3 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                                alt=""
                                            />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40">{post.platform} • {post.format}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

        </div>
    );
};
