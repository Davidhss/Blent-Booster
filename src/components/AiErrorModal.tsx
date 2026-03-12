import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface AiErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const AiErrorModal: React.FC<AiErrorModalProps> = ({ isOpen, onClose, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Bloqueio na Geração</h3>
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                {message}
              </p>
              
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
              >
                Entendi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
