import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionReady, setSessionReady] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const init = async () => {
            // 1. Check the URL hash directly — Supabase sets #access_token=...&type=recovery
            const hash = new URLSearchParams(window.location.hash.substring(1));
            const type = hash.get('type');

            if (type === 'recovery') {
                // Give the Supabase client a moment to process the hash and set the session
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setSessionReady(true);
                    return;
                }
            }

            // 2. Also listen for the event (fallback if hash processing fires the event)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
                if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                    setSessionReady(true);
                }
            });

            return () => subscription.unsubscribe();
        };

        init();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Falha ao redefinir a senha.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#06060f] text-white">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black mb-2">Senha redefinida!</h2>
                    <p className="text-white/50">Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#06060f] text-white overflow-hidden relative selection:bg-violet-600/40">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-[#06060f] to-purple-950/10" />
            <div className="absolute top-[20%] right-[30%] w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[160px] pointer-events-none" />
            <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-fuchsia-700/10 blur-[130px] pointer-events-none" />

            <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 relative z-10 w-full">
                <div className="w-full max-w-md bg-[#14141e]/80 backdrop-blur-xl border border-white/[0.06] p-8 sm:p-10 rounded-[32px] shadow-2xl">

                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mt-2 mb-6 shadow-lg shadow-violet-500/20">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Nova Senha</h1>
                        <p className="text-white/45 text-sm">
                            {sessionReady
                                ? 'Crie uma nova senha segura para sua conta.'
                                : 'Verificando link de recuperação...'}
                        </p>
                    </div>

                    {!sessionReady && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                            <p className="text-white/40 text-sm text-center">
                                Se a tela não avançar, <strong className="text-violet-400 cursor-pointer" onClick={() => setSessionReady(true)}>clique aqui para continuar</strong>.
                            </p>
                            <a href="/" className="text-violet-400 font-bold text-sm hover:text-violet-300 transition-colors">
                                Voltar para o início
                            </a>
                        </div>
                    )}

                    {sessionReady && (
                        <form onSubmit={handleReset} className="space-y-4">
                            {error && (
                                <div className="mb-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-1.5">Nova Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-violet-400 transition-colors" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="8+ caracteres"
                                        className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/60 transition-all text-sm font-medium text-white placeholder:text-white/20 outline-none"
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" disabled={loading || password.length < 8}
                                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl text-sm font-black tracking-wide flex items-center justify-center gap-2.5 transition-all hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] disabled:opacity-50 group">
                                    {loading
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <>Redefinir e Acessar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                    }
                                </button>
                            </div>

                            <div className="text-center mt-4">
                                <a href="/" className="text-sm font-bold text-white/35 hover:text-violet-400 transition-colors">
                                    Voltar para o login
                                </a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
