import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Star, Rocket, Crown, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || '';

const PACKS = [
    {
        id: 'starter',
        name: 'Starter',
        tokens: 500,
        price: 29.90,
        priceStr: 'R$ 29,90',
        icon: Zap,
        color: 'from-blue-600 to-cyan-600',
        glowColor: 'shadow-blue-500/20',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
        badge: null,
    },
    {
        id: 'boost',
        name: 'Boost',
        tokens: 2000,
        price: 89.90,
        priceStr: 'R$ 89,90',
        icon: Rocket,
        color: 'from-violet-600 to-purple-700',
        glowColor: 'shadow-violet-500/30',
        iconColor: 'text-violet-400',
        borderColor: 'border-violet-500/30',
        badge: 'P Melhor Custo-Benefício',
    },
    {
        id: 'pro',
        name: 'Pro',
        tokens: 5000,
        price: 199.90,
        priceStr: 'R$ 199,90',
        icon: Crown,
        color: 'from-amber-600 to-orange-600',
        glowColor: 'shadow-amber-500/20',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
        badge: null,
    },
];

export const TokenStore: React.FC = () => {
    const { user, profile } = useAuth();
    const [loadingPack, setLoadingPack] = useState<string | null>(null);

    const handleBuyPack = async (packId: string) => {
        if (!user || !profile) {
            toast.error('Você precisa estar logado para comprar tokens.');
            return;
        }

        setLoadingPack(packId);
        try {
            const response = await fetch(`${API_URL}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    userEmail: user.email,
                    packType: packId,
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.error('Não foi possível iniciar o checkout. Tente novamente.');
            }
        } catch (err) {
            toast.error('Erro ao conectar com o servidor de pagamentos.');
        } finally {
            setLoadingPack(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                    <h3 className="text-base font-black text-white">Loja de Tokens</h3>
                    <p className="text-xs text-white/40">Adicione créditos ao seu saldo atual</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACKS.map((pack) => {
                    const Icon = pack.icon;
                    const isLoading = loadingPack === pack.id;
                    const isPopular = pack.badge !== null;

                    return (
                        <motion.div
                            key={pack.id}
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className={`relative bg-[#14141e] border rounded-2xl p-5 flex flex-col gap-4 ${pack.borderColor} ${isPopular ? `shadow-xl ${pack.glowColor}` : ''}`}
                        >
                            {isPopular && pack.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-700 rounded-full text-[10px] font-black text-white whitespace-nowrap shadow-lg">
                                    {pack.badge}
                                </div>
                            )}

                            <div className={`w-10 h-10 bg-gradient-to-br ${pack.color} rounded-xl flex items-center justify-center shadow-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>

                            <div>
                                <h4 className="text-lg font-black text-white">{pack.name}</h4>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className={`text-3xl font-black ${pack.iconColor}`}>{pack.tokens.toLocaleString()}</span>
                                    <span className="text-xs font-bold text-white/40">tokens</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="text-xs text-white/60">Adicionados ao saldo atual</span>
                            </div>

                            <div className="mt-auto pt-2 border-t border-white/[0.06]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xl font-black text-white">{pack.priceStr}</span>
                                    <span className="text-[10px] text-white/30 font-semibold">pagamento único</span>
                                </div>
                                <button
                                    onClick={() => handleBuyPack(pack.id)}
                                    disabled={isLoading}
                                    className={`w-full py-2.5 bg-gradient-to-r ${pack.color} text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shadow-lg`}
                                >
                                    {isLoading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <><span>Comprar Agora</span><ArrowRight className="w-3.5 h-3.5" /></>
                                    }
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
