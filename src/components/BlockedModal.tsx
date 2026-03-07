import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, X, Zap, AlertTriangle } from 'lucide-react';

interface BlockedModalProps {
    open: boolean;
    onClose: () => void;
    onGoToStore: () => void;
}

export const BlockedModal: React.FC<BlockedModalProps> = ({ open, onClose, onGoToStore }) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="blocked-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="relative w-full max-w-md rounded-3xl border border-white/10 p-8 text-center shadow-2xl overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #16101e 0%, #0d0d12 100%)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glow bg */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-red-500/10 blur-[80px] rounded-full" />
                        </div>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon */}
                        <div className="relative z-10 flex flex-col items-center gap-5">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center">
                                <div className="relative">
                                    <Zap className="w-9 h-9 text-red-400" />
                                    <AlertTriangle className="w-4 h-4 text-orange-400 absolute -bottom-1 -right-2" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black tracking-tight text-white">
                                    Créditos Esgotados
                                </h2>
                                <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                                    Você atingiu seu limite de créditos. Escolha um pacote na loja ou aguarde a renovação do seu plano.
                                </p>
                            </div>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={() => { onGoToStore(); onClose(); }}
                                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide transition-all bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Ver Loja de Tokens
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 px-6 rounded-2xl font-bold text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
