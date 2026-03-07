import React, { useState } from 'react';
import { CheckCircle2, X, Sparkles, Zap, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { APP_VERSION } from '../config/appVersion';
import { BOOST_PLANS, Blent_PLANS, Plan } from '../config/plans';

const PLANS = APP_VERSION === 'Blent' ? Blent_PLANS : BOOST_PLANS;

interface SubscriptionPageProps {
    onSkip?: () => void;
}

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSkip }) => {
    const { session, profile, isAdmin, signOut } = useAuth();
    const user = session?.user;
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [name, setName] = useState(profile?.name || '');
    const [email, setEmail] = useState(profile?.email || user?.email || '');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        toast.success('Redirecionando para o pagamento...');

        // Redireciona diretamente para o Stripe com identificação do usuário
        const stripeUrl = new URL(plan.stripeLink);
        if (user) {
            stripeUrl.searchParams.append('client_reference_id', user.id);
            stripeUrl.searchParams.append('prefilled_email', user.email || '');
        }

        window.location.href = stripeUrl.toString();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0d0d12] text-slate-900 dark:text-white font-sans selection:bg-violet-600 selection:text-slate-900 dark:text-white pb-20">
            <div className="max-w-7xl mx-auto px-6 pt-20">
                <div className="absolute top-6 right-6 z-20">
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-slate-500 dark:text-white/40 hover:text-slate-900 dark:text-white hover:bg-white/[0.08] transition-all text-xs font-black uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>

                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-violet-600/20 blur-[100px] pointer-events-none" />

                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl mx-auto mb-6 flex items-center justify-center text-violet-500 shadow-lg shadow-violet-500/10 relative z-10">
                        <Zap className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-slate-900 dark:text-white relative z-10">
                        Eleve sua criação ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">próximo nível</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-white/50 max-w-2xl mx-auto font-medium relative z-10">
                        Escolha o plano ideal e tenha acesso a ferramentas avançadas de design, inteligência artificial e análises para viralizar seu conteúdo.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative bg-white dark:bg-[#14141e] rounded-3xl p-8 border hover:-translate-y-2 transition-transform duration-300 flex flex-col ${plan.popular
                                ? 'border-violet-500 shadow-2xl shadow-violet-500/20'
                                : 'border-slate-200 dark:border-white/[0.06]'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" />
                                    Mais Vantajoso
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-white/50">{plan.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-slate-500 dark:text-white/50 font-bold">R$</span>
                                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                    <span className="text-sm text-slate-500 dark:text-white/50 font-bold">{plan.period}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                                        <span className="text-sm font-medium text-slate-800 dark:text-white/80">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${plan.popular
                                    ? 'bg-violet-600 text-slate-900 dark:text-white hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/20'
                                    : 'bg-slate-100 dark:bg-white/[0.03] text-slate-900 dark:text-white hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.06]'
                                    }`}
                            >
                                Assinar {plan.name} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                {onSkip && (
                    <div className="text-center mt-12">
                        <button
                            onClick={onSkip}
                            className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:text-white text-sm font-medium underline underline-offset-4"
                        >
                            Pular por enquanto / Acessar plataforma
                        </button>
                    </div>
                )}
            </div>

            {/* Checkout Modal removido para redirect direto */}
        </div>
    );
};
