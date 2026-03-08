import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2, UserPlus, Trash2, ShieldAlert, Edit2, X, Check, Search,
  Infinity, Zap, History, ClipboardList, BarChart3, Users, Ban, CheckCircle2,
  RefreshCw, TrendingUp, Target, BrainCircuit, Calendar, Crown, Clock, ChevronRight, Bug, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';


const API_URL = import.meta.env.VITE_API_URL || '';

type Tab = 'users' | 'forms' | 'analytics' | 'create' | 'bugs';

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  ideias: 'Falta de ideias criativas',
  tempo: 'Falta de tempo para criar',
  design: 'Design e visual dos posts',
  algoritmo: 'Entender o algoritmo',
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Todo dia',
  '3x': '3-4x por semana',
  '1x': '1-2x por semana',
  rarely: 'Raramente',
};

const GOAL_LABELS: Record<string, string> = {
  time: 'Ganhar Tempo',
  design: 'Melhorar o Design',
  ideas: 'Ter Ideias Criativas',
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [creating, setCreating] = useState(false);

  // Bug Reports
  const [bugs, setBugs] = useState<any[]>([]);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [resolvingBug, setResolvingBug] = useState<string | null>(null);
  const [emailingBug, setEmailingBug] = useState<string | null>(null);
  const [viewingBug, setViewingBug] = useState<any>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');

  // Edit State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editTokenBalance, setEditTokenBalance] = useState(0);
  const [editUnlimited, setEditUnlimited] = useState(false);
  const [editPlan, setEditPlan] = useState('monthly');
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<string>('inactive');
  const [editTempAccess, setEditTempAccess] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Transactions
  const [viewingTxUser, setViewingTxUser] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [formSearch, setFormSearch] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (activeTab === 'forms' || activeTab === 'analytics') {
      fetchForms();
    }
    if (activeTab === 'bugs') {
      fetchBugs();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar usuários.');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchForms = async () => {
    setLoadingForms(true);
    try {
      const { data: insightsData, error: insightsError } = await supabase
        .from('user_insights')
        .select('*');
      if (insightsError) throw insightsError;

      const insights = insightsData || [];
      if (insights.length === 0) {
        setForms([]);
        return;
      }

      const userIds = insights.map(i => i.user_id).filter(Boolean);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = (profilesData || []).reduce((acc: any, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      const enrichedForms = insights.map(i => ({
        ...i,
        profiles: profileMap[i.user_id] || { name: 'Desconhecido', email: 'N/A' }
      }));

      setForms(enrichedForms);
    } catch (err: any) {
      console.error('Error fetching forms:', err);
      toast.error('Erro ao carregar formulários.');
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchBugs = async () => {
    setLoadingBugs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${API_URL}/api/admin/bug-reports`, { headers });
      if (!res.ok) throw new Error('Falha ao obter bugs');
      const data = await res.json();
      setBugs(data.bugs || []);
    } catch (err: any) {
      toast.error('Erro ao carregar relatórios de bugs.');
      console.error(err);
    } finally {
      setLoadingBugs(false);
    }
  };

  const handleResolveBug = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir abrir o modal
    setResolvingBug(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${API_URL}/api/admin/bug-reports/${id}/resolve`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Falha ao resolver bug');
      toast.success('Bug marcado como resolvido!');
      setBugs(prev => prev.map(b => b.id === id ? { ...b, status: 'resolved' } : b));
      if (viewingBug?.id === id) setViewingBug({ ...viewingBug, status: 'resolved' });
    } catch (err) {
      toast.error('Erro ao marcar como resolvido.');
    } finally {
      setResolvingBug(null);
    }
  };

  const handleSendThankYouEmail = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmailingBug(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${API_URL}/api/admin/bug-reports/${id}/thank-you`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar e-mail');
      toast.success('E-mail de agradecimento enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar e-mail.');
    } finally {
      setEmailingBug(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: { data: { name: newName, role: newRole } }
      });
      if (error) throw error;
      toast.success('Usuário criado com sucesso!');
      setNewEmail(''); setNewPassword(''); setNewName('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Deletar ${name} permanentemente?`)) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: id });
      if (error) throw error;
      toast.success(`Usuário ${name} deletado.`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      toast.error('Erro ao deletar usuário.');
    }
  };

  const handleToggleSuspend = async (u: any) => {
    const newStatus = u.subscription_status === 'suspended' ? 'active' : 'suspended';
    const label = newStatus === 'suspended' ? 'suspenso' : 'reativado';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('id', u.id);
      if (error) throw error;
      toast.success(`Usuário ${label} com sucesso.`);
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, subscription_status: newStatus } : usr));
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const startEdit = (u: any) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditTokenBalance(u.token_balance || 0);
    setEditUnlimited(u.is_unlimited || false);
    setEditPlan(u.subscription_plan || 'monthly');
    setEditFeatures(u.features || []);
    setEditStatus(u.subscription_status || 'inactive');
    setEditTempAccess(u.temporary_access_until ? new Date(u.temporary_access_until).toISOString().split('T')[0] : '');
    setEditTags(Array.isArray(u.tags) ? u.tags.join(', ') : '');
  };

  const cancelEdit = () => setEditingUser(null);

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const id = editingUser.id;
    setIsSavingEdit(true);
    try {
      const { error: rpcError } = await supabase.rpc('admin_update_user', {
        target_user_id: id,
        new_name: editName,
        new_role: editRole
      });
      if (rpcError) throw rpcError;

      const updatedFields = {
        token_balance: editTokenBalance,
        is_unlimited: editUnlimited,
        subscription_plan: editPlan,
        features: editFeatures,
        subscription_status: editStatus,
        temporary_access_until: editTempAccess ? new Date(editTempAccess).toISOString() : null,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updatedFields)
        .eq('id', id);
      if (profileError) throw profileError;

      const originalUser = users.find(u => u.id === id);
      if (originalUser && originalUser.token_balance !== editTokenBalance) {
        await supabase.from('token_transactions').insert({
          user_id: id,
          amount: editTokenBalance - (originalUser.token_balance || 0),
          type: 'admin_adjustment',
          description: `Ajuste manual de tokens pelo admin`,
        });
      }

      toast.success('Usuário atualizado com sucesso.');
      setUsers(prev => prev.map(u => u.id === id
        ? {
          ...u,
          name: editName,
          role: editRole,
          ...updatedFields
        }
        : u
      ));
      setEditingUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar usuário: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSavingEdit(false);
    }
  };



  const viewTransactions = async (userId: string) => {
    setViewingTxUser(userId);
    setLoadingTx(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`${API_URL}/api/admin/transactions/${userId}`, { headers });
      const data = await res.json();
      setTransactions(data);
    } catch {
      toast.error('Erro ao carregar transações.');
    } finally {
      setLoadingTx(false);
    }
  };

  const sortedUsers = [...users];

  const filteredUsers = sortedUsers.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredForms = forms.filter(f => {
    const search = formSearch.toLowerCase();
    return (
      (f.profiles?.name || '').toLowerCase().includes(search) ||
      (f.profiles?.email || '').toLowerCase().includes(search) ||
      (f.niche || '').toLowerCase().includes(search)
    );
  });

  // Analytics computed values
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.subscription_status === 'active').length;
  const suspendedUsers = users.filter(u => u.subscription_status === 'suspended').length;
  const unlimitedUsers = users.filter(u => u.is_unlimited).length;

  const planCounts = users.reduce((acc: Record<string, number>, u) => {
    const p = u.subscription_plan || 'sem plano';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const nicheCounts = forms.reduce((acc: Record<string, number>, f) => {
    if (f.niche) acc[f.niche] = (acc[f.niche] || 0) + 1;
    return acc;
  }, {});

  const difficultyCounts = forms.reduce((acc: Record<string, number>, f) => {
    if (f.main_difficulty) acc[f.main_difficulty] = (acc[f.main_difficulty] || 0) + 1;
    return acc;
  }, {});

  const goalCounts = forms.reduce((acc: Record<string, number>, f) => {
    if (f.main_goal) acc[f.main_goal] = (acc[f.main_goal] || 0) + 1;
    return acc;
  }, {});

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
    { id: 'forms', label: 'Formulários', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'bugs', label: 'Bugs', icon: <Bug className="w-4 h-4" /> },
    { id: 'create', label: 'Criar Usuário', icon: <UserPlus className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Painel Administrativo</h1>
            <p className="text-sm font-medium text-white/40 mt-1">Gerencie usuários, planos, formulários e análises.</p>
          </div>
        </div>


      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.06] w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all',
              activeTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* === TAB: USERS === */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#14141e] p-6 sm:p-8 rounded-3xl border border-white/[0.06] flex flex-col flex-1 min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Usuários ({users.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usuário..."
                className="w-full py-2.5 pl-9 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-bold text-white placeholder:text-white/20 focus:border-violet-500/50 outline-none transition-all"
              />
            </div>
          </div>



          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[820px]">
                <div className="grid grid-cols-12 gap-3 px-3 pb-3 border-b border-white/[0.06] text-[9px] font-black uppercase tracking-widest text-white/30">
                  <div className="col-span-1 text-center">Pos.</div>
                  <div className="col-span-2">Usuário</div>
                  <div className="col-span-2">Tempo Uso</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Tokens</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  <AnimatePresence>
                    {filteredUsers.map((u) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={u.id}
                        className="grid grid-cols-12 gap-3 items-center p-3 hover:bg-white/[0.02] transition-colors rounded-xl mt-1"
                      >
                        {/* VIEW MODE */}
                        <>
                          <div className="col-span-1 text-center">
                            <span className={cn(
                              "text-white/20 italic font-medium"
                            )}>
                              #{sortedUsers.indexOf(u) + 1}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=14141e&color=fff`}
                              alt={u.name} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{u.name}</p>
                              <p className="text-[10px] text-white/20 truncate">{u.email}</p>
                            </div>
                          </div>

                          <div className="col-span-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-white/60">
                                <Calendar className="w-3 h-3 text-white/30" />
                                <span className="text-[10px] font-bold">
                                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <span className="text-[9px] text-white/20 font-medium pl-4">
                                {Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias logado
                              </span>
                            </div>
                          </div>
                          <div className="col-span-1">
                            <span className={cn(
                              'px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest block w-fit mx-auto',
                              u.subscription_status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : u.subscription_status === 'suspended'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 font-black'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            )}>
                              {u.subscription_status === 'active' ? 'Ativo' : u.subscription_status === 'suspended' ? 'Suspenso' : 'Inativo'}
                            </span>
                          </div>
                          <div className="col-span-2 text-right flex items-center justify-end gap-1 px-4">
                            {u.is_unlimited ? <Infinity className="w-3.5 h-3.5 text-violet-400" /> : <Zap className="w-3.5 h-3.5 text-yellow-400" />}
                            <span className="text-xs font-black text-white">
                              {u.is_unlimited ? 'Ilimitado' : (u.token_balance || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <button onClick={() => handleToggleSuspend(u)} title={u.subscription_status === 'suspended' ? 'Reativar conta' : 'Suspender conta'}
                              className={cn('p-2 rounded-lg transition-all',
                                u.subscription_status === 'suspended'
                                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white')}>
                              {u.subscription_status === 'suspended' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button onClick={() => startEdit(u)}
                              className="p-2 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white rounded-lg transition-all" title="Gerenciar Usuário">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      </motion.div>
                    ))}

                    {filteredUsers.length === 0 && (
                      <div className="py-12 text-center text-white/30 text-xs font-bold">Nenhum usuário encontrado.</div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* === TAB: FORMS === */}
      {activeTab === 'forms' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#14141e] p-6 sm:p-8 rounded-3xl border border-white/[0.06] flex flex-col flex-1 min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Formulários Preenchidos ({forms.length})
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" value={formSearch} onChange={(e) => setFormSearch(e.target.value)}
                placeholder="Buscar por nome, nicho..." className="w-full py-2.5 pl-9 pr-4 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs font-bold text-white placeholder:text-white/20 focus:border-violet-500/50 outline-none transition-all" />
            </div>
          </div>

          {loadingForms ? (
            <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-white/20" /></div>
          ) : filteredForms.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Nenhum formulário encontrado.</div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {filteredForms.map((f) => (
                <div key={f.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Usuário</p>
                    <p className="text-sm font-bold text-white">{f.profiles?.name || ''}</p>
                    <p className="text-[10px] text-white/40">{f.profiles?.email || ''}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Nicho</p>
                    <span className="inline-block px-2 py-1 bg-violet-500/10 text-violet-300 text-[10px] font-bold rounded-lg border border-violet-500/20">
                      {f.niche || ''}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Dificuldade</p>
                    <p className="text-xs font-semibold text-white/70">{DIFFICULTY_LABELS[f.main_difficulty] || f.main_difficulty || ''}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Objetivo</p>
                    <p className="text-xs font-semibold text-white/70">{GOAL_LABELS[f.main_goal] || f.main_goal || ''}</p>
                    <p className="text-[9px] text-white/30 mt-1">{FREQUENCY_LABELS[f.post_frequency] || f.post_frequency || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* === TAB: ANALYTICS === */}
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex-1">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total de Usuários', value: totalUsers, icon: <Users className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { label: 'Contas Ativas', value: activeUsers, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Contas Suspensas', value: suspendedUsers, icon: <Ban className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
              { label: 'Acesso Ilimitado', value: unlimitedUsers, icon: <Infinity className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map(kpi => (
              <div key={kpi.label} className={cn('bg-[#14141e] border rounded-2xl p-5 flex flex-col gap-3', kpi.bg)}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-white/5', kpi.color)}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{kpi.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-0.5">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan Distribution */}
            <div className="bg-[#14141e] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Distribuição de Planos
              </h3>
              <div className="space-y-3">
                {Object.entries(planCounts).map(([plan, count]: [string, any]) => {
                  const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-white">{PLAN_LABELS[plan] || plan}</span>
                        <span className="text-white/40">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Niches */}
            <div className="bg-[#14141e] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5 flex items-center gap-2">
                <Target className="w-4 h-4" /> Nichos Populares
              </h3>
              {loadingForms ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>
              ) : Object.keys(nicheCounts).length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Sem dados de formulários ainda.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(nicheCounts)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5)
                    .map(([niche, count]: [string, any]) => {
                      const max = Math.max(...Object.values(nicheCounts) as number[]);
                      const pct = max > 0 ? Math.round((count / max) * 100) : 0;
                      return (
                        <div key={niche}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-white">{niche}</span>
                            <span className="text-white/40">{count}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Dificuldades */}
            <div className="bg-[#14141e] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Principais Dificuldades
              </h3>
              {loadingForms ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>
              ) : Object.keys(difficultyCounts).length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Sem dados ainda.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(difficultyCounts)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([key, count]: [string, any]) => {
                      const max = Math.max(...Object.values(difficultyCounts) as number[]);
                      const pct = max > 0 ? Math.round((count / max) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-white/80 text-[11px]">{DIFFICULTY_LABELS[key] || key}</span>
                            <span className="text-white/40">{count}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Objetivos */}
            <div className="bg-[#14141e] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Objetivos dos Usuários
              </h3>
              {loadingForms ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-white/20" /></div>
              ) : Object.keys(goalCounts).length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">Sem dados ainda.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(goalCounts)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([key, count]: [string, any]) => {
                      const total = (Object.values(goalCounts) as number[]).reduce((a: number, b: number) => a + b, 0);
                      const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{GOAL_LABELS[key] || key}</span>
                            <span className="text-xs font-black text-violet-400">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* === TAB: CREATE USER === */}
      {activeTab === 'create' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-[#14141e] p-6 sm:p-8 rounded-3xl border border-white/[0.06]">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Criar Novo Usuário
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {[
              { label: 'Nome', value: newName, onChange: setNewName, type: 'text', placeholder: 'Nome do usuário' },
              { label: 'E-mail', value: newEmail, onChange: setNewEmail, type: 'email', placeholder: 'email@exemplo.com' },
              { label: 'Senha', value: newPassword, onChange: setNewPassword, type: 'password', placeholder: 'Mínimo 6 caracteres' },
            ].map(field => (
              <div className="space-y-2" key={field.label}>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-full p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.08] focus:border-violet-500/50 focus:bg-white/[0.04] transition-all text-sm font-medium text-white placeholder:text-white/20 outline-none"
                  placeholder={field.placeholder}
                  required
                />
              </div>
            ))}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Permissão</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                className="w-full p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.08] focus:border-violet-500/50 transition-all text-sm font-medium text-white outline-none appearance-none">
                <option value="user" className="bg-[#14141e]">Usuário Comum</option>
                <option value="admin" className="bg-[#14141e]">Administrador</option>
              </select>
            </div>

            <button type="submit" disabled={creating}
              className="w-full py-3.5 mt-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Conta'}
            </button>
          </form>
        </motion.div>
      )}

      {/* === TAB: BUGS === */}
      {activeTab === 'bugs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#14141e] p-6 sm:p-8 rounded-3xl border border-white/[0.06] flex flex-col flex-1 min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Relatórios de Bugs ({bugs.length})
            </h2>
          </div>

          {loadingBugs ? (
            <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-white/20" /></div>
          ) : bugs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Nenhum bug reportado.</div>
          ) : (
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {bugs.map((bug) => (
                <div
                  key={bug.id}
                  onClick={() => setViewingBug(bug)}
                  className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={bug.profiles?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(bug.profiles?.name || 'U')}&background=14141e&color=fff`}
                      alt={bug.profiles?.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-white">{bug.profiles?.name || 'Desconhecido'}</p>
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                          bug.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        )}>
                          {bug.status === 'resolved' ? 'Corrigido' : 'Pendente'}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40">{bug.user_email} • Ferramenta: <span className="text-white/70">{bug.tool}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bug.status !== 'resolved' && (
                      <button
                        onClick={(e) => handleResolveBug(bug.id, e)}
                        disabled={resolvingBug === bug.id}
                        className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                      >
                        {resolvingBug === bug.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">Corrigido</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => handleSendThankYouEmail(bug.id, e)}
                      disabled={emailingBug === bug.id}
                      className="p-2 bg-violet-500/10 text-violet-400 hover:bg-violet-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                    >
                      {emailingBug === bug.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      <span className="hidden sm:inline">Agradecer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Bug Details Modal */}
      <AnimatePresence>
        {viewingBug && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setViewingBug(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14141e] border border-white/[0.08] rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setViewingBug(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                  <Bug className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">Detalhes do Bug</h3>
                  <p className="text-sm font-medium text-white/40 mt-1">
                    Enviado em {new Date(viewingBug.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Usuário</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={viewingBug.profiles?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingBug.profiles?.name || 'U')}&background=14141e&color=fff`}
                        alt={viewingBug.profiles?.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold text-white">{viewingBug.profiles?.name || 'Desconhecido'}</p>
                        <p className="text-[10px] text-white/40">{viewingBug.user_email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Informações</p>
                    <p className="text-xs text-white/70 mb-1">
                      <strong className="text-white">Ferramenta:</strong> {viewingBug.tool}
                    </p>
                    <p className="text-xs text-white/70">
                      <strong className="text-white">Bugs enviados (Total):</strong> {viewingBug.total_reports_by_user || 1}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Descrição do Problema</p>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest',
                      viewingBug.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    )}>
                      {viewingBug.status === 'resolved' ? 'Corrigido' : 'Pendente'}
                    </span>
                  </div>
                  <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {viewingBug.description}
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  {viewingBug.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveBug(viewingBug.id, Object.create(null) as any)}
                      disabled={resolvingBug === viewingBug.id}
                      className="flex-1 py-3.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      {resolvingBug === viewingBug.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Marcar como Corrigido
                    </button>
                  )}
                  <button
                    onClick={() => handleSendThankYouEmail(viewingBug.id)}
                    disabled={emailingBug === viewingBug.id}
                    className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    {emailingBug === viewingBug.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-5 h-5" />}
                    Enviar E-mail de Agradecimento
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Transaction History Modal */}
      <AnimatePresence>
        {viewingTxUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setViewingTxUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14141e] border border-white/[0.08] rounded-3xl w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-400" /> Histórico de Tokens
                </h3>
                <button onClick={() => setViewingTxUser(null)} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingTx ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-white/20" /></div>
              ) : transactions.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-8">Nenhuma transação encontrada.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-white">{tx.description}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={cn('text-sm font-black', tx.amount > 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Management Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={cancelEdit}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#14141e] border border-white/[0.08] rounded-3xl w-full max-w-4xl p-8 my-8 shadow-2xl relative"
            >
              <div className="absolute top-6 right-6 flex gap-2">
                <button onClick={() => handleSaveEdit()} disabled={isSavingEdit} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Alterações
                </button>
                <button onClick={cancelEdit} disabled={isSavingEdit} className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                <img src={editingUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(editingUser.name || 'U')}&background=14141e&color=fff`} alt={editingUser.name} className="w-16 h-16 rounded-full border-2 border-white/10" />
                <div>
                  <h2 className="text-2xl font-black text-white">{editingUser.name}</h2>
                  <p className="text-sm font-medium text-white/40">{editingUser.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className={cn('px-3 py-1 font-black text-xs rounded-lg uppercase tracking-widest border', editStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : editStatus === 'suspended' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')}>{editStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna 1: Informações Principais */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-white/60 uppercase tracking-widest flex items-center gap-2"><UserPlus className="w-4 h-4" /> Informações da Conta</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Nome</label>
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 text-sm font-medium text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Permissão</label>
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 text-sm font-medium text-white outline-none appearance-none">
                        <option value="user" className="bg-[#14141e]">USER</option>
                        <option value="admin" className="bg-[#14141e]">ADMIN</option>
                      </select>
                    </div>
                  </div>



                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Tokens</label>
                      <input type="number" value={editTokenBalance} onChange={(e) => setEditTokenBalance(parseInt(e.target.value) || 0)} className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 text-sm font-medium text-white outline-none" min={0} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center justify-between">
                        Acesso Ilimitado
                        <input type="checkbox" checked={editUnlimited} onChange={(e) => setEditUnlimited(e.target.checked)} className="w-4 h-4 accent-violet-500" />
                      </label>
                      <div className="text-xs text-white/40 mt-2">Permite uso sem consumir tokens.</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Etiquetas/Títulos (Ex: Beta, Fundador)</label>
                    <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="Separe por vírgula..." className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 text-sm font-medium text-white outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center justify-between">
                      Tempo Total Logado (Segundos)
                    </label>
                    <div className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] text-sm font-medium text-white/60">
                      {editingUser.total_time_logged_in || 0} segundos (~{Math.round((editingUser.total_time_logged_in || 0) / 60)} min)
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Assinatura e Permissões */}
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-white/60 uppercase tracking-widest flex items-center gap-2"><Crown className="w-4 h-4" /> Plano & Acesso</h3>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Status da Conta</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 text-sm font-medium text-white outline-none appearance-none">
                      <option value="active" className="bg-[#14141e]">Ativo</option>
                      <option value="inactive" className="bg-[#14141e]">Inativo</option>
                      <option value="suspended" className="bg-[#14141e]">Suspenso</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Plano de Assinatura</label>
                    <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)} className="w-full p-3 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 text-sm font-medium text-white outline-none appearance-none">
                      <option value="monthly" className="bg-[#14141e]">Mensal</option>
                      <option value="quarterly" className="bg-[#14141e]">Trimestral</option>
                      <option value="annual" className="bg-[#14141e]">Anual</option>
                      <option value="free" className="bg-[#14141e]">Gratuito</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2 text-amber-500"><Clock className="w-3 h-3" />Acesso Temporário Até:</label>
                    <input type="date" value={editTempAccess} onChange={(e) => setEditTempAccess(e.target.value)} className="w-full p-3 bg-amber-500/5 outline-none rounded-xl border border-amber-500/20 focus:border-amber-500 text-sm font-medium text-amber-500" />
                    <p className="text-[10px] text-white/30 mt-1">Se preenchido, o usuário perderá o acesso premium após esta data.</p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Features Habilitadas</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['post_generator', 'ads_generator', 'ideas_generator', 'storytelling'].map(feat => (
                        <label key={feat} className="flex items-center gap-2 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl cursor-pointer hover:bg-white/[0.04]">
                          <input type="checkbox" checked={editFeatures.includes(feat)} onChange={(e) => {
                            if (e.target.checked) setEditFeatures([...editFeatures, feat]);
                            else setEditFeatures(editFeatures.filter(f => f !== feat));
                          }} className="w-4 h-4 accent-violet-500" />
                          <span className="text-xs font-bold text-white/70 capitalize">{feat.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
