import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  AtSign,
  Upload,
  Save,
  Loader2,
  Settings,
  LogOut,
  Library,
  Image as ImageIcon,
  Video,
  Target,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, LibraryItem } from '../types';
import { toast } from 'sonner';

import { supabase } from '../lib/supabase';

import { useAuth } from '../contexts/AuthContext';
import { APP_VERSION } from '../config/appVersion';

interface ProfileViewProps {
  userEmail: string;
  initialProfile?: UserProfile | null;
  initialTab?: 'library' | 'settings';
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteLibraryItem: (id: number) => void;
  onUseItem?: (item: LibraryItem) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userEmail, initialProfile, initialTab = 'library', onUpdateProfile, onDeleteLibraryItem, onUseItem }) => {
  const { signOut, user: authUser, isAdmin } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || { id: authUser?.id || '', email: userEmail, name: '', handle: '', avatarUrl: '' });
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'library' | 'settings'>(initialTab);

  // Memory Card Slots State
  const [activeAudienceSlot, setActiveAudienceSlot] = useState(0);
  const [audienceSlots, setAudienceSlots] = useState<string[]>(['', '', '']);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { user } = (await supabase.auth.getUser()).data;
        if (!user) return;

        const [profileRes, libraryRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('library').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        if (profileRes.error && profileRes.error.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileRes.error);
        } else if (profileRes.data) {
          const profileData = profileRes.data as UserProfile;
          setProfile(profileData);

          // Parse Audience Slots
          try {
            if (profileData.saved_audience) {
              const parsed = JSON.parse(profileData.saved_audience);
              if (Array.isArray(parsed)) {
                setAudienceSlots(parsed.length >= 3 ? parsed.slice(0, 3) : [...parsed, ...Array(3 - parsed.length).fill('')]);
              } else {
                setAudienceSlots([profileData.saved_audience, '', '']);
              }
            }
          } catch (e) {
            setAudienceSlots([profileData.saved_audience || '', '', '']);
          }

        }

        if (libraryRes.error) {
          console.error('Error fetching library:', libraryRes.error);
        } else if (libraryRes.data) {
          setLibrary(libraryRes.data as LibraryItem[]);
        }
      } catch (err) {
        console.error('Error fetching profile data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userEmail]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
          saved_audience: JSON.stringify(audienceSlots)
        })
        .eq('id', user.id);

      if (error) throw error;
      onUpdateProfile(profile);
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Error saving profile', err);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => prev ? { ...prev, avatarUrl: publicUrl } : null);
      toast.success('Imagem carregada com sucesso!');
    } catch (err) {
      console.error('Error uploading avatar', err);
      toast.error('Erro ao carregar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const { error } = await supabase.from('library').delete().eq('id', id);
      if (error) throw error;

      setLibrary(prev => prev.filter(item => item.id !== id));
      onDeleteLibraryItem(id);
      toast.success('Item removido da biblioteca.');
    } catch (err) {
      console.error('Error deleting item', err);
      toast.error('Erro ao remover item.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-black/20" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left: Profile Card & Navigation */}
        <div className="lg:w-80 shrink-0 space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-[#14141e] p-8 rounded-3xl border border-slate-200 dark:border-white/[0.06] flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="w-28 h-28 rounded-full border-4 border-[#14141e] shadow-xl overflow-hidden relative group/avatar z-10 bg-slate-100 dark:bg-white/[0.02] mb-6">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-400 dark:text-white/20" />
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                <Upload className="w-6 h-6 text-slate-900 dark:text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="z-10 w-full animate-fade-in">
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-1 truncate">{profile?.name || 'Seu Nome'}</h2>
              <p className="text-sm font-bold text-violet-400 mb-4 truncate">@{profile?.handle || 'seu.arroba'}</p>

              <p className="text-xs font-medium text-slate-500 dark:text-white/50 leading-relaxed mb-6 line-clamp-3">
                {profile?.bio || 'Adicione uma bio nas configurações para que as pessoas conheçam você melhor.'}
              </p>

              <div className="w-full pt-6 border-t border-slate-200 dark:border-white/[0.06] grid grid-cols-2 gap-4">
                <div className="text-center group/stat cursor-default">
                  <p className="text-lg font-black text-slate-900 dark:text-white group-hover/stat:text-violet-400 transition-colors">{library.length}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">Total Salvos</p>
                </div>
                <div className="text-center group/stat cursor-default">
                  <p className="text-lg font-black text-slate-900 dark:text-white group-hover/stat:text-blue-400 transition-colors">{library.filter(i => i.type === 'static').length}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">Posts Imagem</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                "w-full p-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase tracking-widest text-[10px]",
                activeTab === 'library'
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "bg-slate-100 dark:bg-white/[0.02] text-slate-500 dark:text-white/40 hover:bg-white/[0.06] hover:text-slate-900 dark:text-white"
              )}
            >
              <Library className={cn("w-4 h-4", activeTab === 'library' ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40")} />
              Meu Acervo
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-full p-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase tracking-widest text-[10px]",
                activeTab === 'settings'
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "bg-slate-100 dark:bg-white/[0.02] text-slate-500 dark:text-white/40 hover:bg-white/[0.06] hover:text-slate-900 dark:text-white"
              )}
            >
              <Settings className={cn("w-4 h-4", activeTab === 'settings' ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-white/40")} />
              Configurar Perfil
            </button>
            <button
              onClick={signOut}
              className="w-full p-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase tracking-widest text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 mt-6 border border-red-500/20"
            >
              <LogOut className="w-4 h-4" />
              Desconectar
            </button>
          </nav>
        </div>

        {/* Right: Content Area */}
        <div className="flex-1">
          {activeTab === 'library' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Sua Biblioteca</h1>
                  <p className="text-sm font-medium text-slate-500 dark:text-white/40">Todo o seu conteúdo genial salvo em um só lugar.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">{library.length} Itens Salvos</span>
                </div>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {library.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-[#14141e] rounded-2xl border border-slate-200 dark:border-white/[0.06] overflow-hidden group flex flex-col hover:border-white/[0.15] transition-all"
                  >
                    <div className="aspect-[4/3] bg-slate-100 dark:bg-white/[0.02] flex items-center justify-center relative overflow-hidden">
                      {/* Background decor based on type */}
                      <div className={cn(
                        "absolute inset-0 opacity-[0.03] pointer-events-none transition-transform group-hover:scale-110 duration-700",
                        item.type === 'ad-script' ? "bg-blue-500" :
                          item.type === 'storytelling-script' ? "bg-purple-500" :
                            item.type === 'insight' ? "bg-emerald-500" : "bg-violet-500"
                      )} />

                      {item.type === 'static' ? (
                        <div className="w-full h-full p-4 flex items-center justify-center">
                          <div
                            className="w-full max-w-[160px] aspect-square rounded-xl shadow-2xl overflow-hidden flex flex-col transform group-hover:-rotate-2 transition-transform duration-300 ring-1 ring-white/10"
                            style={{ backgroundColor: (item.content as any).primaryColor, color: (item.content as any).secondaryColor }}
                          >
                            <div className="p-3 flex-1 flex flex-col justify-center text-center">
                              <p className="text-[8px] font-black leading-tight line-clamp-4">{(item.content as any).slides[0]?.title}</p>
                            </div>
                          </div>
                        </div>
                      ) : item.type === 'ad-script' ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Video className="w-6 h-6 text-blue-400" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/70">Social Ads</span>
                        </div>
                      ) : item.type === 'storytelling-script' ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Library className="w-6 h-6 text-purple-400" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/70">Storytelling</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Target className="w-6 h-6 text-emerald-400" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/70">Insights</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button
                          onClick={() => {
                            if (onUseItem) onUseItem(item);
                            else toast.info('Recurso em desenvolvimento: Abrir item');
                          }}
                          className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white flex items-center justify-center transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-slate-900 dark:text-white flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight flex-1">
                        {item.type === 'static' ? 'Carrossel Estático' : (item.content as any).title || 'Sem título'}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 dark:bg-white/[0.03]",
                          item.type === 'static' ? "text-violet-400" :
                            item.type === 'ad-script' ? "text-blue-400" :
                              item.type === 'storytelling-script' ? "text-purple-400" : "text-emerald-400"
                        )}>
                          {item.type === 'static' ? 'Posts' : item.type === 'ad-script' ? 'Ads' : item.type === 'storytelling-script' ? 'Story' : 'Insight'}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/30">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {library.length === 0 && (
                  <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white dark:bg-[#14141e] border border-slate-200 dark:border-white/[0.06] border-dashed rounded-3xl">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
                      <Library className="w-6 h-6 text-slate-400 dark:text-white/20" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Nenhum criativo salvo</p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-white/40 max-w-xs text-center">Use as ferramentas ao lado para gerar conteúdos e salve-os aqui para acessar mais tarde.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-2xl"
            >
              <header>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Configurações do Perfil</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-white/40">Personalize como você aparece no {APP_VERSION === 'Blent' ? 'Blent' : 'Blent Boost'}.</p>
              </header>

              <div className="bg-white dark:bg-[#14141e] p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-white/[0.06] space-y-8 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Avatar</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.02]">
                        {profile?.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-10 h-10 text-slate-400 dark:text-white/10" />
                          </div>
                        )}
                      </div>
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full backdrop-blur-sm">
                        <Upload className="w-6 h-6 text-slate-900 dark:text-white" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={isUploading}
                        />
                      </label>
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-md">
                          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="px-5 py-2.5 bg-slate-100 dark:bg-white/[0.04] text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/[0.08] transition-all flex items-center gap-2 border border-slate-300 dark:border-white/[0.08] hover:border-white/[0.15]">
                          <Upload className="w-3.5 h-3.5" />
                          {isUploading ? 'Carregando...' : 'Alterar Foto'}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={isUploading}
                          />
                        </label>
                        {profile?.avatarUrl && (
                          <button
                            onClick={() => setProfile(prev => prev ? { ...prev, avatarUrl: '' } : null)}
                            className="px-5 py-2.5 bg-red-500/10 text-red-500 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-white/30 leading-relaxed">Formatos recomendados: JPG, PNG. O tamanho máximo é 2MB. A imagem será recortada no formato circular perfeito.</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Nome de Exibição / Público</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/20" />
                      <input
                        type="text"
                        value={profile?.name || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Ex: David Silva"
                        className="w-full py-4 pl-12 pr-4 bg-slate-100 dark:bg-white/[0.02] border border-slate-300 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.04] transition-all text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Username (Seu Arroba)</label>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/20" />
                      <input
                        type="text"
                        value={profile?.handle || ''}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, handle: e.target.value.replace('@', '') } : null)}
                        placeholder="david.silva"
                        className="w-full py-4 pl-12 pr-4 bg-slate-100 dark:bg-white/[0.02] border border-slate-300 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.04] transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Bio / Sobre Você (Opcional)</label>
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20">{profile?.bio?.length || 0}/160</span>
                  </div>
                  <textarea
                    value={profile?.bio || ''}
                    maxLength={160}
                    onChange={(e) => setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    className="w-full p-4 bg-slate-100 dark:bg-white/[0.02] border border-slate-300 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.04] transition-all text-sm font-medium resize-none h-[120px]"
                    placeholder="Escreva uma breve descrição sobre o seu trabalho, propósito ou expertise para as pessoas saberem quem você é..."
                  />
                </div>

                <div className="relative z-10 pt-6 border-t border-slate-200 dark:border-white/[0.06]">
                  {/* Audience Memory Card */}
                  {(APP_VERSION === 'boost' || isAdmin) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">Público Alvo (Memory Card)</label>
                        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-lg">
                          {[0, 1, 2].map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setActiveAudienceSlot(slot)}
                              className={cn(
                                "w-6 h-6 rounded-md text-[10px] font-black transition-all",
                                activeAudienceSlot === slot
                                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                  : "text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/50"
                              )}
                            >
                              {slot + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={audienceSlots[activeAudienceSlot] || ''}
                        onChange={(e) => {
                          const newSlots = [...audienceSlots];
                          newSlots[activeAudienceSlot] = e.target.value;
                          setAudienceSlots(newSlots);
                        }}
                        className="w-full p-4 bg-slate-100 dark:bg-white/[0.02] border border-slate-300 dark:border-white/[0.08] rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.04] transition-all text-sm font-medium resize-none h-[140px]"
                        placeholder={`Perfil de Público ${activeAudienceSlot + 1}: Ex: Empreendedores de 25-45 anos...`}
                      />
                    </div>
                  )}

                </div>
              </div>

              <div className="relative z-10 pt-6 border-t border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[11px] font-medium text-slate-400 dark:text-white/30 max-w-sm">
                  As informações do seu perfil são atualizadas imediatamente e podem aparecer nos seus criativos gerados.
                </p>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-500 focus:ring-4 focus:ring-violet-500/20 text-slate-900 dark:text-white rounded-xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-violet-500/20 whitespace-nowrap"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
