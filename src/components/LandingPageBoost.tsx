import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
    Zap, Sparkles, Target, Brain, ArrowRight, Star,
    Users, Menu, X, CheckCircle2,
    Cpu, Layers, Mic2, Wand2, MessageSquare,
    ChevronDown, TrendingUp, Clock, Shield, Image as ImageIcon,
    BarChart2, BookOpen, Calendar, Lightbulb, Play, Award,
    Flame, Eye, Lock, Infinity as InfinityIcon
} from 'lucide-react';

interface LandingPageProps {
    onGoToLogin: () => void;
    onGoToSignup: () => void;
}

// PPPPPPPPPPPPPPPPPPPPPPP
// DATA
// PPPPPPPPPPPPPPPPPPPPPPP

const STATS = [
    { value: '10.000+', label: 'Criadores ativos' },
    { value: '2.4M+', label: 'Posts gerados' },
    { value: '4.9', label: 'Avaliação média' },
    { value: '87h/mês', label: 'Economizadas por usuário' },
];

const PROBLEMS = [
    { icon: Clock, text: 'Você passa horas na frente da tela sem saber o que postar  e quando posta, o engajamento é zero.' },
    { icon: TrendingUp, text: 'Perfis menores crescem absurdamente enquanto o seu estagna. A diferença? Eles têm a ferramenta certa.' },
    { icon: Brain, text: 'Você tem conteúdo de valor na cabeça, mas falta o design, o copy e o gancho para fazer seu público parar o scroll.' },
];

const STEPS = [
    {
        n: '01', icon: Sparkles,
        title: 'Descreva a sua ideia',
        desc: 'Uma frase é suficiente. A IA analisa o seu nicho, seu público e o algoritmo atual para criar o conteúdo perfeito.',
        color: 'from-violet-500 to-purple-600',
    },
    {
        n: '02', icon: ImageIcon,
        title: 'Escolha o visual e formato',
        desc: 'Carrossel, post estático, roteiro, anúncio. Templates cinematográficos validados para maximizar o alcance e as vendas.',
        color: 'from-fuchsia-500 to-pink-600',
    },
    {
        n: '03', icon: Zap,
        title: 'Publique e escale',
        desc: 'Exporte em HD, copie a legenda magnética e publique. Em 15 minutos você tem conteúdo que agências cobram dias para entregar.',
        color: 'from-emerald-500 to-teal-600',
    },
];

const FEATURES = [
    {
        icon: Wand2,
        tag: 'Blent Post',
        title: 'Posts que travam o scroll',
        desc: 'Templates validados pelo algoritmo do Instagram. A IA gera texto, escolhe cores, tipografia e cria imagens de fundo exclusivas  em segundos, com qualidade de agência.',
        color: 'text-violet-400', border: 'border-violet-500/25', bg: 'bg-violet-500/8', badge: '=% Mais Usado',
        features: ['5+ estilos de template', 'Geração de imagem IA', 'Exportação 4K PNG/PDF'],
    },
    {
        icon: Target,
        tag: 'Audience Insights',
        title: 'Leia a mente do seu avatar',
        desc: 'Mapeamento psicológico profundo: medos, desejos, objeções e gatilhos de compra. Crie conteúdo que faz as pessoas dizerem "esse post foi feito pra mim".',
        color: 'text-blue-400', border: 'border-blue-500/25', bg: 'bg-blue-500/8', badge: '>à Estratégico',
        features: ['Perfil psicológico do buyer', 'Perguntas para Stories', 'Níveis de consciência'],
    },
    {
        icon: Mic2,
        tag: 'Storytelling Magnético',
        title: 'Roteiros que prendem até o fim',
        desc: 'Jornada do herói, AIDA, PAS  os frameworks que a Netflix usa, agora no seu Instagram. Scripts que criam conexão emocional e empurram para a compra.',
        color: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/8', badge: '<¬ Conexão',
        features: ['Hooks emocionais', 'Arcos narrativos validados', 'CTAs de alta conversão'],
    },
    {
        icon: Cpu,
        tag: 'Roteirista de Anúncios',
        title: 'Anúncios que pagam de volta',
        desc: '2 linhas de briefing. 4 variações de copy com hooks agressivos e CTAs impossíveis de ignorar para Meta Ads  feitas para disparar o ROAS das suas campanhas.',
        color: 'text-orange-400', border: 'border-orange-500/25', bg: 'bg-orange-500/8', badge: '=È ROI',
        features: ['Hooks anti-scroll', 'CTAs de conversão', 'Variações A/B prontas'],
    },
    {
        icon: Lightbulb,
        tag: 'Banco de Ideias',
        title: 'Nunca mais trave diante da tela',
        desc: 'Pauta infinita de conteúdo gerada pela IA com base no seu nicho. Tendências em tempo real. Organize, expanda e transforme cada ideia em post com um clique.',
        color: 'text-yellow-400', border: 'border-yellow-500/25', bg: 'bg-yellow-500/8', badge: '=¡ Criatividade',
        features: ['Tendências em tempo real', 'Expansão de ideias com IA', 'Acervo organizado'],
    },
    {
        icon: Calendar,
        tag: 'Smart Planner',
        title: 'Calendário editorial inteligente',
        desc: 'Organize toda a sua semana ou mês de postagens em um calendário visual. Frequência impecável, sem esforço, sem sumiços que o algoritmo pune.',
        color: 'text-pink-400', border: 'border-pink-500/25', bg: 'bg-pink-500/8', badge: '=Å Beta',
        features: ['Visão semanal e mensal', 'Planejamento visual', 'Frequência consistente'],
    },
];

const TESTIMONIALS = [
    { name: 'Marina Souza', role: 'Coach de Emagrecimento', av: 'MS', avColor: 'from-violet-500 to-purple-600', text: 'Substituiu minha agência de R$2.500/mês. Crio conteúdo para 30 dias em uma única tarde. Minhas vendas via direct triplicaram em 60 dias.', result: '+312% engajamento', stars: 5 },
    { name: 'Rafael Torres', role: 'Mentor Digital', av: 'RT', avColor: 'from-blue-500 to-cyan-600', text: 'A IA de Insights parece magia negra. Os posts tocam exatamente nas dores que meus alunos relatam nas mentorias. O ROAS explodiu.', result: 'ROAS +40%', stars: 5 },
    { name: 'Camila Freitas', role: 'Nutricionista', av: 'CF', avColor: 'from-emerald-500 to-teal-600', text: 'Saí de 2.000 para 18.000 seguidores em 3 meses. A consistência que o Blent Boost permite  sem me deixar exausta  foi a chave.', result: '+16K seguidores', stars: 5 },
    { name: 'Lucas Mendes', role: 'E-commerce de Moda', av: 'LM', avColor: 'from-orange-500 to-red-600', text: 'Usava 3 ferramentas diferentes. Agora uso só o Blent Boost. Economizo 20h por mês e meu faturamento com Instagram cresceu 200%.', result: '+200% faturamento', stars: 5 },
];

const PLANS = [
    {
        id: 'monthly', name: 'Mensal', price: 'R$ 59,90', period: '/mês', billing: null,
        badge: null, highlight: false, color: 'border-white/10',
        cta: 'Começar Agora', checkoutUrl: 'https://buy.stripe.com/eVa4i29N2bA89G83cc',
        features: ['Todas as ferramentas de IA', 'Saldo mensal de operações', 'Blent Post com IA', 'Roteirista & Storytelling', 'Insights de Audiência', 'Banco de Ideias'],
    },
    {
        id: 'quarterly', name: 'Trimestral', price: 'R$ 55,00', period: '/mês', billing: 'cobrado R$ 165,00 a cada 3 meses',
        badge: 'P Mais Escolhido', highlight: true, color: 'border-violet-500/50',
        cta: 'Escolher Trimestral', checkoutUrl: 'https://buy.stripe.com/5kA7ue8J22Zw9G8cMN',
        features: ['Tudo do plano Mensal', 'Renovação mensal do saldo', 'Economia de R$ 14,70/mês', 'Suporte prioritário', 'Acesso a novidades em beta'],
    },
    {
        id: 'annual', name: 'Anual', price: 'R$ 52,00', period: '/mês', billing: 'cobrado R$ 624,00 por ano',
        badge: '=% Melhor Retorno', highlight: false, color: 'border-amber-500/30',
        cta: 'Quero o Anual', checkoutUrl: 'https://buy.stripe.com/9AQbKu7EYbA84lO5km',
        features: ['Tudo do Trimestral', 'Renovação mensal do saldo', 'Economia de R$ 95,80/ano', 'Acesso vitalício às atualizações', '1h de consultoria inclusa'],
    },
];

const FAQ = [
    { q: 'Preciso entender de design ou IA para usar?', a: 'Absolutamente zero. A plataforma foi projetada para ser tão simples que você digita o tema, escolhe o layout e está pronto. O design já vem calibrado em padrões estéticos de altíssima conversão. Nenhum conhecimento técnico necessário.' },
    { q: 'O Blent Boost posta automaticamente nas redes sociais?', a: 'Não somos agendadores  focamos 100% na parte mais difícil e mais valiosa: a CRIAÇÃO. Você baixa o material em alta resolução e publica onde e quando quiser. Integra perfeitamente com Meta Business, Later e Buffer.' },
    { q: 'O que são os saldos e como funcionam?', a: 'Cada plano inclui um saldo generoso de operações de IA que renova automaticamente a cada ciclo. Funcionalidades como o Banco de Ideias e o Planejador são ilimitadas. O saldo é consumido em ações mais pesadas como geração de imagem e exportação.' },
    { q: 'Posso usar minhas próprias cores e identidade visual?', a: 'Sim! Você configura seu perfil uma vez: foto, arroba, cores e fonte da marca. Todos os materiais gerados saem com a identidade visual da sua marca aplicada automaticamente.' },
    { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multas, sem letras miúdas. Um clique e o cancelamento é feito. Você continua com acesso até o fim do período pago. É tão simples quanto assinar.' },
];

// PPPPPPPPPPPPPPPPPPPPPPP
// MICRO-COMPONENTS
// PPPPPPPPPPPPPPPPPPPPPPP

const FadeIn = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
            {children}
        </motion.div>
    );
};

const Pill = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-black uppercase tracking-[0.2em] mb-6 ${className}`}>
        <Sparkles className="w-3 h-3" />{children}
    </div>
);

const Stars = () => (
    <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
    </div>
);

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-violet-500/30 bg-violet-500/5' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'}`}>
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
                <span className="font-bold text-white text-sm sm:text-base">{q}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="shrink-0">
                    <ChevronDown className="w-5 h-5 text-white/40" />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <p className="px-6 pb-6 text-sm text-white/55 leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Animated counter hook
function useCounter(target: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, target, duration]);
    return { count, ref };
}

// PPPPPPPPPPPPPPPPPPPPPPP
// MAIN COMPONENT
// PPPPPPPPPPPPPPPPPPPPPPP

export function LandingPage({ onGoToLogin, onGoToSignup }: LandingPageProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);

    useEffect(() => {
        const h = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    // Auto-rotate feature highlight
    useEffect(() => {
        const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 4000);
        return () => clearInterval(t);
    }, []);

    const navScrolled = scrollY > 60;

    return (
        <div className="min-h-screen bg-[#06060f] text-white overflow-x-hidden font-sans selection:bg-violet-500/30">

            {/*    GLOBAL AMBIENT         */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1300px] h-[800px] rounded-full bg-violet-700/30 blur-[180px]" />
                <div className="absolute top-[60%] right-[-20%] w-[700px] h-[700px] rounded-full bg-purple-900/20 blur-[200px]" />
                <div className="absolute top-[80%] left-[-15%] w-[600px] h-[600px] rounded-full bg-blue-900/15 blur-[160px]" />
                <div className="absolute inset-0 opacity-[0.022]"
                    style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
            </div>

            {/*    NAV         */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'bg-[#06060f]/90 backdrop-blur-2xl border-b border-white/[0.05] shadow-2xl shadow-black/70' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2.5 cursor-pointer z-50" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30 relative overflow-hidden">
                            <Zap className="w-4 h-4 text-white relative z-10" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="font-black text-xl tracking-tight">Blent<span className="text-violet-400">Boost</span></span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="hidden lg:flex items-center gap-7 bg-white/[0.04] border border-white/[0.06] px-8 py-3 rounded-full backdrop-blur-xl">
                        {[['#como-funciona', 'Como Funciona'], ['#recursos', 'Recursos'], ['#resultados', 'Resultados'], ['#planos', 'Planos']].map(([h, l]) => (
                            <a key={h} href={h} className="text-[13px] font-semibold text-white/50 hover:text-white transition-colors duration-200">{l}</a>
                        ))}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                        className="flex items-center gap-3 z-50">
                        <button onClick={onGoToLogin} className="hidden md:block text-[13px] font-semibold text-white/40 hover:text-white transition-colors px-4 py-2">Entrar</button>
                        <button onClick={onGoToSignup}
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-sm font-bold transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 active:scale-100">
                            Criar Minha Conta <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setMenuOpen(!menuOpen)}
                            className="lg:hidden p-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all">
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </motion.div>
                </div>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden absolute top-full left-0 right-0 bg-[#06060f]/98 backdrop-blur-2xl border-b border-white/[0.06] px-6 py-8 flex flex-col gap-5">
                            {[['#como-funciona', 'Como Funciona'], ['#recursos', 'Recursos'], ['#resultados', 'Resultados'], ['#planos', 'Planos']].map(([h, l]) => (
                                <a key={h} href={h} onClick={() => setMenuOpen(false)} className="text-base font-bold text-white/80 hover:text-white">{l}</a>
                            ))}
                            <div className="w-full h-px bg-white/[0.06] my-1" />
                            <button onClick={onGoToLogin} className="w-full py-4 rounded-xl border border-white/10 text-white font-bold">Já tenho conta</button>
                            <button onClick={onGoToSignup} className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold shadow-lg shadow-violet-500/20">Criar Minha Conta</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/*    HERO         */}
            <section className="relative min-h-[100svh] flex flex-col items-center justify-center pt-28 pb-20 px-5 z-10 text-center overflow-hidden">
                <motion.div animate={{ x: [-25, 25, -25], opacity: [0.25, 0.5, 0.25] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-[18%] left-[12%] w-72 h-72 rounded-full bg-fuchsia-700/20 blur-[120px] pointer-events-none" />
                <motion.div animate={{ x: [25, -25, 25], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute bottom-[12%] right-[8%] w-96 h-96 rounded-full bg-violet-800/20 blur-[130px] pointer-events-none" />

                {/* Badge */}
                <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-black tracking-[0.2em] uppercase mb-10 shadow-lg shadow-violet-500/10">
                    <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}>
                        <Sparkles className="w-3.5 h-3.5" />
                    </motion.span>
                    Plataforma All-in-One para Criadores de Conteúdo
                </motion.div>

                {/* Headline */}
                <div className="max-w-5xl mx-auto">
                    <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="text-[2.6rem] sm:text-6xl md:text-7xl lg:text-[5rem] font-black leading-[1.03] tracking-tight mb-8">
                        Seu conteúdo pronto{' '}
                        <span className="relative inline-block">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">em minutos.</span>
                            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                                transition={{ delay: 1.0, duration: 0.6, ease: 'easeOut' }}
                                className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 to-fuchsia-500 origin-left rounded-full" />
                        </span>
                        <br />
                        <span className="text-white">Viral todos os dias.</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.7 }}
                        className="text-lg sm:text-xl text-white/50 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
                        A única plataforma que une <strong className="text-white/80">Psicologia de Retenção</strong> com <strong className="text-white/80">Inteligência Artificial</strong> para transformar seguidores em clientes  sem agência, sem designer, sem horas perdidas.
                    </motion.p>

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <button onClick={onGoToSignup}
                            className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-lg font-black shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/65 hover:scale-105 active:scale-100 transition-all duration-300 overflow-hidden">
                            <span className="relative z-10">Quero Criar Conteúdo Agora</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <motion.div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                        <div className="flex items-center gap-2 text-sm text-white/40 font-medium">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            Acesso imediato · Cancele quando quiser
                        </div>
                    </motion.div>

                    {/* Social proof row */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
                        className="flex items-center justify-center gap-3 mb-12">
                        <div className="flex -space-x-3">
                            {['MS', 'RT', 'CF', 'LM', 'AK'].map((av, i) => (
                                <div key={i} className="w-9 h-9 rounded-full border-2 border-[#06060f] bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-black text-white">{av}</div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="flex gap-0.5 mb-0.5">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-xs text-white/50 font-medium">+10.000 criadores usando agora</p>
                        </div>
                    </motion.div>
                </div>

                {/* Stats bar */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.7 }}
                    className="w-full max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {STATS.map((s) => (
                        <div key={s.label} className="text-center p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                            <p className="text-2xl font-black text-white mb-1">{s.value}</p>
                            <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Scroll indicator */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                        <ChevronDown className="w-6 h-6 text-white/20" />
                    </motion.div>
                </motion.div>
            </section>

            {/*    PROBLEM SECTION         */}
            <section className="relative py-24 px-5 z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <FadeIn>
                        <Pill>O problema que ninguém fala</Pill>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
                            Você sabe quanto está <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">perdendo hoje?</span>
                        </h2>
                        <p className="text-white/50 text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
                            Enquanto você gasta horas tentando criar um post que prenda atenção, perfis menores com a ferramenta certa crescem mais em 1 semana do que você em 6 meses.
                        </p>
                    </FadeIn>
                    <div className="grid gap-4 max-w-2xl mx-auto">
                        {PROBLEMS.map((p, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/[0.07] rounded-2xl text-left hover:border-red-500/25 hover:bg-red-500/5 transition-all duration-300 group">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                        <p.icon className="w-5 h-5 text-red-400" />
                                    </div>
                                    <p className="text-white/65 font-medium text-sm sm:text-base">{p.text}</p>
                                    <X className="w-4 h-4 text-red-500/60 ml-auto shrink-0 mt-0.5" />
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    {/* Bridge */}
                    <FadeIn delay={0.35}>
                        <div className="mt-16 p-8 bg-gradient-to-br from-violet-900/25 to-purple-900/15 border border-violet-500/20 rounded-3xl">
                            <p className="text-2xl sm:text-3xl font-black leading-tight mb-4">
                                E se você pudesse criar em <span className="text-violet-400">15 minutos</span>{' '}
                                o que uma agência demora <span className="text-fuchsia-400">dias para entregar?</span>
                            </p>
                            <p className="text-white/50 text-base max-w-xl mx-auto">É exatamente isso que o Blent Boost entrega. Todos os dias.</p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/*    HOW IT WORKS         */}
            <section id="como-funciona" className="relative py-24 px-5 z-10">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[900px] h-[500px] bg-violet-800/10 rounded-full blur-[160px]" />
                </div>
                <div className="max-w-6xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <Pill>Como funciona</Pill>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
                            De ideia a publicado{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">em 3 passos</span>
                        </h2>
                        <p className="text-white/50 text-lg max-w-xl mx-auto">Sem curva de aprendizado. Sem configurações. Só resultado.</p>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {STEPS.map((s, i) => (
                            <FadeIn key={i} delay={i * 0.12}>
                                <div className="relative p-8 bg-white/[0.02] border border-white/[0.07] rounded-3xl hover:border-white/15 transition-all duration-300 group h-full">
                                    <div className={`text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br ${s.color} opacity-25 leading-none mb-6 select-none group-hover:opacity-45 transition-opacity`}>{s.n}</div>
                                    {i < STEPS.length - 1 && (
                                        <div className="hidden md:block absolute top-12 right-0 translate-x-1/2 z-10">
                                            <ArrowRight className="w-5 h-5 text-white/15" />
                                        </div>
                                    )}
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-5 opacity-80`}>
                                        <s.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                                    <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                                    <div className={`absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-60 rounded-full transition-all duration-500`} />
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/*    FEATURES         */}
            <section id="recursos" className="relative py-24 px-5 z-10">
                <div className="max-w-6xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <Pill>Ferramentas</Pill>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
                            6 armas de IA para{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">dominar o algoritmo</span>
                        </h2>
                        <p className="text-white/50 text-lg max-w-xl mx-auto">
                            Um arsenal completo para cobrir cada etapa da sua produção de conteúdo.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {FEATURES.map((f, i) => (
                            <FadeIn key={i} delay={i * 0.07}>
                                <div
                                    className={`relative p-6 rounded-3xl border ${f.border} ${activeFeature === i ? 'bg-white/[0.04] scale-[1.02]' : 'bg-white/[0.02] hover:scale-[1.01]'} transition-all duration-500 group h-full flex flex-col cursor-pointer`}
                                    onClick={() => setActiveFeature(i)}
                                >
                                    {activeFeature === i && (
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                                    )}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className={`w-12 h-12 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center`}>
                                            <f.icon className={`w-6 h-6 ${f.color}`} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/40">{f.badge}</span>
                                    </div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${f.color} mb-2`}>{f.tag}</p>
                                    <h3 className="text-lg font-black text-white mb-3 leading-snug">{f.title}</h3>
                                    <p className="text-sm text-white/50 leading-relaxed flex-1 mb-5">{f.desc}</p>
                                    <div className="space-y-2">
                                        {f.features.map((feat, fi) => (
                                            <div key={fi} className="flex items-center gap-2 text-xs text-white/40">
                                                <CheckCircle2 className={`w-3.5 h-3.5 ${f.color} shrink-0`} />
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/*    INTERSTITIAL QUOTE         */}
            <section className="relative py-24 px-5 z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-purple-900/30 to-violet-900/20" />
                <div className="absolute inset-0 border-y border-violet-500/10" />
                {/* Animated orbs */}
                <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-0 left-[10%] w-40 h-40 bg-violet-500/20 rounded-full blur-[80px] pointer-events-none" />
                <motion.div animate={{ x: [0, -25, 0], y: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    className="absolute bottom-0 right-[10%] w-56 h-56 bg-fuchsia-500/15 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <FadeIn>
                        <div className="text-6xl text-violet-400/30 font-black mb-4">"</div>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight mb-8">
                            <span className="text-violet-400">Nunca mais</span> fiquei sem pauta.{' '}
                            <span className="text-white/50">Em 90 dias o Blent Boost me poupou</span>{' '}
                            <span className="text-fuchsia-400">mais de 200 horas</span>{' '}
                            <span className="text-white/50">e triplicou minhas vendas.</span>
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-black text-white text-lg shrink-0">M</div>
                            <div className="text-left">
                                <p className="font-bold text-white">Marina Souza</p>
                                <p className="text-sm text-white/40">Coach de Emagrecimento · +16K seguidores em 3 meses</p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/*    TESTIMONIALS         */}
            <section id="resultados" className="relative py-24 px-5 z-10">
                <div className="max-w-6xl mx-auto">
                    <FadeIn className="text-center mb-16">
                        <Pill>Resultados reais</Pill>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
                            O que eles dizem depois de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">30 dias</span>
                        </h2>
                    </FadeIn>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {TESTIMONIALS.map((t, i) => (
                            <FadeIn key={i} delay={i * 0.1}>
                                <div className="p-7 bg-white/[0.02] border border-white/[0.07] rounded-3xl hover:border-violet-500/20 hover:bg-violet-500/[0.03] transition-all duration-300 flex flex-col gap-5 h-full">
                                    <Stars />
                                    <p className="text-white/75 text-base leading-relaxed flex-1 italic">"{t.text}"</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avColor} flex items-center justify-center font-black text-white text-sm shrink-0`}>{t.av}</div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{t.name}</p>
                                                <p className="text-xs text-white/40">{t.role}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-black text-emerald-400 whitespace-nowrap">{t.result}</div>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/*    PRICING         */}
            <section id="planos" className="relative py-24 px-5 z-10">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[1000px] h-[600px] bg-violet-900/20 rounded-full blur-[220px]" />
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <FadeIn className="text-center mb-16">
                        <Pill>Planos</Pill>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-5">
                            Invista no que realmente{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">gera retorno</span>
                        </h2>
                        <p className="text-white/50 text-lg max-w-xl mx-auto">
                            Escolha o plano certo para o seu ritmo. Acesso imediato. Cancele quando quiser, sem burocracia.
                        </p>
                    </FadeIn>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        {PLANS.map((plan, i) => (
                            <FadeIn key={plan.id} delay={i * 0.1}>
                                <div className={`relative flex flex-col p-8 rounded-3xl border ${plan.color} ${plan.highlight ? 'bg-gradient-to-b from-violet-900/35 to-purple-900/20 shadow-2xl shadow-violet-500/25' : 'bg-white/[0.02]'} h-full`}>
                                    {plan.badge && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-700 rounded-full text-[11px] font-black text-white shadow-lg shadow-violet-500/30 whitespace-nowrap">{plan.badge}</div>
                                    )}
                                    {plan.highlight && (
                                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                                            <div className="absolute inset-[-1px] rounded-3xl">
                                                <div className="absolute inset-0 rounded-3xl border border-violet-500/50" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="mb-6 pt-2">
                                        <p className="text-[11px] uppercase tracking-widest font-black text-white/40 mb-3">{plan.name}</p>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-5xl font-black text-white">{plan.price}</span>
                                            <span className="text-lg font-semibold text-white/40 mb-1">{plan.period}</span>
                                        </div>
                                        {plan.billing && <p className="text-xs text-white/30 font-medium mt-1">{plan.billing}</p>}
                                    </div>
                                    <ul className="space-y-3 flex-1 mb-8">
                                        {plan.features.map((feat, fi) => (
                                            <li key={fi} className="flex items-start gap-3 text-sm text-white/60">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <a href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer"
                                        className={`w-full py-4 rounded-2xl font-black text-sm text-center transition-all duration-300 block ${plan.highlight
                                            ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]'
                                            : 'bg-white/[0.06] text-white hover:bg-white/10 border border-white/10'
                                            }`}>
                                        {plan.cta}
                                    </a>
                                </div>
                            </FadeIn>
                        ))}
                    </div>

                    <FadeIn delay={0.3}>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/35 font-medium">
                            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" />Pagamento seguro via Stripe</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Cancele quando quiser</span>
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" />Acesso imediato ao assinar</span>
                            <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-400" />Dados 100% protegidos</span>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/*    FAQ         */}
            <section className="relative py-24 px-5 z-10">
                <div className="max-w-3xl mx-auto">
                    <FadeIn className="text-center mb-12">
                        <Pill>Dúvidas frequentes</Pill>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Tem alguma dúvida?</h2>
                    </FadeIn>
                    <div className="space-y-3">
                        {FAQ.map((f, i) => <FadeIn key={i} delay={i * 0.08}><FaqItem q={f.q} a={f.a} /></FadeIn>)}
                    </div>
                </div>
            </section>

            {/*    FINAL CTA         */}
            <section className="relative py-32 px-5 z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-900/20 to-transparent" />
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[800px] h-[500px] bg-violet-700/25 rounded-full blur-[200px]" />
                </motion.div>

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <FadeIn>
                        <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                            className="inline-block mb-6">
                            <Flame className="w-12 h-12 text-orange-400" />
                        </motion.div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                            O seu conteúdo vai{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">explodir</span>{' '}
                             ou você vai ficar assistindo.
                        </h2>
                        <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                            Cada dia que você passa sem o Blent Boost é um dia que seus concorrentes estão crescendo com a ferramenta que você ainda não tem.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={onGoToSignup}
                                className="group relative flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-xl font-black shadow-2xl shadow-violet-500/50 hover:shadow-violet-500/75 hover:scale-105 active:scale-100 transition-all duration-300 overflow-hidden">
                                <span className="relative z-10">Começar Agora</span>
                                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                                <motion.div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                            <button onClick={onGoToLogin} className="text-white/40 hover:text-white transition-colors text-sm font-semibold">
                                Já tenho uma conta
                            </button>
                        </div>
                        <p className="mt-6 text-xs text-white/25 font-medium">Acesso imediato · Sem contrato · Cancele quando quiser</p>
                    </FadeIn>
                </div>
            </section>

            {/*    FOOTER         */}
            <footer className="relative z-10 border-t border-white/[0.05] py-10 px-5">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-lg tracking-tight">Blent<span className="text-violet-400">Boost</span></span>
                    </div>
                    <p className="text-sm text-white/25">© 2026 Blent Boost. O seu marketing em outro nível.</p>
                    <div className="flex items-center gap-5 text-xs text-white/25">
                        <a href="#" className="hover:text-white/60 transition-colors">Privacidade</a>
                        <a href="#" className="hover:text-white/60 transition-colors">Termos</a>
                        <button onClick={onGoToLogin} className="hover:text-white/60 transition-colors">Entrar</button>
                    </div>
                </div>
            </footer>

            {/*    MOBILE STICKY CTA         */}
            <AnimatePresence>
                {scrollY > 400 && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden p-4 bg-[#06060f]/95 backdrop-blur-xl border-t border-white/[0.07]">
                        <button onClick={onGoToSignup}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-base shadow-xl shadow-violet-500/30">
                            Criar Minha Conta  Agora
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
