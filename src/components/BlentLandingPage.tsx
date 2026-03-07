import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { cn } from '../lib/utils';
import {
    Zap, Sparkles, Target, ArrowRight, Star,
    Menu, X, CheckCircle2,
    Layers, Wand2, Image as ImageIcon,
    ChevronDown, Clock, Shield, Search, Check
} from 'lucide-react';
import { Blent_PLANS } from '../config/plans';

interface BlentLandingPageProps {
    onGoToLogin: () => void;
    onGoToSignup: () => void;
}

const STEPS = [
    {
        number: '01',
        title: 'Escolha seu Template',
        desc: 'Centenas de layouts cinematográficos validados para converter e parar o scroll.',
        color: 'from-blue-500 to-indigo-600',
    },
    {
        number: '02',
        title: 'Personalize em Segundos',
        desc: 'Altere cores, textos e imagens com um clique. Design de alto nível sem esforço.',
    },
    {
        number: '03',
        title: 'Baixe e Viralize',
        desc: 'Exportação em Ultra HD pronta para suas redes sociais. Simples assim.',
    },
];

const FEATURES = [
    {
        icon: ImageIcon,
        tag: 'Design Premium',
        title: 'Estáticos Cinematográficos',
        desc: 'Chega de posts genéricos. Tenha acesso a layouts que antes eram exclusivos de grandes agências.',
        color: 'text-blue-400',
        border: 'border-blue-500/20',
        bg: 'bg-blue-500/5',
    },
    {
        icon: Layers,
        tag: 'Engajamento',
        title: 'Carrosséis Infinitos',
        desc: 'A estrutura perfeita para contar histórias e prender a atenção do seu seguidor até o último slide.',
        color: 'text-indigo-400',
        border: 'border-indigo-500/20',
        bg: 'bg-indigo-500/5',
    },
    {
        icon: Search,
        tag: 'Estratégia',
        title: 'Biblioteca de Referências',
        desc: 'Um acervo curado com o que há de melhor no mercado para você nunca mais ficar sem inspiração.',
        color: 'text-emerald-400',
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/5',
    },
];

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export function BlentLandingPage({ onGoToLogin, onGoToSignup }: BlentLandingPageProps) {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navScrolled = scrollY > 60;

    return (
        <div className="min-h-screen bg-[#05050a] text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
                <div className="absolute top-[60%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[130px]" />
            </div>

            {/* Nav */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'bg-[#05050a]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-lg">Blent</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onGoToLogin} className="text-sm font-bold text-white/60 hover:text-white transition-colors">Entrar</button>
                        <button onClick={onGoToSignup} className="px-5 py-2.5 rounded-full bg-blue-600 text-sm font-bold shadow-lg shadow-blue-600/20">Começar Agora</button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-40 pb-32 px-6 text-center z-10">
                <FadeIn>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-8">
                        <Sparkles className="w-3.5 h-3.5" />
                        A era dos posts genéricos chegou ao fim
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
                        Crie estáticos e carrosséis<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">em segundos.</span>
                    </h1>
                    <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Tenha acesso à plataforma de design mais rápida do mercado. Criada para quem precisa de alto nível estático sem perder horas no Canva.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={onGoToSignup} className="px-10 py-5 rounded-2xl bg-blue-600 text-lg font-black shadow-xl shadow-blue-600/20 hover:scale-105 transition-all">Começar agora</button>
                    </div>
                </FadeIn>
            </section>

            {/* Steps */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {STEPS.map((s, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="p-8 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all h-full">
                                <div className="text-4xl font-black text-blue-500/20 mb-6">{s.number}</div>
                                <h3 className="text-xl font-black mb-4">{s.title}</h3>
                                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h2 className="text-4xl font-black mb-6">Tudo para o seu <span className="text-blue-400">crescimento</span></h2>
                        </FadeIn>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className={cn(
                                    "p-8 rounded-3xl border h-full transition-all hover:scale-[1.02]",
                                    f.border,
                                    f.bg
                                )}>
                                    <f.icon className={`w-8 h-8 ${f.color} mb-6`} />
                                    <h3 className="text-xl font-black mb-4">{f.title}</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-24 px-6 relative z-10 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <FadeIn>
                            <h2 className="text-4xl md:text-5xl font-black mb-6">Comece agora com o <span className="text-blue-400">melhor plano</span></h2>
                            <p className="text-white/50 max-w-2xl mx-auto font-medium">Escolha a opção que melhor se adapta ao seu momento e comece a criar posts de alto nível hoje mesmo.</p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {Blent_PLANS.map((plan, i) => (
                            <FadeIn key={plan.id} delay={i * 0.1}>
                                <div className={cn(
                                    "relative p-8 rounded-[2.5rem] border transition-all duration-500 h-full flex flex-col group",
                                    plan.popular
                                        ? "bg-gradient-to-b from-blue-600/20 to-indigo-600/5 border-blue-500/40 shadow-2xl shadow-blue-500/10 scale-105 z-10"
                                        : "bg-white/[0.03] border-white/[0.06] hover:border-white/10"
                                )}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                            Mais Popular
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-lg font-black text-white/40 uppercase tracking-widest mb-4 group-hover:text-white transition-colors">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-bold opacity-50">R$</span>
                                            <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                            <span className="text-sm font-bold opacity-50">{plan.period}</span>
                                        </div>
                                        {plan.billing && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mt-2">{plan.billing}</p>
                                        )}
                                    </div>

                                    <div className="space-y-4 mb-10 flex-1">
                                        {plan.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className={cn(
                                                    "mt-0.5 p-0.5 rounded-full",
                                                    plan.popular ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/40"
                                                )}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-sm font-medium text-white/70">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={onGoToSignup}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg",
                                            plan.popular
                                                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                                                : "bg-white/5 hover:bg-white/10 text-white border border-white/5"
                                        )}
                                    >
                                        Assinar Agora
                                    </button>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-32 px-6 text-center relative z-10">
                <div className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] shadow-2xl shadow-blue-600/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <FadeIn>
                        <h2 className="text-4xl md:text-5xl font-black mb-8">Pronto para elevar seu nível?</h2>
                        <button onClick={onGoToSignup} className="px-12 py-5 bg-white text-blue-600 rounded-2xl text-lg font-black hover:scale-105 transition-all">Criar conta</button>
                    </FadeIn>
                </div>
            </section>

            <footer className="py-12 border-t border-white/5 text-center text-white/30 text-xs font-bold uppercase tracking-[0.2em]">
                &copy; 2026 Blent · Todos os direitos reservados
            </footer>
        </div>
    );
}
