import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, XCircle, Clock, Zap, ExternalLink, Infinity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TokenStore } from './TokenStore';
import { cn } from '../lib/utils';

const PLAN_LABELS: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    annual: 'Anual',
};

const PLAN_PRICES: Record<string, string> = {
    monthly: 'R$ 59,90/mês',
    quarterly: 'R$ 165,00/trimestre',
    annual: 'R$ 624,00/ano',
};

const PLAN_TOKENS: Record<string, string> = {
    monthly: '1.000',
    quarterly: '3.500',
    annual: '15.000',
};

export const MySubscription: React.FC = () => {
    const { profile, tokenBalance, isUnlimited } = useAuth();

    const status = profile?.subscription_status || 'inactive';
    const plan = profile?.subscription_plan || null;

    const statusConfig = {
        active: { label: 'Ativo', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        inactive: { label: 'Inativo', icon: XCircle, color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
        canceled: { label: 'Cancelado', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        trialing: { label: 'Trial', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        past_due: { label: 'Pagamento Pendente', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    };

    const sc = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const StatusIcon = sc.icon;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
                    <CreditCard className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white">Tokens & Assinatura</h1>
                    <p className="text-sm font-medium text-white/40 mt-1">Gerencie seu plano e compre créditos.</p>
                </div>
            </motion.div>

            {/* Token Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6"
            >
                <div className="w-16 h-16 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    {isUnlimited ? <Infinity className="w-8 h-8 text-violet-400" /> : <Zap className="w-8 h-8 text-violet-400" />}
                </div>
                <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-violet-400/60 mb-1">Saldo Atual</p>
                    <p className="text-5xl font-black text-white">
                        {isUnlimited ? ' ' : tokenBalance.toLocaleString()}
                        <span className="text-xl font-bold text-white/30 ml-2">tokens</span>
                    </p>
                    {isUnlimited && (
                        <p className="text-sm text-violet-300 font-semibold mt-2">Conta fundadora • Tokens ilimitados ativos!</p>
                    )}
                    {plan && PLAN_TOKENS[plan] && !isUnlimited && (
                        <p className="text-sm text-white/40 font-semibold mt-2">
                            Seu plano {PLAN_LABELS[plan]} inclui {PLAN_TOKENS[plan]} tokens/renovação
                        </p>
                    )}
                </div>
            </motion.div>

            {/* Subscription Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-[#14141e] border border-white/[0.06] rounded-3xl p-6 space-y-5"
            >
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Minha Assinatura
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">Plano</p>
                        <p className="text-base font-black text-white">{plan ? PLAN_LABELS[plan] : ' '}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">Status</p>
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', sc.bg, sc.color)}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {sc.label}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">Valor</p>
                        <p className="text-base font-black text-white">{plan ? PLAN_PRICES[plan] : ' '}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">Último Pag.</p>
                        <p className="text-base font-black text-white">
                            {profile?.last_payment_date
                                ? new Date(profile.last_payment_date).toLocaleDateString('pt-BR')
                                : ' '
                            }
                        </p>
                    </div>
                </div>

                {profile?.stripe_customer_id && (
                    <div className="pt-4 border-t border-white/[0.06]">
                        <a
                            href={`https://billing.stripe.com/p/login/test_dRmej11Y4ei26OW6oo?prefilled_email=${profile.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Gerenciar Assinatura no Stripe
                        </a>
                    </div>
                )}
            </motion.div>

            {/* Cost Reference */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-[#14141e] border border-white/[0.06] rounded-3xl p-6"
            >
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Custo por Funcionalidade</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { label: 'Ideias & Lembretes', cost: 0, color: 'text-white/40' },
                        { label: 'Blent Boost', cost: 25, color: 'text-violet-400' },
                        { label: 'Legenda IA', cost: 15, color: 'text-emerald-400' },
                        { label: 'Audience Insights', cost: 30, color: 'text-blue-400' },
                        { label: 'Storytelling', cost: 35, color: 'text-orange-400' },
                        { label: 'Anúncios IA', cost: 40, color: 'text-rose-400' },
                    ].map(item => (
                        <div key={item.label} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                            <p className={cn('text-2xl font-black', item.color)}>
                                {item.cost === 0 ? 'Free' : `${item.cost} tk`}
                            </p>
                            <p className="text-xs font-semibold text-white/50">{item.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Token Store */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-[#14141e] border border-white/[0.06] rounded-3xl p-6"
            >
                <TokenStore />
            </motion.div>
        </div>
    );
};
