import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Instagram,
    Youtube,
    Facebook,
    Video,
    Loader2,
    LayoutTemplate,
    Image as ImageIcon,
    Sparkles,
    Download,
    X,
    Filter
} from 'lucide-react';
import { APP_VERSION } from '../config/appVersion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Platform, PlannerPost } from '../types';
import { generateCaption } from '../services/gemini';
// import { getLevelInfo } from '../lib/levelUtils';
// import { publishToInstagram, checkInstagramConnection } from '../services/instagram';

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
    instagram: Instagram,
    tiktok: Video,
    facebook: Facebook,
    youtube: Youtube,
};

const PLATFORM_COLORS: Record<Platform, string> = {
    instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    tiktok: 'bg-white/10 text-white border-white/20',
    facebook: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    youtube: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PLATFORM_FORMATS: Record<Platform, string[]> = {
    instagram: ['Estático', 'Carrossel', 'Reels', 'Story'],
    tiktok: ['Vídeo', 'Foto'],
    facebook: ['Post', 'Reels', 'Story'],
    youtube: ['Vídeo Longo', 'Short', 'Comunidade']
};

export const PlannerDashboard: React.FC = () => {
    const { user, isAdmin, profile: userProfile } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [posts, setPosts] = useState<PlannerPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [draggedPost, setDraggedPost] = useState<PlannerPost | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);

    const [newTitle, setNewTitle] = useState('');
    const [newPlatform, setNewPlatform] = useState<Platform>('instagram');
    const [newFormat, setNewFormat] = useState<string>('Estático');
    const [newDescription, setNewDescription] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [newCaption, setNewCaption] = useState('');

    // New states for scheduling
    const [newIsIdea, setNewIsIdea] = useState(true);
    const [newScheduledTime, setNewScheduledTime] = useState('12:00');

    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [generatingCaption, setGeneratingCaption] = useState(false);
    const [publishingNow, setPublishingNow] = useState(false);
    const [isInstagramConnected, setIsInstagramConnected] = useState(false);

    // Social Settings Modal
    const [showSocialModal, setShowSocialModal] = useState(false);
    const [socialToken, setSocialToken] = useState('');
    const [socialUserId, setSocialUserId] = useState('');
    const [connecting, setConnecting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPosts();
        checkConnection();
    }, [currentDate]);

    const checkConnection = async () => {
        /* Arquivado: Verificação de Conexão Instagram
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                const connected = await checkInstagramConnection(userData.user.id);
                setIsInstagramConnected(connected);
            }
        } catch (e) {
            console.error(e);
        }
        */
    };

    useEffect(() => {
        // Ensure format matches platform
        if (!PLATFORM_FORMATS[newPlatform].includes(newFormat)) {
            setNewFormat(PLATFORM_FORMATS[newPlatform][0]);
        }
    }, [newPlatform, newFormat]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).toISOString();
            // the last day of the month time set to 23:59:59
            const lastDay = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            const { data, error } = await supabase
                .from('planner_posts')
                .select('*')
                .gte('start_date', firstDay)
                .lte('start_date', lastDay)
                .order('start_date', { ascending: true });

            if (error) throw error;
            setPosts(data || []);
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao carregar os posts do calendário.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const openAddModal = (date: Date) => {
        setSelectedDate(date);
        setEditingPostId(null);
        setNewTitle('');
        setNewPlatform('instagram');
        setNewFormat('Estático');
        setNewDescription('');
        setNewImageUrl('');
        setNewCaption('');
        setNewIsIdea(true);
        setNewScheduledTime('12:00');
        setShowModal(true);
    };

    const openEditModal = (post: PlannerPost) => {
        // Reconstruct a local Date object from the YYYY-MM-DD string
        const [year, month, day] = post.start_date.split('-').map(Number);
        setSelectedDate(new Date(year, month - 1, day));

        setEditingPostId(post.id);
        setNewTitle(post.title);
        setNewPlatform(post.platform);
        setNewFormat(post.format || PLATFORM_FORMATS[post.platform][0]);
        setNewDescription(post.description || '');
        setNewImageUrl(post.image_url || '');
        setNewCaption(post.caption || '');
        setNewIsIdea(post.is_idea ?? true);

        let initialTime = '12:00';
        if (post.scheduled_time) {
            const dateObj = new Date(post.scheduled_time);
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            initialTime = `${hours}:${minutes}`;
        }
        setNewScheduledTime(initialTime);

        setShowModal(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const fileExt = file.name.split('.').pop();
            const fileName = `planner-images/${userData.user?.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars') // using avatars bucket as it exists and is public
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setNewImageUrl(publicUrl);
            toast.success('Imagem anexada com sucesso!');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao fazer upload da imagem.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleGenerateCaption = async () => {
        if (!newDescription.trim() && !newTitle.trim()) {
            toast.error('Insira uma ideia ou título primeiro para a IA gerar a legenda.');
            return;
        }
        setGeneratingCaption(true);
        try {
            const textContext = `Título: ${newTitle}\nIdeia/Descrição: ${newDescription}\nFormato: ${newFormat}\nRede Social: ${newPlatform}\nCrie uma legenda altamente engajadora e focada no formato pedido. Não use a palavra "aqui está a legenda", apenas devolva o texto. Se apliqueve, inclua CTA e algumas hashtags no fim.`;
            const aiCaption = await generateCaption(textContext);
            if (aiCaption) {
                setNewCaption(aiCaption);
                toast.success('Legenda gerada perfeitamente!');
            } else {
                toast.error('Falha ao gerar legenda.');
            }
        } catch (e) {
            toast.error('Erro ao conectar com a inteligência artificial.');
        } finally {
            setGeneratingCaption(false);
        }
    };

    const handleSavePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !newTitle.trim()) return;
        setSaving(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Não autenticado');

            const offsetMs = selectedDate.getTimezoneOffset() * 60000;
            const localIso = new Date(selectedDate.getTime() - offsetMs).toISOString().split('T')[0];

            let scheduledTimestamp = null;
            if (!newIsIdea && APP_VERSION === 'boost') { // Only allow scheduling if boost version
                const [hours, minutes] = newScheduledTime.split(':').map(Number);
                const scheduleDate = new Date(selectedDate);
                scheduleDate.setHours(hours, minutes, 0, 0);
                scheduledTimestamp = scheduleDate.toISOString();
            }

            const postPayload = {
                title: newTitle,
                platform: newPlatform,
                format: newFormat,
                description: newDescription,
                image_url: newImageUrl,
                caption: newCaption,
                start_date: localIso,
                is_idea: newIsIdea,
                scheduled_time: scheduledTimestamp,
                status: (newIsIdea ? 'IDEA' : 'SCHEDULED') as 'IDEA' | 'SCHEDULED' | 'PUBLISHED' | 'ERROR',
            };

            if (editingPostId) {
                const { error } = await supabase
                    .from('planner_posts')
                    .update(postPayload)
                    .eq('id', editingPostId);

                if (error) throw error;
                setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, ...postPayload } : p));
                toast.success('Post atualizado!');
            } else {
                const { data, error } = await supabase
                    .from('planner_posts')
                    .insert([{
                        user_id: userData.user.id,
                        ...postPayload,
                        is_posted: false
                    }])
                    .select()
                    .single();

                if (error) throw error;

                setPosts(prev => [...prev, data]);
                toast.success('Post agendado!');

            }
            setShowModal(false);
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao salvar post.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishNow = async () => {
        /* Arquivado: Publicação Direta Instagram
        if (!editingPostId || !newImageUrl) {
            toast.error('O post precisa estar salvo e ter uma imagem anexada para publicar.');
            return;
        }

        if (!isInstagramConnected) {
            toast.error('Você precisa conectar sua conta do Instagram primeiro.');
            return;
        }

        setPublishingNow(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Não autenticado');

            const result = await publishToInstagram(
                editingPostId,
                userData.user.id,
                newImageUrl,
                newCaption || newTitle
            );

            if (result.success) {
                toast.success('Post publicado com sucesso no Instagram! <');
                setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, is_posted: true, status: 'PUBLISHED' } : p));
                setShowModal(false);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao publicar no Instagram.');
        } finally {
            setPublishingNow(false);
        }
        */
    };

    const handleSaveSocialAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setConnecting(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) throw new Error('Não autenticado');

            const { error } = await supabase
                .from('user_social_accounts')
                .upsert({
                    user_id: userData.user.id,
                    platform: 'instagram',
                    access_token: socialToken,
                    platform_user_id: socialUserId
                }, { onConflict: 'user_id,platform' });

            if (error) throw error;

            toast.success('Conta do Instagram conectada com sucesso!');
            setIsInstagramConnected(true);
            setShowSocialModal(false);
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao conectar conta: ' + err.message);
        } finally {
            setConnecting(false);
        }
    };

    const handleToggleStatus = async (e: React.MouseEvent, post: PlannerPost) => {
        e.stopPropagation();
        try {
            const newStatus = !post.is_posted;
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_posted: newStatus } : p));
            const { error } = await supabase.from('planner_posts').update({ is_posted: newStatus }).eq('id', post.id);
            if (error) throw error;
        } catch (err) {
            console.error(err);
            toast.error('Erro ao atualizar status.');
            fetchPosts();
        }
    };

    const handleDeletePost = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Excluir este planejamento?')) return;
        try {
            setPosts(prev => prev.filter(p => p.id !== id));
            const { error } = await supabase.from('planner_posts').delete().eq('id', id);
            if (error) throw error;
            toast.success('Planejamento excluído.');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao excluir.');
            fetchPosts();
        }
    };

    // Calendar Logic
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const getPostsForDay = (dayOrDate: number | Date) => {
        const dateStr = typeof dayOrDate === 'number'
            ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOrDate).toLocaleDateString('sv-SE')
            : dayOrDate.toLocaleDateString('sv-SE');

        return posts
            .filter(p => p.start_date.startsWith(dateStr))
            .sort((a, b) => {
                if (a.scheduled_time && b.scheduled_time) {
                    return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
                }
                return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
            });
    };

    const handleDragStart = (e: React.DragEvent, post: PlannerPost) => {
        setDraggedPost(post);
        e.dataTransfer.setData('postId', post.id);
        e.dataTransfer.effectAllowed = 'move';

        // Custom ghost image (optional, but keep it simple)
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
        setDraggedPost(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
        e.preventDefault();
        const postId = e.dataTransfer.getData('postId');
        if (!postId) return;

        const dateStr = targetDate.toLocaleDateString('sv-SE');

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                // If it has a scheduled time, we should adjust it to the new date
                let newScheduledTime = p.scheduled_time;
                if (p.scheduled_time) {
                    const oldTime = new Date(p.scheduled_time);
                    const newTime = new Date(targetDate);
                    newTime.setHours(oldTime.getHours(), oldTime.getMinutes(), 0, 0);
                    newScheduledTime = newTime.toISOString();
                }
                return { ...p, start_date: dateStr, scheduled_time: newScheduledTime };
            }
            return p;
        }));

        try {
            const updates: any = { start_date: dateStr };

            // Adjust scheduled_time if it exists
            const post = posts.find(p => p.id === postId);
            if (post?.scheduled_time) {
                const oldTime = new Date(post.scheduled_time);
                const newTime = new Date(targetDate);
                newTime.setHours(oldTime.getHours(), oldTime.getMinutes(), 0, 0);
                updates.scheduled_time = newTime.toISOString();
            }

            const { error } = await supabase
                .from('planner_posts')
                .update(updates)
                .eq('id', postId);

            if (error) throw error;
            toast.success('Post reagendado!');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao reagendar post.');
            fetchPosts();
        }
    };

    const getWeekDates = () => {
        const dates = [];
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);

        for (let i = 0; i < 7; i++) {
            dates.push(new Date(startOfWeek));
            startOfWeek.setDate(startOfWeek.getDate() + 1);
        }
        return dates;
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 flex flex-col h-full">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <CalendarIcon className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-white">Planner</h1>
                        <p className="text-sm font-medium text-white/40 mt-1">Desenvolva ideias e organize os conteúdos do mês.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[#14141e] border border-white/[0.06] rounded-2xl p-2 shadow-xl">
                    <div className="flex bg-white/5 rounded-xl p-1 mr-2">
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === 'month' ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                            )}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === 'week' ? "bg-indigo-500 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                            )}
                        >
                            Semana
                        </button>
                    </div>

                    <button onClick={handlePrevMonth} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="w-40 text-center">
                        <span className="text-sm font-black text-white">{monthNames[currentDate.getMonth()]} </span>
                        <span className="text-sm font-bold text-white/40">{currentDate.getFullYear()}</span>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>

            {/* Connection Status Banner */}
            {/* Connection Status Banner (Archived)
            {!isInstagramConnected && (
                ...
            )} */}

            {/* Calendar Grid */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 bg-[#14141e] rounded-3xl border border-white/[0.06] flex flex-col overflow-hidden shadow-2xl relative">
                {loading && (
                    <div className="absolute inset-0 bg-[#14141e]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                )}

                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-white/[0.06] bg-white/[0.02]">
                    {dayNames.map(day => (
                        <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-white/30 truncate">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {viewMode === 'month' ? (
                        <div className="grid grid-cols-7 auto-rows-fr h-full">
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="border-r border-b border-white/[0.02] bg-white/[0.01]" />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                const dayPosts = getPostsForDay(day);
                                const isToday = day === new Date().getDate() &&
                                    currentDate.getMonth() === new Date().getMonth() &&
                                    currentDate.getFullYear() === new Date().getFullYear();

                                return (
                                    <div
                                        key={day}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, dateObj)}
                                        className="border-r border-b border-white/[0.04] p-1.5 sm:p-2 min-h-[120px] flex flex-col group hover:bg-white/[0.02] transition-colors relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn(
                                                "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all",
                                                isToday ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-white/40 group-hover:text-white"
                                            )}>
                                                {day}
                                            </span>

                                            <button
                                                onClick={() => openAddModal(dateObj)}
                                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-white/0 hover:text-indigo-400 group-hover:text-white/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            {dayPosts.map(post => {
                                                const PlatformIcon = PLATFORM_ICONS[post.platform];
                                                return (
                                                    <div
                                                        key={post.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, post)}
                                                        onDragEnd={handleDragEnd}
                                                        onClick={() => openEditModal(post)}
                                                        className={cn(
                                                            "px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border flex flex-col gap-1 sm:gap-1.5 group/item transition-all cursor-grab active:cursor-grabbing hover:brightness-125 hover:scale-[1.02]",
                                                            post.is_posted ? "opacity-50 grayscale" : "",
                                                            PLATFORM_COLORS[post.platform]
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between gap-1.5 min-h-[18px]">
                                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                                <PlatformIcon className="w-2.5 h-2.5 shrink-0 opacity-40 group-hover/item:opacity-100 transition-opacity" />
                                                                {!post.is_idea && post.scheduled_time && (
                                                                    <span className="text-[7px] font-black tracking-tight text-white/30 uppercase shrink-0">
                                                                        {new Date(post.scheduled_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all duration-200 translate-x-1 group-hover/item:translate-x-0">
                                                                <button
                                                                    onClick={(e) => handleDeletePost(e as any, post.id)}
                                                                    className="p-0.5 text-white/20 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="w-2.5 h-2.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleToggleStatus(e as any, post)}
                                                                    className="p-0.5 hover:brightness-150 transition-all"
                                                                >
                                                                    {post.is_posted ? <CheckCircle2 className="w-2.5 h-2.5 text-green-400" /> : <Circle className="w-2.5 h-2.5 text-white/20" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className={cn(
                                                            "text-[9px] font-medium leading-[1.1] line-clamp-2 transition-colors",
                                                            post.is_posted ? "text-white/30 line-through decoration-white/20" : "text-white/90 group-hover/item:text-white"
                                                        )}>
                                                            {post.title}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-[#0a0a0f] overflow-x-hidden">
                            {getWeekDates().map((date, idx) => {
                                const dayPosts = getPostsForDay(date);
                                const isToday = date.toDateString() === new Date().toDateString();

                                // Period Grouping Logic
                                const morningPosts = dayPosts.filter(p => {
                                    if (!p.scheduled_time) return false;
                                    const hour = new Date(p.scheduled_time).getHours();
                                    return hour >= 5 && hour < 12;
                                });
                                const afternoonPosts = dayPosts.filter(p => {
                                    if (!p.scheduled_time) return false;
                                    const hour = new Date(p.scheduled_time).getHours();
                                    return hour >= 12 && hour < 18;
                                });
                                const eveningPosts = dayPosts.filter(p => {
                                    if (!p.scheduled_time) return false;
                                    const hour = new Date(p.scheduled_time).getHours();
                                    return hour >= 18 || hour < 5;
                                });
                                const flexiblePosts = dayPosts.filter(p => !p.scheduled_time);

                                return (
                                    <div
                                        key={idx}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, date)}
                                        className={cn(
                                            "flex flex-col lg:flex-row border-b border-white/[0.04] group hover:bg-white/[0.01] transition-all duration-500",
                                            isToday ? "bg-indigo-500/[0.02]" : ""
                                        )}
                                    >
                                        {/* Day Header/Sidebar */}
                                        <div className="w-full lg:w-48 p-6 lg:border-r border-white/[0.04] flex lg:flex-col items-center justify-between lg:justify-center relative overflow-hidden shrink-0">
                                            {isToday && (
                                                <div className="absolute top-0 left-0 w-1 lg:w-full lg:h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                                            )}

                                            <div className="text-center">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.3em] mb-1 block",
                                                    isToday ? "text-indigo-400" : "text-white/20"
                                                )}>
                                                    {dayNames[date.getDay()]}
                                                </span>
                                                <span className={cn(
                                                    "text-4xl font-black tracking-tighter leading-none block",
                                                    isToday ? "text-white" : "text-white/40"
                                                )}>
                                                    {date.getDate().toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-1 block">
                                                    {monthNames[date.getMonth()].substring(0, 3)}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => openAddModal(date)}
                                                className="w-10 h-10 lg:w-12 lg:h-12 lg:mt-6 rounded-2xl bg-white/5 hover:bg-indigo-500 text-white/40 hover:text-white flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Content Area */}
                                        <div className="flex-1 p-6 space-y-8">
                                            {dayPosts.length === 0 ? (
                                                <div className="h-24 flex items-center justify-center border border-dashed border-white/5 rounded-[30px] bg-white/[0.01]">
                                                    <p className="text-[10px] font-black text-white/5 uppercase tracking-[0.2em]">Sem publicações planejadas</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {/* Periods */}
                                                    {[
                                                        { label: 'Manhã', posts: morningPosts, icon: '<', color: 'text-orange-400' },
                                                        { label: 'Tarde', posts: afternoonPosts, icon: ' ', color: 'text-yellow-400' },
                                                        { label: 'Noite', posts: eveningPosts, icon: '<', color: 'text-indigo-400' },
                                                        { label: 'Flexível', posts: flexiblePosts, icon: '¡', color: 'text-emerald-400' }
                                                    ].filter(period => period.posts.length > 0).map((period, pIdx) => (
                                                        <div key={pIdx} className="space-y-4">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs">{period.icon}</span>
                                                                <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", period.color)}>
                                                                    {period.label}
                                                                </span>
                                                                <div className="h-[1px] flex-1 bg-white/5" />
                                                            </div>

                                                            <div className="space-y-3">
                                                                {period.posts.map(post => {
                                                                    const PlatformIcon = PLATFORM_ICONS[post.platform];
                                                                    return (
                                                                        <motion.div
                                                                            key={post.id}
                                                                            layoutId={post.id}
                                                                            draggable
                                                                            onDragStart={(e) => handleDragStart(e as any, post)}
                                                                            onDragEnd={handleDragEnd as any}
                                                                            onClick={() => openEditModal(post)}
                                                                            className={cn(
                                                                                "relative p-4 rounded-[24px] border border-white/10 flex flex-col gap-3 group/item transition-all duration-300 cursor-grab active:cursor-grabbing hover:translate-y-[-4px]",
                                                                                post.is_posted ? "opacity-40 grayscale" : "shadow-xl shadow-black/40 hover:border-indigo-500/50",
                                                                                PLATFORM_COLORS[post.platform]
                                                                            )}
                                                                        >
                                                                            {/* Background Glow */}
                                                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity rounded-[24px]" />

                                                                            <div className="flex items-start justify-between relative z-10">
                                                                                <div className="p-2 bg-black/20 rounded-xl">
                                                                                    <PlatformIcon className="w-4 h-4" />
                                                                                </div>
                                                                                {post.scheduled_time && (
                                                                                    <span className="text-[10px] font-black tracking-widest bg-black/40 text-white/80 px-3 py-1 rounded-full backdrop-blur-md">
                                                                                        {new Date(post.scheduled_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <p className={cn(
                                                                                "text-[13px] font-bold leading-tight line-clamp-2 relative z-10",
                                                                                post.is_posted ? "line-through decoration-white/30" : "text-white"
                                                                            )}>
                                                                                {post.title}
                                                                            </p>

                                                                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5 relative z-10">
                                                                                <div className="flex items-center gap-2">
                                                                                    {post.image_url ? (
                                                                                        <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                                                                                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="w-6 h-6 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-[8px] font-black opacity-20">
                                                                                            {post.format?.charAt(0) || 'P'}
                                                                                        </div>
                                                                                    )}
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30 truncate max-w-[80px]">
                                                                                        {post.format || 'POST'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-1">
                                                                                    <button
                                                                                        onClick={(e) => handleDeletePost(e as any, post.id)}
                                                                                        className="w-7 h-7 rounded-full bg-red-500/10 text-red-400/40 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all duration-300"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => handleToggleStatus(e as any, post)}
                                                                                        className={cn(
                                                                                            "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                                                                                            post.is_posted ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20 hover:bg-white/10 hover:text-white"
                                                                                        )}
                                                                                    >
                                                                                        {post.is_posted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => !saving && setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#14141e] border border-white/[0.08] rounded-3xl w-full max-w-2xl my-8 shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                                            <LayoutTemplate className="w-5 h-5 text-indigo-400" />
                                            {editingPostId ? 'Editar Post' : 'Agendar Post'}
                                        </h3>
                                        <p className="text-sm font-medium text-white/40 mt-1">
                                            Data: {selectedDate?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSavePost} className="space-y-6">
                                    {/* IDEA VS SCHEDULE TOGGLE */}
                                    {APP_VERSION === 'boost' && (
                                        <div className="flex bg-white/[0.02] p-1 rounded-2xl border border-white/[0.05]">
                                            <button
                                                type="button"
                                                onClick={() => setNewIsIdea(true)}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    newIsIdea
                                                        ? "bg-indigo-500/20 text-indigo-300 shadow-lg"
                                                        : "text-white/40 hover:text-white/80"
                                                )}
                                            >
                                                Apenas uma Ideia =¡
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewIsIdea(false)}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                    !newIsIdea
                                                        ? "bg-green-500/20 text-green-300 shadow-lg"
                                                        : "text-white/40 hover:text-white/80"
                                                )}
                                            >
                                                Agendar Post =
                                            </button>
                                        </div>
                                    )}

                                    {/* PLATAFORM AND FORMAT */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Plataforma</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(Object.keys(PLATFORM_COLORS) as Platform[]).map(plat => {
                                                    const Icon = PLATFORM_ICONS[plat];
                                                    return (
                                                        <button
                                                            key={plat}
                                                            type="button"
                                                            onClick={() => setNewPlatform(plat)}
                                                            className={cn(
                                                                "p-2.5 rounded-xl border flex justify-center items-center gap-1.5 transition-all font-bold text-[10px] uppercase tracking-widest",
                                                                newPlatform === plat
                                                                    ? PLATFORM_COLORS[plat]
                                                                    : "bg-white/[0.02] border-white/[0.05] text-white/40 hover:bg-white/[0.05] hover:text-white/70"
                                                            )}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                            {plat}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Formato</label>
                                            <div className="flex flex-wrap gap-2">
                                                {PLATFORM_FORMATS[newPlatform].map(fmt => (
                                                    <button
                                                        key={fmt}
                                                        type="button"
                                                        onClick={() => setNewFormat(fmt)}
                                                        className={cn(
                                                            "px-3 py-2 rounded-lg border transition-all text-xs font-bold whitespace-nowrap",
                                                            newFormat === fmt
                                                                ? "bg-indigo-500/20 border-indigo-500 border-opacity-50 text-indigo-300"
                                                                : "bg-white/[0.02] border-white/[0.05] text-white/40 hover:text-white/80"
                                                        )}
                                                    >
                                                        {fmt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {!newIsIdea && APP_VERSION === 'boost' && (
                                        <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Horário da Publicação</label>
                                            <input
                                                type="time"
                                                value={newScheduledTime}
                                                onChange={e => setNewScheduledTime(e.target.value)}
                                                className="w-full p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.08] focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm font-bold text-white outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* TITLE AND DESC */}
                                    <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Título do Post</label>
                                            <input
                                                type="text"
                                                value={newTitle}
                                                onChange={e => setNewTitle(e.target.value)}
                                                placeholder="Ex: Como viralizar seu Reels no Instagram..."
                                                className="w-full p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.08] focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm font-bold text-white placeholder:text-white/20 outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Descrição / Ideia Principal</label>
                                            <textarea
                                                value={newDescription}
                                                onChange={e => setNewDescription(e.target.value)}
                                                placeholder="Rabisque a ideia sobre o que quer falar nesse post. O que você não pode esquecer?"
                                                className="w-full p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.08] focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm text-white placeholder:text-white/20 outline-none h-24 resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* MEDIA & AI CAPTION */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.06]">
                                        {/* Media Upload */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex justify-between">
                                                <span>Mídia Reutilizável</span>
                                                <span className="opacity-50 lowercase tracking-normal font-normal text-[10px]">(Ex: Post já desenhado)</span>
                                            </label>

                                            <div
                                                className="w-full h-32 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-2xl hover:bg-white/[0.04] hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative overflow-hidden group"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*,video/mp4"
                                                    onChange={handleImageUpload}
                                                />

                                                {newImageUrl ? (
                                                    <>
                                                        <img src={newImageUrl} alt="Anexo do Post" className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-all" />
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/40">
                                                            <ImageIcon className="w-6 h-6 text-white mb-2" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Trocar Mídia</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setNewImageUrl(''); }}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <a
                                                            href={newImageUrl}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="absolute bottom-2 left-2 p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            <Download className="w-3 h-3" /> Baixar
                                                        </a>
                                                    </>
                                                ) : uploadingImage ? (
                                                    <div className="flex flex-col items-center gap-2 text-indigo-400">
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Enviando...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-white/30 group-hover:text-indigo-400 transition-colors">
                                                        <ImageIcon className="w-6 h-6" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Anexar Mídia (Img/Vid)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* AI Caption */}
                                        <div className="space-y-2 flex flex-col h-full">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Legenda</label>
                                                {APP_VERSION === 'boost' && (
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateCaption}
                                                        disabled={generatingCaption || (!newDescription && !newTitle)}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-indigo-500/20"
                                                    >
                                                        {generatingCaption ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        Gerar com IA
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                value={newCaption}
                                                onChange={e => setNewCaption(e.target.value)}
                                                placeholder="Sua legenda do post. Use o botão Gerar com IA caso esteja sem ideias!"
                                                className="w-full flex-1 p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.08] focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all text-sm text-white placeholder:text-white/20 outline-none resize-none min-h-[8rem]"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-3 pt-6 border-t border-white/[0.06] mt-8">
                                        {/* Publicação Direta (Arquivada)
                                        {!newIsIdea && editingPostId && (
                                            <button
                                                type="button"
                                                onClick={handlePublishNow}
                                                disabled={publishingNow || saving || uploadingImage || !newImageUrl}
                                                className={cn(
                                                    "w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-pink-500/20 mb-2",
                                                    !isInstagramConnected && "opacity-50 grayscale"
                                                )}
                                            >
                                                {publishingNow ? <Loader2 className="w-5 h-5 animate-spin" /> : <Instagram className="w-5 h-5" />}
                                                {isInstagramConnected ? 'Publicar no Instagram Agora' : 'Instagram Não Conectado'}
                                            </button>
                                        )} */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => !saving && setShowModal(false)}
                                                className="py-3.5 px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={saving || uploadingImage || !newTitle.trim()}
                                                className={cn(
                                                    "flex-1 py-3.5 text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg",
                                                    newIsIdea ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20" : "bg-green-600 hover:bg-green-500 shadow-green-500/20"
                                                )}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : newIsIdea ? 'Salvar Ideia' : 'Agendar / Publicar'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Social Connection Modal (Archivado)
            <AnimatePresence>
                {showSocialModal && (
                    ...
                )}
            </AnimatePresence> */}
        </div>
    );
};
