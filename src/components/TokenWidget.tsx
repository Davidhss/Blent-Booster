import React from 'react';
import { motion } from 'motion/react';
import { Zap, Infinity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

const PLAN_MAX_TOKENS: Record<string, number> = {
    monthly: 1000,
    quarterly: 3500,
    annual: 15000,
};

interface TokenWidgetProps {
    onClick?: () => void;
    compact?: boolean;
}

export const TokenWidget: React.FC<TokenWidgetProps> = ({ onClick, compact = false }) => {
    const { tokenBalance, isUnlimited, profile } = useAuth();
    const planMax = PLAN_MAX_TOKENS[profile?.subscription_plan || 'monthly'] || 1000;
    const percentage = isUnlimited ? 100 : Math.min(100, (tokenBalance / planMax) * 100);

    const color =
        isUnlimited ? '#a78bfa'
            : percentage > 50 ? '#34d399'
                : percentage > 20 ? '#fbbf24'
                    : '#f87171';

    // SVG arc for circular progress
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    if (compact) {
        return (
            <button
                onClick={onClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
            >
                <Zap className="w-3 h-3" style={{ color }} />
                <span className="text-xs font-bold" style={{ color }}>
                    {isUnlimited ? '' : tokenBalance.toLocaleString()}
                </span>
            </button>
        );
    }

    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center gap-1 group"
            title="Tokens disponíveis"
        >
            <div className="relative w-12 h-12">
                <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    {/* Progress arc */}
                    <motion.circle
                        cx="22" cy="22" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
                    />
                </svg>
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {isUnlimited
                        ? <Infinity className="w-4 h-4" style={{ color }} />
                        : <Zap className="w-4 h-4" style={{ color }} />
                    }
                </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                {isUnlimited ? 'Ilimitado' : `${tokenBalance.toLocaleString()} tk`}
            </span>
        </motion.button>
    );
};
