import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, HelpCircle, Sparkles, Target, Video, BookOpen, Lightbulb, CalendarDays, Library, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { APP_VERSION } from '../config/appVersion';
import { useAuth } from '../contexts/AuthContext';

export interface TutorialStep {
    targetId: string;
    title: string;
    description: string;
    placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tutorialSteps: TutorialStep[] = [
    {
        targetId: 'sidebar-home',
        title: 'Boas-vindas ao Blent Boost!',
        description: 'Este é o seu centro de comando. Aqui você tem uma visão geral rápida de todas as suas ferramentas e atividades recentes.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-creatives',
        title: 'Blent (Criação de Posts)',
        description: 'A ferramenta principal para criar posts, carrosséis e artes profissionais em segundos usando nossos templates estratégicos.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-insights',
        title: 'Audience Insights',
        description: 'Conheça seu público em profundidade. Gere perguntas, dores e desejos reais para guiar sua comunicação.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-strategy',
        title: 'Gerador de Estratégias',
        description: 'Transforme seu nicho em uma estratégia de conteúdo completa, com temas e abordagens validadas.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-ads',
        title: 'Social Ads (Scripts)',
        description: 'Desenvolva roteiros de anúncios que vendem, focados em conversão para Instagram, TikTok e YouTube.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-storytelling',
        title: 'Roteirista de Storytelling',
        description: 'Transforme histórias em conexão. Crie narrativas envolventes para seus stories e vídeos.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-ideas',
        title: 'Banco de Ideias',
        description: 'Nunca mais fique sem criatividade. Aceda a centenas de ideias prontas e agende-as diretamente no seu Planner.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-planner',
        title: 'Planner Estratégico',
        description: 'Organize sua semana de conteúdo. Visualize seus posts, ideias e tarefas em um calendário intuitivo.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-library',
        title: 'Meu Acervo',
        description: 'Seu cofre criativo. Todos os seus posts, roteiros e insights salvos ficam organizados aqui para acesso rápido.',
        placement: 'right'
    },
    {
        targetId: 'sidebar-profile',
        title: 'Perfil & Memory Card',
        description: 'Configure sua marca e use os Memory Cards (slots 1, 2 e 3) para salvar diferentes perfis de público e produto.',
        placement: 'right'
    }
];

export const TutorialOverlay: React.FC = () => {
    const { isAdmin } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

    // Filter steps based on version and admin status
    const filteredSteps = tutorialSteps.filter(step => {
        if (isAdmin) return true;
        if (APP_VERSION === 'Blent') {
            return ['sidebar-home', 'sidebar-creatives', 'sidebar-ideas', 'sidebar-planner', 'sidebar-library', 'sidebar-profile'].includes(step.targetId);
        }
        return true;
    });

    useEffect(() => {
        const handleStart = () => {
            console.log('Tutorial starting...');
            setIsActive(true);
            setCurrentStep(0);
        };

        window.addEventListener('start-tutorial', handleStart);
        return () => window.removeEventListener('start-tutorial', handleStart);
    }, []);

    useEffect(() => {
        if (isActive && filteredSteps.length > 0) {
            const updateCoords = () => {
                const step = filteredSteps[currentStep];
                const element = document.getElementById(step.targetId);

                if (element) {
                    const rect = element.getBoundingClientRect();
                    setCoords({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    });

                    // Scroll into view if needed
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Fail-safe: if element not found, move the pop-up to center
                    setCoords({
                        top: window.innerHeight / 2 - 50,
                        left: window.innerWidth / 2 - 150,
                        width: 300,
                        height: 100
                    });
                }
            };

            updateCoords();
            window.addEventListener('resize', updateCoords);
            return () => window.removeEventListener('resize', updateCoords);
        }
    }, [isActive, currentStep]);

    const handleNext = () => {
        if (currentStep < filteredSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setIsActive(false);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (!isActive || filteredSteps.length === 0) return null;

    const currentStepData = filteredSteps[currentStep];

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop with hole */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" onClick={() => setIsActive(false)} />

            {/* Highlight Hole */}
            <motion.div
                initial={false}
                animate={{
                    top: coords.top - 8,
                    left: coords.left - 8,
                    width: coords.width + 16,
                    height: coords.height + 16,
                }}
                className="absolute bg-white/10 rounded-xl border-2 border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none z-10"
            />

            {/* Pop-up */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    top: coords.top + (coords.height / 2),
                    left: coords.left + coords.width + 24
                }}
                className="absolute z-20 w-80 pointer-events-auto -translate-y-1/2"
            >
                <div className="bg-white dark:bg-[#1c1c28] border border-white/10 rounded-3xl p-6 shadow-2xl relative">
                    {/* Arrow */}
                    <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-[#1c1c28] border-l border-b border-white/10 rotate-45" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-600/10 flex items-center justify-center">
                                    <HelpCircle className="w-4 h-4 text-violet-500" />
                                </div>
                                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Passo {currentStep + 1} de {tutorialSteps.length}</span>
                            </div>
                            <button onClick={() => setIsActive(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{currentStepData.title}</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-white/50 leading-relaxed mb-6">
                            {currentStepData.description}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {[...Array(filteredSteps.length)].map((_, i) => (
                                    <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === currentStep ? "bg-violet-600" : "bg-slate-200 dark:bg-white/10")} />
                                ))}
                            </div>

                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={handlePrev}
                                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-white/5 transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-lg shadow-violet-500/20"
                                >
                                    {currentStep === filteredSteps.length - 1 ? 'Concluir' : 'Próximo'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
