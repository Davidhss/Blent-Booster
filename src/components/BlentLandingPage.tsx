import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { cn } from '../lib/utils';
import {
    Zap, Sparkles, Target, ArrowRight, Star,
    Menu, X, CheckCircle2,
    Layers, Wand2, Image as ImageIcon,
    ChevronDown, Clock, Shield, Search, Check, Play
} from 'lucide-react';
import { Blent_PLANS } from '../config/plans';

declare global {
    interface Window {
        fbq: any;
        _fbq: any;
    }
}
const fbq = (...args: any[]) => window.fbq && window.fbq(...args);

interface BlentLandingPageProps {
    onGoToLogin: () => void;
    onGoToSignup: () => void;
}

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
    const [navScrolled, setNavScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 60;
            if (isScrolled !== navScrolled) {
                setNavScrolled(isScrolled);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Facebook Pixel Script Injection
        if (!window.fbq) {
            (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s);
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', '34803642885900965');
            window.fbq('track', 'PageView');
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [navScrolled]);

    return (
        <div className="min-h-screen bg-[#06060f] text-white overflow-x-hidden font-sans selection:bg-violet-600/30 selection:text-violet-400">
            {/* Ambient Background & Orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-40">
                <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.15)_0%,transparent_70%)] blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
                <div className="absolute top-[60%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.1)_0%,transparent_70%)] blur-[100px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
            </div>
            {/* Grid Pattern */}
            <div className="fixed inset-0 z-0" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' }} />

            {/* Nav */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'bg-[#06060f]/80 backdrop-blur-xl border-b border-violet-500/10' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white">Blent<span className="text-violet-400">Boost</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onGoToLogin} className="text-sm font-bold text-white/60 hover:text-white transition-colors">Entrar</button>
                        <motion.button onClick={onGoToSignup} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all border border-violet-500/50">Criar conta</motion.button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-40 pb-32 px-6 text-center z-10 flex flex-col items-center justify-center min-h-[90vh]">
                <FadeIn>
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-bold uppercase tracking-widest mb-8 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                        <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                        Novo · Lançamento 2025
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="text-5xl md:text-7xl lg:text-[86px] font-extrabold mb-8 leading-[1.03] tracking-tight font-['Syne'] max-w-[920px] mx-auto">
                        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }} className="block">Conteúdo profissional</motion.span>
                        <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="block text-violet-400 font-normal italic">em menos de 1 minuto.</motion.span>
                        <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="block mt-4 text-white/40 text-[0.6em] tracking-normal">Sem Canva. Sem designer.</motion.span>
                    </motion.h1>
                    <p className="text-lg text-white/50 max-w-[580px] mx-auto mb-10 leading-[1.75] font-light">
                        O Blent Boost é o <strong className="text-white font-medium">ecossistema completo</strong> para criadores e empreendedores que precisam de conteúdo <strong className="text-white font-medium">bonito, rápido e consistente</strong> — do primeiro rascunho até o dia da publicação.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
                        <motion.button onClick={onGoToSignup}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="relative px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-lg font-bold shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] transition-all group flex items-center gap-3 overflow-hidden border border-violet-500/50">
                            <span className="relative z-10 flex items-center gap-2">
                                Criar minha conta agora
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        </motion.button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-white/40 mb-16">
                        <Shield className="w-4 h-4" />
                        <span>Acesso imediato. Cancele quando quiser.</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 pt-12 border-t border-white/5">
                        <div className="text-left">
                            <div className="font-['Syne'] text-4xl md:text-5xl font-extrabold text-white mb-2">10<span className="text-violet-400">×</span></div>
                            <div className="text-sm text-white/40 font-medium">mais rápido que o Canva</div>
                        </div>
                        <div className="text-left">
                            <div className="font-['Syne'] text-4xl md:text-5xl font-extrabold text-white mb-2">8</div>
                            <div className="text-sm text-white/40 font-medium">estilos virais prontos</div>
                        </div>
                        <div className="text-left">
                            <div className="font-['Syne'] text-4xl md:text-5xl font-extrabold text-white mb-2"><span className="text-violet-400">R$</span>49</div>
                            <div className="text-sm text-white/40 font-medium">para começar hoje</div>
                        </div>
                    </div>
                </FadeIn>
            </section>

            {/* Marquee */}
            <div className="relative z-10 py-8 border-y border-[#1a1a28] overflow-hidden bg-violet-600/[0.015] flex">
                <motion.div
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="flex gap-16 whitespace-nowrap px-8"
                >
                    {[...Array(2)].map((_, i) => (
                        <React.Fragment key={i}>
                            <div className="flex items-center gap-3 font-['Syne'] text-xs font-bold uppercase tracking-[0.2em] text-white/40"><Sparkles className="w-3 h-3 text-violet-400" /> Posts Cinematográficos</div>
                            <div className="flex items-center gap-3 font-['Syne'] text-xs font-bold uppercase tracking-[0.2em] text-white/40"><Sparkles className="w-3 h-3 text-violet-400" /> Banco de Ideias Inteligente</div>
                            <div className="flex items-center gap-3 font-['Syne'] text-xs font-bold uppercase tracking-[0.2em] text-white/40"><Sparkles className="w-3 h-3 text-violet-400" /> Planner Editorial Visual</div>
                            <div className="flex items-center gap-3 font-['Syne'] text-xs font-bold uppercase tracking-[0.2em] text-white/40"><Sparkles className="w-3 h-3 text-violet-400" /> IA Integrada</div>
                        </React.Fragment>
                    ))}
                </motion.div>
            </div>

            {/* Configuração */}
            <section className="py-32 px-6 relative z-10 bg-[#0a0a0f] border-b border-[#1a1a28]">
                <div className="max-w-5xl mx-auto">
                    <FadeIn>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mb-6">O Problema Real</p>
                        <h2 className="font-['Syne'] text-4xl md:text-[52px] font-extrabold leading-[1.08] tracking-tight mb-6">
                            Você não falta criatividade.<br />Você falta <i className="not-italic text-violet-400 font-normal">sistema.</i>
                        </h2>
                        <p className="text-lg text-white/40 max-w-[640px] mb-16 font-light">
                            Bons criadores perdem horas no processo — não nas ideias. Reconhece algum desses?
                        </p>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[#1a1a28]">
                        {[
                            { icon: '⏱️', title: '2 horas para um carrossel simples', desc: 'Você entra no Canva para "fazer rápido" e 2 horas depois ainda está escolhendo fonte. O conteúdo nunca sai.' },
                            { icon: '💸', title: 'Posts que parecem "amadores"', desc: 'Mesmo com esforço, o resultado final ainda parece genérico. E isso queima sua autoridade — silenciosamente.' },
                            { icon: '🧠', title: 'Ideia boa que morreu no grupo do WhatsApp', desc: 'Você tuita a ideia pro Notes, pro grupo... e quando vai criar o conteúdo, sumiu. Ou você esqueceu o contexto.' },
                            { icon: '📅', title: 'A consistência quebra todo mês', desc: 'Você começa forte, mas sem planejamento visual do que vai postar, a rotina desmorona na segunda semana.' }
                        ].map((pain, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="bg-[#0e0e14] p-10 h-full group relative overflow-hidden transition-all duration-300 hover:bg-[#0f0f18] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)]">
                                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
                                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="text-4xl mb-6 inline-block transform origin-bottom-left transition-transform">{pain.icon}</motion.div>
                                    <h3 className="font-['Syne'] text-lg font-bold text-white mb-3">{pain.title}</h3>
                                    <p className="text-sm text-white/40 leading-relaxed font-light">{pain.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* Intro Solution */}
            <section className="py-32 px-6 text-center relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(139,92,246,0.06),transparent_65%)] pointer-events-none" />
                <FadeIn>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mb-6">A Solução</p>
                    <h2 className="font-['Syne'] text-4xl md:text-[68px] font-extrabold leading-[1.05] tracking-tight mb-6">
                        Não é só uma ferramenta.<br />É um <i className="not-italic text-violet-400 font-normal">ecossistema</i> completo.
                    </h2>
                    <p className="text-xl text-white/40 max-w-[600px] mx-auto font-light">
                        Criamos um fluxo fechado: da ideia bruta ao post publicado. Sem abrir 5 abas. Sem precisar de designer. Sem perder o fio.
                    </p>
                </FadeIn>
            </section>

            {/* Details */}
            <section className="py-10 px-6 relative z-10 max-w-6xl mx-auto">
                {/* Feature 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-20 border-b border-white/5">
                    <FadeIn>
                        <div className="font-['Syne'] text-[80px] font-extrabold text-violet-500/5 leading-none mb-[-15px] -ml-2 tracking-tighter">01</div>
                        <div className="inline-flex py-1.5 px-4 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[11px] font-bold uppercase tracking-widest mb-6">Criação de Conteúdo</div>
                        <h3 className="font-['Syne'] text-4xl font-extrabold leading-[1.1] mb-5 tracking-tight">Posts cinematográficos.<br />Em menos de 1 minuto.</h3>
                        <p className="text-white/40 leading-relaxed mb-8 font-light text-lg">8 estilos de estáticos com design editorial de alto nível — personalizáveis e otimizados com IA. O visual que antes custava agência, agora está a um clique.</p>
                        <ul className="space-y-4">
                            {[
                                '8 estilos virais com identidade visual premium',
                                'Personalização completa sem saber design',
                                'IA integrada para otimizar a copy do conteúdo',
                                'Resultado profissional, toda vez — sem erro'
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-white/60 font-light text-sm items-start">
                                    <ArrowRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </FadeIn>
                    <FadeIn delay={0.2} className="relative group">
                        <div className="absolute inset-0 bg-violet-500/5 rounded-[2rem] blur-xl group-hover:bg-violet-500/10 transition-colors" />
                        <div className="bg-[#0e0e14] border border-violet-500/10 rounded-[2rem] p-8 relative flex flex-col items-center justify-center min-h-[400px]">
                            <div className="absolute top-4 right-4 bg-violet-600 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase">8 estilos</div>
                            <div className="flex gap-2 w-full mb-8">
                                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            <div className="grid grid-cols-4 gap-3 w-full mb-10">
                                {['🎬', '📸', '🖼️', '✍️', '📊', '💬', '🎨', '⚡'].map((emoji, i) => (
                                    <motion.div key={i} whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }} className="aspect-square rounded-xl bg-gradient-to-br from-[#1a1a24] to-[#2a2a3a] border border-[#333348] flex items-center justify-center text-2xl cursor-pointer shadow-lg hover:shadow-violet-500/20 hover:border-violet-500/40 transition-all">{emoji}</motion.div>
                                ))}
                            </div>
                            <div className="text-center">
                                <div className="font-['Syne'] text-[60px] font-extrabold text-violet-400 leading-none mb-2 drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]">0:47</div>
                                <div className="text-sm text-white/40">tempo médio para criar um post</div>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                {/* Feature 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-20 border-b border-white/5">
                    <FadeIn delay={0.2} className="relative group order-2 md:order-1">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-[2rem] blur-xl group-hover:bg-blue-500/10 transition-colors" />
                        <div className="bg-[#0e0e14] border border-[#1a1a28] rounded-[2rem] p-8 relative flex flex-col justify-center min-h-[400px]">
                            <div className="space-y-3 mb-6">
                                <div className="bg-violet-500/10 border border-violet-500/20 text-violet-400 p-3 rounded-xl flex items-center gap-3 text-sm font-medium"><div className="w-5 h-5 rounded-md flex items-center justify-center bg-violet-600/20">📂</div> Conteúdo — Novembro</div>
                                <div className="border border-[#1a1a28] text-white/50 p-3 rounded-xl flex items-center gap-3 text-sm"><div className="w-5 h-5 flex items-center justify-center">📂</div> Ideias Soltas</div>
                            </div>
                            <div className="space-y-2 pl-4 border-l border-[#1a1a28] ml-2">
                                <div className="flex items-center gap-3 text-sm text-white/60 bg-white/[0.02] p-2.5 rounded-lg"><div className="w-4 h-4 rounded break-all bg-violet-600 flex items-center justify-center text-black text-[10px]">✓</div> Post sobre posicionamento de preço</div>
                                <div className="flex items-center gap-3 text-sm text-white/60 bg-white/[0.02] p-2.5 rounded-lg"><div className="w-4 h-4 rounded break-all bg-violet-600 flex items-center justify-center text-black text-[10px]">✓</div> Carrossel: 5 erros de quem começa</div>
                                <div className="flex items-center gap-3 text-sm text-white/40 bg-white/[0.02] p-2.5 rounded-lg"><div className="w-4 h-4 rounded border border-[#333348] mix-blend-screen" /> Bastidores do lançamento</div>
                            </div>
                        </div>
                    </FadeIn>
                    <FadeIn className="order-1 md:order-2">
                        <div className="font-['Syne'] text-[80px] font-extrabold text-violet-500/5 leading-none mb-[-15px] -ml-2 tracking-tighter">02</div>
                        <div className="inline-flex py-1.5 px-4 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[11px] font-bold uppercase tracking-widest mb-6">Banco de Ideias</div>
                        <h3 className="font-['Syne'] text-4xl font-extrabold leading-[1.1] mb-5 tracking-tight">Sua mente organizada.<br />Suas ideias salvas.</h3>
                        <p className="text-white/40 leading-relaxed mb-8 font-light text-lg">Um espaço inteligente onde você captura, organiza e desenvolve cada ideia — com pastas, checklists, referências e status. No plano Anual, a IA transforma sua ideia crua em pauta completa.</p>
                        <ul className="space-y-4">
                            {[
                                'Organização em pastas por tema, nicho ou campanha',
                                'Checklist para não deixar nada para trás',
                                'Referências visuais e de copy em um só lugar'
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-white/60 font-light text-sm items-start">
                                    <ArrowRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                            <li className="flex gap-3 text-violet-400 font-medium text-sm items-start">
                                <Star className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" />
                                <span>IA que expande sua ideia com repertório (Anual)</span>
                            </li>
                        </ul>
                    </FadeIn>
                </div>

                {/* Feature 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-20 border-b border-white/5">
                    <FadeIn>
                        <div className="font-['Syne'] text-[80px] font-extrabold text-violet-500/5 leading-none mb-[-15px] -ml-2 tracking-tighter">03</div>
                        <div className="inline-flex py-1.5 px-4 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[11px] font-bold uppercase tracking-widest mb-6">Planner Visual</div>
                        <h3 className="font-['Syne'] text-4xl font-extrabold leading-[1.1] mb-5 tracking-tight">Um mês de conteúdo<br />planejado em uma tarde.</h3>
                        <p className="text-white/40 leading-relaxed mb-8 font-light text-lg">Visualize todo o seu calendário editorial em um olhar. Organize, mova, marque como feito e salve os posts prontos direto no planner — chega de correria no dia da publicação.</p>
                        <ul className="space-y-4">
                            {[
                                'Calendário editorial visual e intuitivo',
                                'Publicações de todas as redes em um só lugar',
                                'Posts salvos e prontos para publicar',
                                'Marcação de status: planejado, criado, publicado'
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-white/60 font-light text-sm items-start">
                                    <ArrowRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </FadeIn>
                    <FadeIn delay={0.2} className="relative group">
                        <div className="absolute inset-0 bg-emerald-500/5 rounded-[2rem] blur-xl group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="bg-[#0e0e14] border border-[#1a1a28] rounded-[2rem] p-8 relative flex flex-col justify-center min-h-[400px]">
                            <div className="flex justify-between items-center text-sm font-bold text-white/60 mb-6 font-['Syne'] uppercase tracking-widest">
                                <span>◀</span>
                                <span>Novembro 2025</span>
                                <span>▶</span>
                            </div>
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-center text-[10px] text-white/30">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {[...Array(30)].map((_, i) => {
                                    const day = i + 1;
                                    let style = "bg-white/[0.02] text-white/30";
                                    if ([3, 10, 17, 24].includes(day)) style = "bg-violet-600 text-black font-extrabold shadow-[0_0_10px_rgba(139,92,246,0.3)]";
                                    else if ([5, 12, 19, 26].includes(day)) style = "bg-violet-500/10 text-violet-400 border border-violet-500/20";
                                    return (
                                        <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-xs ${style}`}>
                                            {day}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-32 px-6 relative z-10 bg-[#040406] border-b border-[#1a1a28] overflow-visible">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,rgba(139,92,246,0.06)_0%,transparent_70%)] pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <FadeIn>
                            <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[11px] font-bold uppercase tracking-widest mb-6"><Sparkles className="w-3 h-3" /> Investimento</div>
                            <h2 className="font-['Syne'] text-4xl md:text-[56px] font-extrabold mb-6 tracking-tight">Um valor surreal pelo<br/><i className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-normal">ecossistema completo.</i></h2>
                            <p className="text-lg text-white/50 mb-2 font-light max-w-2xl mx-auto">Não bloqueamos funcionalidades essenciais. Escolha apenas o tempo de acesso.</p>
                            <p className="text-sm text-white/30">Acesso imediato após o pagamento. Sem contrato. Cancele quando quiser.</p>
                        </FadeIn>
                    </div>

                    <div className="flex flex-col lg:flex-row items-stretch justify-center gap-6 lg:gap-8 max-w-6xl mx-auto px-4 lg:px-0">
                        {/* Mensal */}
                        <FadeIn delay={0.1} className="flex-1 max-w-[360px] mx-auto w-full mt-4">
                            <div className="bg-[#09090e] p-10 flex flex-col relative h-full rounded-[2rem] border border-white/[0.08] hover:border-white/20 transition-all duration-500 group shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-[2rem] pointer-events-none" />
                                <div className="text-xs font-bold text-white/40 uppercase tracking-[0.25em] mb-4">Mensal</div>
                                <div className="font-['Syne'] text-[52px] font-extrabold mb-2 leading-none flex items-start gap-1 text-white">
                                    <span className="text-xl mt-2 tracking-normal text-white/40 font-medium">R$</span>49
                                </div>
                                <div className="text-sm text-white/40 font-medium mb-8 h-5">O plano base para começar</div>
                                <hr className="border-white/[0.08] mb-8" />
                                <ul className="space-y-5 mb-10 flex-1 relative z-10">
                                    {[
                                        'Blent Boost — 8 estilos virais',
                                        'Personalização completa',
                                        'IA para otimizar a copy',
                                        'Banco de Ideias completo',
                                        'Planner editorial visual'
                                    ].map((ft, i) => (
                                        <li key={i} className="flex gap-4 text-white/70 text-[14px] items-start font-light">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-white/20 transition-colors">
                                                <Check className="w-3 h-3 text-white/60" />
                                            </div>
                                            <span>{ft}</span>
                                        </li>
                                    ))}
                                </ul>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onGoToSignup} className="relative z-10 w-full py-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-bold transition-all mt-auto">Começar no Mensal</motion.button>
                            </div>
                        </FadeIn>

                        {/* Trimestral */}
                        <FadeIn delay={0.2} className="flex-1 max-w-[400px] mx-auto w-full relative z-20 lg:-mt-6 lg:mb-2">
                            {/* Outer Glow */}
                            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/30 to-purple-600/5 blur-3xl -z-10 rounded-[2rem] opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <motion.div whileHover={{ y: -8 }} className="bg-[#0b0b14] p-10 flex flex-col relative h-full rounded-[2rem] border border-violet-500/40 hover:border-violet-400/60 shadow-[0_20px_60px_rgba(139,92,246,0.15)] hover:shadow-[0_30px_80px_rgba(139,92,246,0.25)] transition-all duration-500 group object-visible">
                                {/* Inner Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.08] to-transparent rounded-[2rem] pointer-events-none" />
                                
                                {/* Animated Top Line */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-80 rounded-t-[2rem]" />
                                
                                {/* Badge - Positioned outside overflow */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 bg-[#0a0a14] border border-violet-500/50 text-violet-300 text-[10px] uppercase tracking-[0.2em] font-black px-5 py-2 rounded-full whitespace-nowrap shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                    Mais popular
                                </div>
                                
                                <div className="text-xs font-bold text-violet-400 uppercase tracking-[0.25em] mb-4 mt-2">Trimestral</div>
                                <div className="font-['Syne'] text-[60px] font-extrabold mb-2 leading-none flex items-start gap-1 text-white drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                                    <span className="text-xl mt-3 tracking-normal text-violet-400 font-medium">R$</span>129<span className="text-xl mt-3 tracking-normal text-white/40">,90</span>
                                </div>
                                <div className="text-xs text-violet-300 font-medium mb-8 bg-violet-500/10 w-fit px-3 py-1.5 rounded-lg border border-violet-500/20 shadow-inner">Equivale a R$43/mês — 12% OFF</div>
                                <hr className="border-violet-500/20 mb-8" />
                                <ul className="space-y-5 mb-10 flex-1 relative z-10">
                                    {[
                                        'Blent Boost — 8 estilos virais',
                                        'Personalização completa',
                                        'IA para otimizar a copy',
                                        'Banco de Ideias completo',
                                        'Planner editorial visual'
                                    ].map((ft, i) => (
                                        <li key={i} className="flex gap-4 text-white text-[14px] items-start font-medium leading-relaxed">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-400/40 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                                                <Check className="w-3 h-3 text-violet-300" />
                                            </div>
                                            <span>{ft}</span>
                                        </li>
                                    ))}
                                </ul>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onGoToSignup} className="relative z-10 w-full py-5 rounded-xl bg-violet-600 font-bold shadow-[0_10px_30px_rgba(139,92,246,0.4)] hover:shadow-[0_15px_40px_rgba(139,92,246,0.6)] transition-all overflow-hidden border border-violet-400/50 group/btn mt-auto text-white">
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-100" />
                                    <span className="relative z-10 flex items-center justify-center gap-2 text-base">Assinar Trimestral <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" /></span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] skew-x-12" />
                                </motion.button>
                            </motion.div>
                        </FadeIn>

                        {/* Anual */}
                        <FadeIn delay={0.3} className="flex-1 max-w-[360px] mx-auto w-full mt-4">
                            <div className="bg-[#09090e] p-10 flex flex-col relative h-full rounded-[2rem] border border-white/[0.08] hover:border-white/20 transition-all duration-500 group shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-[2rem] pointer-events-none" />
                                <div className="text-xs font-bold text-white/40 uppercase tracking-[0.25em] mb-4">Anual</div>
                                <div className="font-['Syne'] text-[52px] font-extrabold mb-2 leading-none flex items-start gap-1 text-white">
                                    <span className="text-xl mt-2 tracking-normal text-white/40 font-medium">R$</span>497<span className="text-xl mt-2 tracking-normal text-white/40">,90</span>
                                </div>
                                <div className="text-xs text-white/60 font-medium mb-8 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10">Economia de 15% (R$41/mês)</div>
                                <hr className="border-white/[0.08] mb-8" />
                                <ul className="space-y-5 mb-10 flex-1 relative z-10">
                                    {[
                                        'Blent Boost — 8 estilos virais',
                                        'Personalização completa',
                                        'IA para otimizar a copy',
                                        'Banco de Ideias completo',
                                        'Planner editorial visual'
                                    ].map((ft, i) => (
                                        <li key={i} className="flex gap-4 text-white/70 text-[14px] items-start font-light">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-white/20 transition-colors">
                                                <Check className="w-3 h-3 text-white/60" />
                                            </div>
                                            <span>{ft}</span>
                                        </li>
                                    ))}
                                    <li className="flex gap-4 text-violet-300 text-[14px] items-start font-medium mt-6 pt-5 border-t border-white/[0.08]">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-400/30">
                                            <Star className="w-3 h-3 text-violet-400" fill="currentColor" />
                                        </div>
                                        <span>IA expande ideia em pauta completa no Banco</span>
                                    </li>
                                </ul>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onGoToSignup} className="relative z-10 w-full py-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-bold transition-all flex items-center justify-center gap-2 mt-auto">Assinar Anual (IA) <Star className="w-4 h-4 text-violet-400" fill="currentColor" /></motion.button>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section >

            {/* Testimonials */}
            < section className="py-32 px-6 relative z-10" >
                <div className="max-w-6xl mx-auto">
                    <FadeIn><h2 className="font-['Syne'] text-4xl md:text-5xl font-extrabold text-center mb-16">O que criadores dizem <br />depois de usar</h2></FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { text: '"Eu perdia fácil 3 horas por semana só montando post no Canva. Hoje faço o mesmo em 15 minutos e o resultado ficou muito mais bonito. Minhas histórias aumentaram de engajamento."', name: 'Ana Carolina M.', role: 'Nutricionista · 12k seguidores', av: '👩' },
                            { text: '"Gerencio o social de 5 clientes. O Banco de Ideias com o Planner mudou completamente minha organização. Agora entro segunda-feira sabendo exatamente o que criar pra semana."', name: 'Rafael S.', role: 'Social Media', av: '👨' },
                            { text: '"Sou advogado e não tenho tempo nem habilidade pra design. O Blent Boost foi a primeira ferramenta que não me fez sentir perdido. Em 40 segundos tenho um post incrivel."', name: 'Dr. Marcos T.', role: 'Advogado', av: '⚖️' }
                        ].map((t, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="bg-[#0e0e14] border border-[#1a1a28] p-8 rounded-2xl hover:border-violet-500/20 transition-colors h-full flex flex-col">
                                    <div className="flex gap-1 mb-6 text-violet-400 text-sm">★★★★★</div>
                                    <p className="text-white/60 font-light text-[15px] leading-[1.8] mb-8 flex-1">{t.text}</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a1a24] to-[#2a2a3a] border border-[#333348] flex items-center justify-center text-xl">{t.av}</div>
                                        <div>
                                            <div className="font-['Syne'] font-bold text-sm text-white">{t.name}</div>
                                            <div className="text-xs text-white/40">{t.role}</div>
                                        </div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section >

            {/* CTA Final */}
            < section className="py-32 px-6 text-center relative z-10 overflow-hidden" >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.07),transparent_60%)] pointer-events-none" />
                <FadeIn>
                    <h2 className="font-['Syne'] text-4xl md:text-[72px] font-extrabold leading-[1.03] tracking-tight mb-8">
                        Chega de postar quando dá.<br />
                        <i className="not-italic text-violet-400 font-normal">Comece a postar todo dia.</i>
                    </h2>
                    <p className="text-lg text-white/50 max-w-[520px] mx-auto mb-12 font-light">
                        Seu concorrente já está criando conteúdo. A diferença vai ser a qualidade — e a velocidade — dos seus.
                    </p>
                    <button onClick={onGoToSignup} className="px-12 py-5 rounded-2xl bg-violet-600 text-[#060608] text-lg font-bold shadow-[0_16px_40px_rgba(139,92,246,0.25)] hover:shadow-[0_24px_64px_rgba(139,92,246,0.4)] hover:-translate-y-1 transition-all group inline-flex items-center gap-3">
                        Criar minha conta agora
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex flex-wrap justify-center gap-8 mt-16">
                        {['🔒 Pagamento 100% seguro', '⚡ Acesso imediato', '🛡️ 7 dias de garantia', '🚫 Sem fidelidade'].map(txt => (
                            <div key={txt} className="text-sm text-white/40 font-medium">{txt}</div>
                        ))}
                    </div>
                </FadeIn>
            </section >

            {/* Footer */}
            < footer className="py-10 border-t border-[#1a1a28] px-6 relative z-10 bg-[#06060f]" >
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-xl tracking-tight text-white">Blent<span className="text-violet-400">Boost</span></span>
                    </div>
                    <div className="text-xs text-white/40 font-medium">© 2025 Blent Assessoria. Todos os direitos reservados.</div>
                    <div className="text-xs text-white/40 font-medium hover:text-white transition-colors cursor-pointer">Termos de Uso · Política de Privacidade</div>
                </div>
            </footer >
        </div >
    );
}
