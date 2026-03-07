import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Target, Calendar, Rocket, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { APP_VERSION } from '../config/appVersion';

interface OnboardingModalProps {
    open: boolean;
    onComplete: () => void;
}

const NICHES = ['Fitness & Saúde', 'Jurídico', 'Gastronomia', 'Marketing Digital', 'Educação', 'Moda & Beleza', 'Finanças', 'Outro'];
const DIFFICULTIES = [
    { value: 'ideias', label: 'Falta de ideias criativas', icon: '💡' },
    { value: 'tempo', label: 'Falta de tempo para criar', icon: '⏱️' },
    { value: 'design', label: 'Design e visual dos posts', icon: '🎨' },
    { value: 'algoritmo', label: 'Entender o algoritmo', icon: '📈' },
];
const FREQUENCIES = [
    { value: 'daily', label: 'Todo dia' },
    { value: '3x', label: '3-4x por semana' },
    { value: '1x', label: '1-2x por semana' },
    { value: 'rarely', label: 'Raramente' },
];
const GOALS = [
    { value: 'time', label: 'Ganhar Tempo', desc: 'Criar conteúdo em minutos, não horas', icon: '⚡' },
    { value: 'design', label: 'Melhorar o Design', desc: 'Posts visualmente profissionais', icon: '✨' },
    { value: 'ideas', label: 'Ter Ideias Criativas', desc: 'Nunca ficar sem saber o que postar', icon: '💡' },
];

const STEPS = ['Nicho', 'Dificuldade', 'Frequência', 'Objetivo'];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onComplete }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        niche: '',
        nicheCustom: '',
        main_difficulty: '',
        post_frequency: '',
        main_goal: '',
    });

    const canProceed = [
        form.niche !== '',
        form.main_difficulty !== '',
        form.post_frequency !== '',
        form.main_goal !== '',
    ][step];

    const handleFinish = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('user_insights').upsert({
                user_id: user.id,
                niche: form.niche === 'Outro' ? (form.nicheCustom || 'Outro') : form.niche,
                main_difficulty: form.main_difficulty,
                post_frequency: form.post_frequency,
                main_goal: form.main_goal,
            }, { onConflict: 'user_id' });
            if (error) throw error;
            toast.success(`Perfil criado com sucesso! Bem-vindo ao ${APP_VERSION === 'Blent' ? 'Blent' : 'Blent Boost'}! 🚀`);
            onComplete();
        } catch (err) {
            console.error('Error saving onboarding', err);
            toast.error('Erro ao salvar. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="onboarding-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 32 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="relative w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #1a112e 0%, #0d0d12 100%)' }}
                    >
                        {/* Decorative glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-56 bg-violet-600/15 blur-[90px] rounded-full pointer-events-none" />

                        <div className="relative z-10 p-8">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight">Vamos te conhecer!</h2>
                                    <p className="text-xs text-white/40">Passo {step + 1} de {STEPS.length}</p>
                                </div>
                            </div>

                            {/* Progress dots */}
                            <div className="flex gap-2 mb-8">
                                {STEPS.map((s, i) => (
                                    <div key={s} className="flex-1 flex flex-col items-start gap-1">
                                        <div className={cn(
                                            'h-1 w-full rounded-full transition-all duration-500',
                                            i < step ? 'bg-violet-500' : i === step ? 'bg-violet-400' : 'bg-white/10'
                                        )} />
                                        <span className={cn(
                                            'text-[9px] font-black uppercase tracking-wider transition-colors',
                                            i === step ? 'text-violet-400' : 'text-white/20'
                                        )}>{s}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Steps */}
                            <div className="min-h-[260px]">
                                <AnimatePresence mode="wait">
                                    {/* Step 0  Nicho */}
                                    {step === 0 && (
                                        <motion.div
                                            key="step0"
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.22 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Target className="w-5 h-5 text-violet-400" />
                                                <h3 className="text-xl font-black text-white">Qual o seu nicho de atuação?</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {NICHES.map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setForm(f => ({ ...f, niche: n }))}
                                                        className={cn(
                                                            'py-3 px-4 rounded-2xl border text-sm font-bold transition-all text-left',
                                                            form.niche === n
                                                                ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                                                                : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white'
                                                        )}
                                                    >
                                                        {form.niche === n && <CheckCircle2 className="w-3 h-3 inline mr-1.5 text-violet-400" />}
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                            {form.niche === 'Outro' && (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Descreva o seu nicho..."
                                                    value={form.nicheCustom}
                                                    onChange={e => setForm(f => ({ ...f, nicheCustom: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
                                                />
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Step 1  Difficulty */}
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.22 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <ChevronRight className="w-5 h-5 text-violet-400" />
                                                <h3 className="text-xl font-black text-white">Qual sua maior dificuldade na criação de conteúdo?</h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {DIFFICULTIES.map(d => (
                                                    <button
                                                        key={d.value}
                                                        onClick={() => setForm(f => ({ ...f, main_difficulty: d.value }))}
                                                        className={cn(
                                                            'flex items-center gap-4 py-4 px-5 rounded-2xl border text-sm font-bold transition-all text-left',
                                                            form.main_difficulty === d.value
                                                                ? 'bg-violet-600/25 border-violet-500 text-violet-200'
                                                                : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white'
                                                        )}
                                                    >
                                                        <span className="text-2xl">{d.icon}</span>
                                                        <span>{d.label}</span>
                                                        {form.main_difficulty === d.value && (
                                                            <CheckCircle2 className="w-4 h-4 text-violet-400 ml-auto" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2  Frequency */}
                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.22 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-violet-400" />
                                                <h3 className="text-xl font-black text-white">Com que frequência você posta nas redes sociais?</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {FREQUENCIES.map(f => (
                                                    <button
                                                        key={f.value}
                                                        onClick={() => setForm(prev => ({ ...prev, post_frequency: f.value }))}
                                                        className={cn(
                                                            'py-5 px-4 rounded-2xl border font-bold text-sm transition-all flex flex-col items-center gap-1 text-center',
                                                            form.post_frequency === f.value
                                                                ? 'bg-violet-600/25 border-violet-500 text-violet-200'
                                                                : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:border-white/20 hover:text-white'
                                                        )}
                                                    >
                                                        {form.post_frequency === f.value && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3  Goal */}
                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            transition={{ duration: 0.22 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Rocket className="w-5 h-5 text-violet-400" />
                                                <h3 className="text-xl font-black text-white">Qual seu objetivo principal?</h3>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {GOALS.map(g => (
                                                    <button
                                                        key={g.value}
                                                        onClick={() => setForm(f => ({ ...f, main_goal: g.value }))}
                                                        className={cn(
                                                            'flex items-center gap-4 py-4 px-5 rounded-2xl border transition-all text-left',
                                                            form.main_goal === g.value
                                                                ? 'bg-violet-600/25 border-violet-500'
                                                                : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                                                        )}
                                                    >
                                                        <span className="text-3xl">{g.icon}</span>
                                                        <div className="flex-1">
                                                            <div className={cn('font-black text-sm', form.main_goal === g.value ? 'text-violet-200' : 'text-white/80')}>{g.label}</div>
                                                            <div className="text-xs text-white/40 mt-0.5">{g.desc}</div>
                                                        </div>
                                                        {form.main_goal === g.value && <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-3 mt-8">
                                {step > 0 && (
                                    <button
                                        onClick={() => setStep(s => s - 1)}
                                        className="py-3 px-5 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-bold text-sm transition-all"
                                    >
                                        Voltar
                                    </button>
                                )}
                                <button
                                    disabled={!canProceed || saving}
                                    onClick={() => {
                                        if (step < STEPS.length - 1) {
                                            setStep(s => s + 1);
                                        } else {
                                            handleFinish();
                                        }
                                    }}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide transition-all',
                                        canProceed && !saving
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-[0.98]'
                                            : 'bg-white/5 text-white/20 cursor-not-allowed'
                                    )}
                                >
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                                    ) : step < STEPS.length - 1 ? (
                                        <>Próximo <ChevronRight className="w-4 h-4" /></>
                                    ) : (
                                        <>Começar a Criar <Rocket className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
