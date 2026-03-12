import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, Rocket, Video, BookOpen, LayoutGrid, Zap, PlayCircle, Image as ImageIcon, Target, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_VERSION } from '../config/appVersion';

interface TutorialTab {
    id: string;
    label: string;
    icon: React.ElementType;
}

const TABS: TutorialTab[] = [
    { id: 'intro', label: 'Introdução', icon: GraduationCap },
    { id: 'remix', label: 'Blent Boost (Remix)', icon: Sparkles },
    { id: 'strategy', label: 'Estratégia & Ideias', icon: Rocket },
    { id: 'copy', label: 'Roteiros & Copy', icon: BookOpen },
];

export function TutorialPage() {
    const [activeTab, setActiveTab] = useState('intro');

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="mb-8 md:mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold mb-4">
                    <GraduationCap className="w-4 h-4" />
                    Central de Aprendizado
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    Domine a Plataforma <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">{APP_VERSION === 'Blent' ? 'Blent' : 'Blent Boost'}</span>
                </h1>
                <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
                    Aprenda a utilizar todas as ferramentas disponíveis para maximizar sua criação de conteúdo, gerar mais engajamento e escalar seus resultados.
                </p>
            </div>

            {/* Navigation */}
            <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-8 pb-2">
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border shrink-0",
                                isActive 
                                    ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20" 
                                    : "bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.06]"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 md:p-10 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                <AnimatePresence mode="wait">
                    {activeTab === 'intro' && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12 relative z-10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-2xl font-black mb-4">Bem-vindo(a) ao seu novo motor de criação.</h2>
                                    <p className="text-white/60 leading-relaxed mb-6">
                                        Nossa plataforma foi desenhada para eliminar o bloqueio criativo e acelerar sua produção visual e textual. Aqui você encontra ferramentas movidas a IA para gerar designs, roteiros, ideias e insights valiosos em segundos.
                                    </p>
                                    <div className="space-y-4">
                                        <FeatureItem icon={Zap} title="Fluxo de Trabalho Ultrarrápido" desc="Gere um post completo com design e legenda em menos de 1 minuto." />
                                        <FeatureItem icon={LayoutGrid} title="Ferramentas Integradas" desc="Tudo que você precisa em um só lugar: do planejamento estratégico à exportação final." />
                                        <FeatureItem icon={Target} title="Foco em Conversão" desc="Roteiros e templates desenhados especificamente para vender mais na internet." />
                                    </div>
                                </div>
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#14141e] flex items-center justify-center p-8 group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
                                    <div className="w-full h-full border border-white/5 bg-white/[0.02] rounded-xl flex flex-col overflow-hidden shadow-2xl">
                                        <div className="h-8 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                        </div>
                                        <div className="flex-1 p-4 flex gap-4">
                                            <div className="w-16 rounded-lg bg-white/5" />
                                            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
                                                <div className="bg-violet-500/20 rounded-lg border border-violet-500/30" />
                                                <div className="bg-white/5 rounded-lg border border-white/5" />
                                                <div className="bg-white/5 rounded-lg border border-white/5 col-span-2" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer">
                                        <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                                            <PlayCircle className="w-8 h-8 text-white ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'remix' && (
                        <motion.div
                            key="remix"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12 relative z-10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="order-2 lg:order-1 relative aspect-square md:aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#14141e] flex items-center justify-center">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10" />
                                    <div className="relative w-3/4 h-3/4 bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
                                            <h1 className="text-4xl font-black text-white relative z-10 text-center uppercase tracking-tighter">Impacto Visual</h1>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 right-6 flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shadow-lg"><Sparkles className="w-4 h-4 text-white" /></div>
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md"><ImageIcon className="w-4 h-4 text-white" /></div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <h2 className="text-2xl font-black mb-4">Blent Boost (Remix)</h2>
                                    <p className="text-white/60 leading-relaxed mb-6">
                                        O coração da plataforma. Crie carrosséis e posts estáticos impressionantes sem precisar de conhecimentos em design. Nossa ferramenta ajusta o layout automaticamente.
                                    </p>
                                    <div className="space-y-6">
                                        <StepItem number="1" title="Escolha o Template" desc="Selecione entre opções como Tweet, Citação, Minimal, Editorial, entre outros, na aba de Visual & Design." />
                                        <StepItem number="2" title="Insira seu Conteúdo" desc="Na aba 'Conteúdo & Mídia', adicione os slides, títulos e descrições. Você pode usar a IA para sugerir textos ou imagens de fundo de alta qualidade." />
                                        <StepItem number="3" title="Personalize as Cores" desc="Defina sua paleta da marca: cor de fundo, texto e destaque. Use a sintaxe [[palavra]] no título para destacar partes essenciais com a cor de acento." />
                                        <StepItem number="4" title="Exporte ou Salve" desc="Gere legendas automáticas prontas para o Instagram e baixe em alta resolução (PNG, JPEG ou PDF slide-a-slide)." />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'strategy' && (
                        <motion.div
                            key="strategy"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12 relative z-10"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-2xl font-black mb-4">Estratégia & Ideias</h2>
                                    <p className="text-white/60 leading-relaxed mb-6">
                                        Nunca mais fique sem saber o que postar. As ferramentas de estratégia geram um calendário editorial e banco de ideias focado em engajamento, autoridade e conversão.
                                    </p>
                                    <div className="space-y-4">
                                        <FeatureItem icon={Target} title="Audience Insights" desc="Descubra as dores, desejos e objeções do seu público. A IA cria o mapa mental do seu cliente ideal para você focar a comunicação." />
                                        <FeatureItem icon={Rocket} title="Gerador de Ideias" desc="Receba um plano completo de conteúdo baseado no seu nicho, com pilares bem definidos, temas semanais e ângulos de abordagem." />
                                        <FeatureItem icon={Lightbulb} title="Banco de Ideias" desc="Armazene, expanda verticalmente e reviva suas melhores ideias de conteúdo para usar nos momentos certos." />
                                    </div>
                                </div>
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#14141e] flex flex-col p-6">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-violet-500/10" />
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                                            <Lightbulb className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">Gerando Ideias Estratégicas...</div>
                                            <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                                                <div className="w-2/3 h-full bg-violet-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-3 relative z-10">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-12 bg-white/5 rounded-xl border border-white/5 flex items-center px-4 gap-3">
                                                <div className="w-2 h-2 rounded-full bg-violet-400" />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="h-2 bg-white/20 rounded-full w-3/4" />
                                                    <div className="h-1.5 bg-white/10 rounded-full w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'copy' && (
                        <motion.div
                            key="copy"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12 relative z-10"
                        >
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="order-2 lg:order-1 relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-[#14141e] p-6 lg:p-8">
                                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
                                    <div className="relative z-10 h-full flex flex-col gap-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-5 h-5 text-emerald-400" />
                                            <span className="font-bold text-sm uppercase tracking-wider text-emerald-400">Roteiro Storytelling</span>
                                        </div>
                                        <div className="bg-[#0d0d12] border border-white/10 rounded-xl p-4 flex-1 shadow-xl">
                                            <div className="space-y-3">
                                                <div className="text-xs font-black uppercase tracking-widest text-white/30">Ato 1: O Gancho</div>
                                                <div className="text-sm text-white/80 leading-relaxed font-serif italic">
                                                    "Eu lembro do dia exato em que quase desisti de tudo. Estava sentado na frente do computador, com as contas vencendo e zero vendas."
                                                </div>
                                                <div className="w-full h-px bg-white/5 my-3" />
                                                <div className="text-xs font-black uppercase tracking-widest text-white/30">Ato 2: O Conflito</div>
                                                <div className="h-2 bg-white/10 rounded-full w-full" />
                                                <div className="h-2 bg-white/10 rounded-full w-5/6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 lg:order-2">
                                    <h2 className="text-2xl font-black mb-4">Roteiros & Copywriting</h2>
                                    <p className="text-white/60 leading-relaxed mb-6">
                                        Transforme seguidores frios em clientes fiéis. Nossos roteiristas guiados por IA utilizam estruturas provadas de Copywriting para construir sua narrativa.
                                    </p>
                                    <div className="space-y-6">
                                        <StepItem number="A" title="Roteirista de Anúncios (Ads)" desc="Perfeito para tráfego pago. Crie vídeos com ganchos magnéticos, focados em Dor, Medo, Desejo ou Dificuldade, projetados para reter a atenção e multiplicar o CTR." />
                                        <StepItem number="B" title="Roteirista Storytelling" desc="Ideal para Reels e TikTok orgânicos. Construa histórias conectivas no formato da 'Jornada do Herói' ou 'A Ponte' para aumentar sua autoridade e humanizar seu perfil." />
                                        <StepItem number="C" title="Exportação e Uso" desc="Copie o roteiro pronto para o seu teleprompter ou salve na sua biblioteca para gravar e produzir depois." />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            {/* Footer Tip */}
            <div className="mt-8 text-center text-sm font-medium text-white/40">
                Ainda tem dúvidas? Fale com o nosso Suporte Técnico via botão no menu principal.
            </div>
        </div>
    );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white/70" />
            </div>
            <div>
                <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function StepItem({ number, title, desc }: { number: string, title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                <span className="font-black text-violet-300 text-xs">{number}</span>
            </div>
            <div>
                <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

