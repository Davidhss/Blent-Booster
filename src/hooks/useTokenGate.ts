import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ToolType } from '../types';
import { APP_VERSION } from '../config/appVersion';
export const PLAN_MAX_TOKENS: Record<string, number> = {
    monthly: 1000,
    quarterly: 3500,
    annual: 15000,
};

export const PLAN_LABELS: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    annual: 'Anual',
};

/** Token costs for each AI action */
export const TOKEN_COSTS = {
    generatePost: 25,
    generateInsights: 30,
    generateAd: 40,
    generateStorytelling: 35,
    generateQuote: 10,
    generateCaption: 15,
    generateTextVariations: 15,
    generateBackgroundImages: 20,
    optimizeIdea: 15,
    ideas: 0,
    reminders: 0,
} as const;

export type TokenAction = keyof typeof TOKEN_COSTS;

export function useTokenGate() {
    const { tokenBalance, isUnlimited, profile, refreshProfile, isAdmin } = useAuth();

    const planKey = profile?.subscription_plan || 'monthly';
    const planMax = PLAN_MAX_TOKENS[planKey] ?? 1000;
    const planLabel = isUnlimited
        ? 'Acesso Fundador Ilimitado'
        : (PLAN_LABELS[planKey] ?? 'Mensal');

    const percentage = isUnlimited
        ? 100
        : planMax > 0 ? Math.min(100, (tokenBalance / planMax) * 100) : 0;

    const isLowBalance = !isUnlimited && percentage <= 10;
    const isBlocked = !isUnlimited && tokenBalance <= 0;

    function canAfford(cost: number): boolean {
        if (isUnlimited) return true;
        return tokenBalance >= cost;
    }

    function costLabel(action: TokenAction): string {
        const cost = TOKEN_COSTS[action];
        if (isUnlimited) return '0 créditos';
        return `${cost} ${(cost as number) === 1 ? 'crédito' : 'créditos'}`;
    }

    const deductTokens = async (type: TokenAction): Promise<boolean> => {
        // Bypass if in Blent mode and not an admin
        if (APP_VERSION === 'Blent' && !isAdmin) {
            return true;
        }

        if (isAdmin) return true;

        const cost = TOKEN_COSTS[type];
        const description = type; // Use the type as description for the API call

        if (isUnlimited || cost <= 0) return true;
        if (!canAfford(cost)) {
            toast.error('Créditos insuficientes para esta ação.');
            return false;
        }
        if (!profile) return false;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Sessão expirada. Autentique-se novamente.');
                return false;
            }

            const API_URL = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${API_URL}/api/consume-tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    cost,
                    action: description
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to consume tokens');
            }

            await refreshProfile();
            return true;
        } catch (err) {
            console.error('Error deducting tokens:', err);
            toast.error('Erro ao debitar créditos.');
            return false;
        }
    };

    return {
        tokenBalance,
        planMax,
        planLabel,
        planKey,
        percentage,
        isLowBalance,
        isBlocked,
        isUnlimited,
        canAfford,
        costLabel,
        deductTokens,
        TOKEN_COSTS,
        checkAccess: (tool: string) => !isAdmin && !isUnlimited && tokenBalance <= 0,
        blockReason: tokenBalance <= 0 ? 'insufficient_credits' : null
    };
}
