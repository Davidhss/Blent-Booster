import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Plus, Zap, Loader2, Trash2, X, Palette, Check, Maximize2, CheckCircle2, History, Clock, Save, AlertCircle, CalendarDays, Folder, FolderOpen, FolderPlus, SquareCheck, GripVertical, MoreHorizontal, Pencil, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { optimizeIdea } from '../services/gemini';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { APP_VERSION } from '../config/appVersion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';



interface ChecklistItem {
    id: string;
    text: string;
    done: boolean;
}

interface IdeaFolder {
    id: number;
    name: string;
    color: string;
    created_at: string;
    parent_id?: number | null;
}

interface Idea {
    id: number;
    created_at: string;
    folder_id?: number | null;
    content: {
        note: string;
        color?: string;
        title?: string;
        expansion?: string;
        facts?: string[];
        cta?: string;
        isCompleted?: boolean;
        checklist?: ChecklistItem[];
    };
}

const NOTE_COLORS = [
    { name: 'Amarelo', bg: 'bg-[#fef3c7]', text: 'text-amber-900', border: 'border-amber-200', dot: 'bg-amber-400' },
    { name: 'Azul', bg: 'bg-[#e0f2fe]', text: 'text-sky-900', border: 'border-sky-200', dot: 'bg-sky-400' },
    { name: 'Rosa', bg: 'bg-[#fce7f3]', text: 'text-pink-900', border: 'border-pink-200', dot: 'bg-pink-400' },
    { name: 'Verde', bg: 'bg-[#dcfce7]', text: 'text-emerald-900', border: 'border-emerald-200', dot: 'bg-emerald-400' },
    { name: 'Roxo', bg: 'bg-[#f3e8ff]', text: 'text-purple-900', border: 'border-purple-200', dot: 'bg-purple-400' },
];

const FOLDER_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-orange-500',
];

const LOCAL_STORAGE_KEY = 'Blent_boost_idea_drafts';

function DraggableWrapper({ id, type, children, className }: { id: string | number, type: string, children: React.ReactNode, className?: string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `${type}-${id}`,
        data: { type, id }
    });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 999 : undefined,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} className={cn(className, isDragging && "opacity-50")} {...listeners} {...attributes}>
            {children}
        </div>
    );
}

function DroppableFolderWrapper({ id, children, isDraggable, className }: { id: string | number, children: React.ReactNode, isDraggable?: boolean, className?: string }) {
    const { isOver, setNodeRef: setDroppableRef } = useDroppable({
        id: `folder-drop-${id}`,
        data: { type: 'folder', id }
    });

    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: `folder-drag-${id}`,
        data: { type: 'folder', id },
    }); // Always call hooks conditionally using "disabled" is better, but since it's statically rendered, it's ok for now. Wait, useDraggable takes an object. Let's fix.

    const draggable = useDraggable({
        id: `folder-drag-${id}`,
        data: { type: 'folder', id },
        disabled: !isDraggable
    });

    const setNodeRef = (node: HTMLElement | null) => {
        setDroppableRef(node);
        if (isDraggable) draggable.setNodeRef(node);
    };

    const style = draggable.transform ? {
        transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)`,
        zIndex: draggable.isDragging ? 999 : undefined,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} className={cn(className, draggable.isDragging && "opacity-50", isOver && "ring-2 ring-violet-500 bg-violet-500/10")} {...(isDraggable ? draggable.listeners : {})} {...(isDraggable ? draggable.attributes : {})}>
            {children}
        </div>
    );
}

export const IdeaBank: React.FC = () => {
    const { user, isAdmin, profile: userProfile, refreshProfile } = useAuth();
    const isBlentVersion = APP_VERSION === 'Blent';
    const canUseAI = isAdmin || (APP_VERSION === 'boost');

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [optimizingId, setOptimizingId] = useState<number | null>(null);
    const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduledTime, setScheduledTime] = useState('12:00');
    const [isSendingToPlanner, setIsSendingToPlanner] = useState(false);

    // Folder states
    const [folders, setFolders] = useState<IdeaFolder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null | 'all'>('all');
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [showFolderMenu, setShowFolderMenu] = useState(false);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState<IdeaFolder | null>(null);

    // Checklist states
    const [newChecklistItemText, setNewChecklistItemText] = useState('');

    // Drag & Drop
    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [activeType, setActiveType] = useState<'idea' | 'folder' | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    // Refs for synchronization and state tracking
    const selectedIdeaRef = useRef<Idea | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isDirtyRef = useRef<boolean>(false);
    const latestDirtyContentRef = useRef<any>(null);

    // Sync ref with state
    useEffect(() => {
        selectedIdeaRef.current = selectedIdea;

        // When an idea is selected, check if there's a local backup that's newer/different
        if (selectedIdea) {
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            const localDraft = drafts[selectedIdea.id];
            if (localDraft && localDraft.note !== selectedIdea.content.note) {
                // Technically we could offer to restore, but for now let's just use it if it's there
                // as the user is complaining about data loss.
                // toast.info('Rascunho local recuperado.');
            }
        }
    }, [selectedIdea]);

    useEffect(() => {
        fetchIdeas();
        fetchFolders();

        // Final sync attempt on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (isDirtyRef.current && selectedIdeaRef.current && latestDirtyContentRef.current) {
                syncUpdateToSupabaseQuietly(selectedIdeaRef.current.id, latestDirtyContentRef.current);
            }
        };
    }, [user]);

    const fetchIdeas = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('library')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'idea')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Merge with local drafts if they exist
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            const mergedData = (data || []).map((item: any) => {
                if (drafts[item.id]) {
                    // Restore ALL draft fields (title, note, expansion, facts, cta, color, etc.)
                    const { updatedAt: _ts, ...draftContent } = drafts[item.id];
                    return { ...item, content: { ...item.content, ...draftContent } };
                }
                return item;
            });

            setIdeas(mergedData as Idea[]);
        } catch (err) {
            console.error('Error fetching ideas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFolders = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('idea_folders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setFolders((data || []) as IdeaFolder[]);
        } catch (err) {
            console.error('Error fetching folders:', err);
        }
    };

    const handleCreateFolder = async () => {
        if (!user || !newFolderName.trim()) return;
        try {
            const { data, error } = await supabase
                .from('idea_folders')
                .insert([{ user_id: user.id, name: newFolderName.trim(), color: FOLDER_COLORS[folders.length % FOLDER_COLORS.length], parent_id: null }])
                .select().single();
            if (error) throw error;
            setFolders(prev => [...prev, { ...(data as IdeaFolder), parent_id: data.parent_id || null }]);
            setNewFolderName('');
            setShowNewFolderInput(false);
            toast.success('Pasta criada!');
        } catch (err) {
            toast.error('Erro ao criar pasta.');
        }
    };

    const handleDeleteFolder = async (folderId: number) => {
        try {
            const { error } = await supabase.from('idea_folders').delete().eq('id', folderId);
            if (error) throw error;
            setFolders(prev => prev.filter(f => f.id !== folderId));
            // Unlink ideas that were in this folder
            setIdeas(prev => prev.map(i => i.folder_id === folderId ? { ...i, folder_id: null } : i));
            if (selectedFolderId === folderId) setSelectedFolderId('all');
            toast.success('Pasta removida.');
        } catch (err) {
            toast.error('Erro ao deletar pasta.');
        }
    };

    const handleRenameFolder = async (folder: IdeaFolder, newName: string) => {
        if (!newName.trim()) return;
        try {
            const { error } = await supabase.from('idea_folders').update({ name: newName.trim() }).eq('id', folder.id);
            if (error) throw error;
            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name: newName.trim() } : f));
            setEditingFolder(null);
        } catch (err) {
            toast.error('Erro ao renomear pasta.');
        }
    };

    const handleMoveIdeaToFolder = async (ideaId: number, folderId: number | null) => {
        try {
            const { error } = await supabase.from('library').update({ folder_id: folderId }).eq('id', ideaId);
            if (error) throw error;
            setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, folder_id: folderId } : i));
            if (selectedIdea?.id === ideaId) setSelectedIdea(prev => prev ? { ...prev, folder_id: folderId } : null);
        } catch (err) {
            toast.error('Erro ao mover ideia.');
        }
    };

    // --- Checklist helpers ---
    const handleAddChecklistItem = (idea: Idea) => {
        if (!newChecklistItemText.trim()) return;
        const newItem: ChecklistItem = { id: crypto.randomUUID(), text: newChecklistItemText.trim(), done: false };
        const checklist = [...(idea.content.checklist || []), newItem];
        handleUpdateIdeaContent(idea.id, { ...idea.content, checklist });
        setNewChecklistItemText('');
    };

    const handleToggleChecklistItem = (idea: Idea, itemId: string) => {
        const checklist = (idea.content.checklist || []).map(item =>
            item.id === itemId ? { ...item, done: !item.done } : item
        );
        handleUpdateIdeaContent(idea.id, { ...idea.content, checklist });
    };

    const handleRemoveChecklistItem = (idea: Idea, itemId: string) => {
        const checklist = (idea.content.checklist || []).filter(item => item.id !== itemId);
        handleUpdateIdeaContent(idea.id, { ...idea.content, checklist });
    };

    const handleUpdateChecklistItemText = (idea: Idea, itemId: string, text: string) => {
        const checklist = (idea.content.checklist || []).map(item =>
            item.id === itemId ? { ...item, text } : item
        );
        handleUpdateIdeaContent(idea.id, { ...idea.content, checklist });
    };

    const toggleFolder = (folderId: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };

    const handleMoveFolder = async (folderId: number, parentId: number | null) => {
        try {
            const { error } = await supabase.from('idea_folders').update({ parent_id: parentId }).eq('id', folderId);
            if (error) throw error;
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parent_id: parentId } : f));
            toast.success('Pasta movida!');
        } catch (err) {
            toast.error('Erro ao mover pasta.');
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveType(active.data.current?.type);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        setActiveType(null);
        const { active, over } = event;
        if (!over) return;

        const draggedType = active.data.current?.type;
        const draggedId = active.data.current?.id;
        const targetType = over.data.current?.type;
        const targetId = over.data.current?.id;

        if (draggedType === 'idea' && targetType === 'folder') {
            handleMoveIdeaToFolder(draggedId, targetId === 'all' ? null : targetId);
        } else if (draggedType === 'folder' && targetType === 'folder') {
            if (draggedId === targetId) return;
            // Prevent circular dependency
            let curr = folders.find(f => f.id === targetId);
            while (curr && curr.parent_id) {
                if (curr.parent_id === draggedId) return; // Invalid drop
                curr = folders.find(f => f.id === curr!.parent_id);
            }
            if (targetId === 'all') {
                handleMoveFolder(draggedId, null);
            } else {
                handleMoveFolder(draggedId, targetId);
            }
        }
    };

    const handleAddIdea = async () => {
        if (!user) return;
        const newContent = { note: '', color: 'bg-[#fef3c7]', isCompleted: false };
        try {
            const { data, error } = await supabase
                .from('library')
                .insert([{ user_id: user.id, type: 'idea', content: newContent }])
                .select()
                .single();
            if (error) throw error;
            setIdeas([data as Idea, ...ideas]);
            setSelectedIdea(data as Idea);

            if (data) {
                // Profile will be updated via real-time subscription
            }
        } catch (err) {
            console.error('Error adding idea:', err);
            toast.error('Erro ao criar ideia.');
        }
    };

    const syncUpdateToSupabase = async (id: number, content: any) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('library')
                .update({ content })
                .eq('id', id);

            if (error) throw error;

            // On success, clear local backup for this ID
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            delete drafts[id];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

            isDirtyRef.current = false;
            toast.success('Alterações salvas com sucesso!');


        } catch (error) {
            console.error('Error syncing idea:', error);
            toast.error('Erro ao salvar no banco. O rascunho foi mantido localmente.');
        } finally {
            setTimeout(() => setIsSaving(false), 300);
        }
    };

    const syncUpdateToSupabaseQuietly = (id: number, content: any) => {
        setIsSaving(true);
        supabase
            .from('library')
            .update({ content })
            .eq('id', id)
            .then(({ error }) => {
                if (!error) {
                    const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
                    delete drafts[id];
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));
                    isDirtyRef.current = false;
                }
                setIsSaving(false);
            });
    };

    const handleUpdateIdeaContent = (id: number, content: any, immediate = false) => {
        isDirtyRef.current = true;
        latestDirtyContentRef.current = content;

        // Update local state
        setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, content } : idea));
        if (selectedIdea?.id === id) {
            setSelectedIdea(prev => prev ? { ...prev, content } : null);
        }

        // Update LocalStorage Backup
        const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        // Save the FULL content object so all fields (title, expansion, facts, cta, color) are restored on navigate-back
        drafts[id] = { ...content, updatedAt: new Date().toISOString() };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

        if (immediate) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            syncUpdateToSupabase(id, content);
            return;
        }

        // Debounce sync
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            syncUpdateToSupabaseQuietly(id, content);
        }, 800);
    };

    const handleBlur = () => {
        if (isDirtyRef.current && selectedIdea && latestDirtyContentRef.current) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            syncUpdateToSupabaseQuietly(selectedIdea.id, latestDirtyContentRef.current);
        }
    };

    const handleManualSave = () => {
        if (selectedIdea) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            syncUpdateToSupabase(selectedIdea.id, selectedIdea.content);
        }
    };

    const handleDeleteIdea = async (id: number) => {
        try {
            const { error } = await supabase.from('library').delete().eq('id', id);
            if (error) throw error;
            setIdeas(ideas.filter(idea => idea.id !== id));

            // Clear draft
            const drafts = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
            delete drafts[id];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(drafts));

            if (selectedIdea?.id === id) setSelectedIdea(null);
            toast.success('Ideia removida.');
        } catch (error) {
            console.error('Error deleting idea:', error);
            toast.error('Erro ao deletar ideia.');
        }
    };

    const handleOptimizeIdea = async (idea: Idea) => {
        if (!canUseAI) {
            toast.error('Otimização com IA disponível apenas no Blent Boost.');
            return;
        }
        if (!idea.content.note) {
            toast.error('Escreva sua ideia antes de otimizar.');
            return;
        }
        setOptimizingId(idea.id);
        try {
            const result = await optimizeIdea(idea.content.note);
            if (result) {
                const newContent = {
                    ...idea.content,
                    title: result.title,
                    expansion: result.expansion,
                    facts: result.facts,
                    cta: result.cta
                };
                handleUpdateIdeaContent(idea.id, newContent, true);
                toast.success('Ideia otimizada e salva!');

                if (newContent) {
                    // Profile will be updated via real-time subscription in AuthContext
                }
            } else {
                toast.error('Não foi possível otimizar a ideia.');
            }
        } catch (error) {
            console.error('Error in optimization:', error);
        } finally {
            setOptimizingId(null);
        }
    };

    const getNoteStyle = (bgColor: string = 'bg-[#fef3c7]') => {
        return NOTE_COLORS.find(c => c.bg === bgColor) || NOTE_COLORS[0];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const activeIdeas = ideas.filter(i => !i.content.isCompleted);
    const completedIdeas = ideas.filter(i => i.content.isCompleted);
    const baseList = showCompleted ? completedIdeas : activeIdeas;
    const currentList = selectedFolderId === 'all'
        ? baseList
        : baseList.filter(i => i.folder_id === (selectedFolderId as number | null));

    const renderFolderTree = (parentId: number | null = null, depth = 0) => {
        const childFolders = folders.filter(f => f.parent_id === parentId);
        if (childFolders.length === 0 && parentId === null) return (
            <div className="py-8 text-center opacity-20">
                <Folder className="w-8 h-8 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma pasta</p>
            </div>
        );

        return (
            <div className={cn("flex flex-col gap-1", depth > 0 && "ml-3 pl-3 border-l border-slate-200 dark:border-white/10")}>
                {childFolders.map(folder => {
                    const isExpanded = expandedFolders.has(folder.id);
                    const folderIdeas = ideas.filter(i => i.folder_id === folder.id);

                    return (
                        <div key={folder.id} className="flex flex-col gap-1">
                            <DroppableFolderWrapper id={folder.id} isDraggable>
                                <div className="flex items-center gap-1 group/folder">
                                    {editingFolder?.id === folder.id ? (
                                        <input
                                            autoFocus
                                            defaultValue={folder.name}
                                            onBlur={e => handleRenameFolder(folder, e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleRenameFolder(folder, e.currentTarget.value); if (e.key === 'Escape') setEditingFolder(null); }}
                                            className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-white/10 border border-violet-500/50 rounded-lg outline-none text-slate-900 dark:text-white w-full"
                                        />
                                    ) : (
                                        <div className={cn(
                                            "flex-1 flex items-center gap-2 px-1 py-1 rounded-lg transition-all text-left group/btn",
                                            selectedFolderId === folder.id
                                                ? "bg-violet-600/10 text-violet-600 dark:text-violet-400"
                                                : "bg-transparent text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white/70"
                                        )}>
                                            <button
                                                onClick={(e) => toggleFolder(folder.id, e)}
                                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                                            >
                                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedFolderId(folder.id);
                                                    setShowMobileSidebar(false);
                                                }}
                                                className="flex-1 flex items-center gap-2 py-1 text-[10px] font-black uppercase tracking-widest truncate"
                                            >
                                                <Folder className={cn("w-3.5 h-3.5", selectedFolderId === folder.id ? "fill-current" : "")} />
                                                <span className="truncate">{folder.name}</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="opacity-0 group-hover/folder:opacity-100 transition-opacity flex items-center gap-0.5 pr-1">
                                        <button onClick={() => setEditingFolder(folder)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDeleteFolder(folder.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </DroppableFolderWrapper>

                            {/* Files inside folder */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden flex flex-col gap-0.5 ml-4 pl-3 border-l border-slate-200 dark:border-white/5 mb-1"
                                    >
                                        {folderIdeas.length === 0 ? (
                                            <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 py-1 italic">Pasta vazia</span>
                                        ) : (
                                            folderIdeas.map(idea => (
                                                <button
                                                    key={idea.id}
                                                    onClick={() => {
                                                        setSelectedIdea(idea);
                                                        setShowMobileSidebar(false);
                                                    }}
                                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 text-left group/file transition-colors"
                                                >
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", getNoteStyle(idea.content.color).dot)} />
                                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50 group-hover/file:text-slate-800 dark:group-hover/file:text-white truncate">
                                                        {idea.content.title || idea.content.note?.substring(0, 20) || 'Ideia sem título'}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                        {renderFolderTree(folder.id, depth + 1)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="flex h-full bg-slate-50 dark:bg-[#0d0d12] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Folder Sidebar */}
                <aside className={cn(
                    "w-64 flex-shrink-0 border-r border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d0d12]/60 backdrop-blur-xl flex flex-col z-40 transition-transform duration-300 md:translate-x-0",
                    showMobileSidebar ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full fixed inset-y-0 left-0 md:relative"
                )}>
                    <div className="p-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <FolderOpen className="w-4 h-4" /> Pastas
                        </h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowNewFolderInput(true)} className="p-1 rounded bg-yellow-500 text-black shadow hover:scale-105 transition-transform">
                                <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => setShowMobileSidebar(false)} className="p-1 rounded bg-slate-200 dark:bg-white/10 text-slate-500 md:hidden">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {showNewFolderInput && (
                            <div className="flex items-center gap-1 mb-4">
                                <input
                                    autoFocus
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolderInput(false); setNewFolderName(''); } }}
                                    placeholder="Nome da pasta..."
                                    className="px-2 py-1.5 flex-1 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-white/10 border border-yellow-500/50 rounded-lg outline-none text-slate-900 dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20"
                                />
                                <button onClick={handleCreateFolder} className="p-1.5 rounded-lg bg-yellow-500 text-black">
                                    <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(''); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            <DroppableFolderWrapper id="all">
                                <button
                                    onClick={() => {
                                        setSelectedFolderId('all');
                                        setShowMobileSidebar(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        selectedFolderId === 'all'
                                            ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white"
                                            : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70"
                                    )}
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    Todas as Ideias
                                </button>
                            </DroppableFolderWrapper>

                            {renderFolderTree(null, 0)}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 z-30 relative">
                    <header className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0d0d12]/60 backdrop-blur-xl sticky top-0">
                        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowMobileSidebar(true)}
                                    className="p-2 -ml-2 rounded-lg bg-slate-100 dark:bg-white/5 md:hidden"
                                >
                                    <FolderOpen className="w-5 h-5 text-slate-500 dark:text-white" />
                                </button>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10">
                                        <Lightbulb className="text-slate-900 dark:text-white w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                                            Meu Banco de <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Ideias</span>
                                        </h1>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                                                    Sincronizando...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                    Nuvem Atualizada
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />

                                <nav className="flex bg-slate-100 dark:bg-white/[0.03] p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.06]">
                                    <button
                                        onClick={() => setShowCompleted(false)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                            !showCompleted ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30 hover:text-slate-500 dark:text-white/50"
                                        )}
                                    >
                                        Ativas ({activeIdeas.length})
                                    </button>
                                    <button
                                        onClick={() => setShowCompleted(true)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                            showCompleted ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white" : "text-slate-400 dark:text-white/30 hover:text-slate-500 dark:text-white/50"
                                        )}
                                    >
                                        Concluídas ({completedIdeas.length})
                                    </button>
                                </nav>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleAddIdea}
                                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                                    Nova Nota
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
                        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {isLoading ? (
                                <div className="col-span-full flex flex-col justify-center items-center py-32 gap-4">
                                    <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                                    <p className="text-sm font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Carregando seus pensamentos...</p>
                                </div>
                            ) : currentList.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-32 text-center bg-slate-100 dark:bg-white/[0.02] rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-8">
                                        {showCompleted ? <History className="w-10 h-10 text-slate-400 dark:text-white/10" /> : <Lightbulb className="w-10 h-10 text-yellow-500/50" />}
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                                        {showCompleted ? 'Nenhuma ideia concluída' : 'Tudo vazio por aqui'}
                                    </h2>
                                    <p className="text-slate-500 dark:text-white/40 max-w-sm font-medium leading-relaxed">
                                        {showCompleted
                                            ? 'As ideias que você marcar como feitas aparecerão aqui para seu histórico.'
                                            : 'Transforme seus lampejos de criatividade em posts virais. Crie sua primeira nota agora.'}
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {currentList.map((idea) => {
                                        const style = getNoteStyle(idea.content.color);
                                        return (
                                            <DraggableWrapper key={idea.id} id={idea.id} type="idea">
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ '--item-color': style.text } as any}
                                                    className={cn(
                                                        "group relative aspect-square rounded-[32px] p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer border border-black/5 dark:border-white/5",
                                                        style.bg
                                                    )}
                                                    onClick={() => setSelectedIdea(idea)}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("w-3 h-3 rounded-full", style.dot)} />
                                                            <span className={cn("text-[9px] font-black uppercase opacity-40", style.text)}>
                                                                {formatDate(idea.created_at)}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateIdeaContent(idea.id, { ...idea.content, isCompleted: !idea.content.isCompleted }, true);
                                                                }}
                                                                className={cn(
                                                                    "p-2 rounded-xl transition-colors",
                                                                    idea.content.isCompleted ? "text-emerald-600 bg-emerald-500/10" : "text-black/20 hover:bg-black/5 hover:text-emerald-600"
                                                                )}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteIdea(idea.id);
                                                                }}
                                                                className="p-2 rounded-xl text-black/20 hover:bg-black/5 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 overflow-hidden">
                                                        <h3 className={cn("text-lg font-black tracking-tight leading-tight line-clamp-2 mb-2", style.text)}>
                                                            {idea.content.title || (idea.content.note ? 'Insight Provisório' : 'Nova Anotação')}
                                                        </h3>
                                                        <p className={cn("text-sm font-medium opacity-70 line-clamp-3", style.text)}>
                                                            {idea.content.note || 'Sem conteúdo ainda...'}
                                                        </p>
                                                    </div>

                                                    {/* Checklist progress */}
                                                    {idea.content.checklist && idea.content.checklist.length > 0 && (() => {
                                                        const total = idea.content.checklist.length;
                                                        const done = idea.content.checklist.filter(c => c.done).length;
                                                        const pct = Math.round((done / total) * 100);
                                                        return (
                                                            <div className="mt-3 space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-50", style.text)}>
                                                                        <SquareCheck className="w-3 h-3 inline mr-1" />{done}/{total}
                                                                    </span>
                                                                    <span className={cn("text-[9px] font-black opacity-50", style.text)}>{pct}%</span>
                                                                </div>
                                                                <div className="h-1 rounded-full bg-black/10 overflow-hidden">
                                                                    <div className="h-full rounded-full bg-black/30 transition-all duration-500" style={{ width: `${pct}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center gap-2">
                                                            {idea.folder_id && folders.find(f => f.id === idea.folder_id) && (
                                                                <span className={cn("text-[9px] font-black uppercase tracking-tight flex items-center gap-1 opacity-50", style.text)}>
                                                                    <Folder className="w-3 h-3" />
                                                                    {folders.find(f => f.id === idea.folder_id)?.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Maximize2 className={cn("w-4 h-4", style.text)} />
                                                    </div>

                                                    {idea.content.expansion && !idea.content.isCompleted && (
                                                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center shadow-lg border-2 border-[#0d0d12]">
                                                            <Zap className="w-4 h-4 text-slate-900 dark:text-white" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </DraggableWrapper>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </main>

                    {/* Note Editor Modal */}
                    <AnimatePresence>
                        {selectedIdea && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => {
                                        handleBlur();
                                        setSelectedIdea(null);
                                    }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="relative w-full max-w-7xl h-[90vh] mx-4 bg-white/50 dark:bg-[#0d0d12]/80 backdrop-blur-3xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-[#1a1a24]/80 dark:to-[#0d0d12]/80 pointer-events-none" />

                                    <div className="relative h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-white/10">

                                        {/* Left Side: Editorial Note */}
                                        <div className={cn("flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar transition-colors duration-500", getNoteStyle(selectedIdea.content.color).bg)}>
                                            <div className="max-w-2xl mx-auto h-full flex flex-col">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Modo Foco</span>
                                                        <div className="h-4 w-px bg-black/10" />
                                                        <select
                                                            value={selectedIdea.folder_id || 'all'}
                                                            onChange={(e) => handleMoveIdeaToFolder(selectedIdea.id, e.target.value === 'all' ? null : Number(e.target.value))}
                                                            className="bg-black/5 border-none rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-0 cursor-pointer hover:bg-black/10 transition-colors"
                                                        >
                                                            <option value="all">Sem Pasta</option>
                                                            {folders.map(f => (
                                                                <option key={f.id} value={f.id}>{f.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <button onClick={() => setSelectedIdea(null)} className="p-2 rounded-full hover:bg-black/10 transition-colors md:hidden">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <div className="flex-1 flex flex-col justify-center">
                                                    <input
                                                        value={selectedIdea.content.title || ''}
                                                        onChange={(e) => handleUpdateIdeaContent(selectedIdea.id, { ...selectedIdea.content, title: e.target.value })}
                                                        placeholder="Título da Ideia..."
                                                        className={cn("w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-3xl font-black placeholder:opacity-40 mb-4 resize-none", getNoteStyle(selectedIdea.content.color).text)}
                                                    />
                                                    <textarea
                                                        autoFocus
                                                        value={selectedIdea.content.note}
                                                        onBlur={handleBlur}
                                                        onChange={(e) => handleUpdateIdeaContent(selectedIdea.id, { ...selectedIdea.content, note: e.target.value })}
                                                        className={cn(
                                                            "w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-xl md:text-2xl font-bold placeholder:opacity-40 min-h-[120px] resize-none mb-6",
                                                            getNoteStyle(selectedIdea.content.color).text
                                                        )}
                                                    />

                                                    {/* Color Picker */}
                                                    <div className="flex items-center gap-3 mb-8">
                                                        {NOTE_COLORS.map(color => (
                                                            <button
                                                                key={color.name}
                                                                onClick={() => handleUpdateIdeaContent(selectedIdea.id, { ...selectedIdea.content, color: color.bg })}
                                                                className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm", color.bg, selectedIdea.content.color === color.bg ? "border-slate-800 scale-110 shadow-md" : "border-transparent")}
                                                                title={color.name}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* Checklist Section */}
                                                    <div className="mb-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <SquareCheck className={cn("w-5 h-5", getNoteStyle(selectedIdea.content.color).text)} />
                                                            <h4 className={cn("text-sm font-black uppercase tracking-widest opacity-60", getNoteStyle(selectedIdea.content.color).text)}>Checklist</h4>
                                                        </div>
                                                        <div className="flex flex-col gap-2 mb-4">
                                                            {(selectedIdea.content.checklist || []).map(item => (
                                                                <div key={item.id} className="flex items-center gap-3 group">
                                                                    <button
                                                                        onClick={() => handleToggleChecklistItem(selectedIdea, item.id)}
                                                                        className={cn(
                                                                            "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0",
                                                                            item.done
                                                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                                                : cn("border-black/20 hover:border-black/40", getNoteStyle(selectedIdea.content.color).text)
                                                                        )}
                                                                    >
                                                                        {item.done && <Check className="w-3 h-3" />}
                                                                    </button>
                                                                    <input
                                                                        value={item.text}
                                                                        onChange={e => handleUpdateChecklistItemText(selectedIdea, item.id, e.target.value)}
                                                                        className={cn(
                                                                            "flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-bold transition-all",
                                                                            item.done ? "line-through opacity-50" : "",
                                                                            getNoteStyle(selectedIdea.content.color).text
                                                                        )}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleRemoveChecklistItem(selectedIdea, item.id)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-500/70 hover:text-red-500 hover:bg-black/5 transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center gap-3 opacity-60 focus-within:opacity-100 transition-opacity">
                                                            <div className={cn("w-5 h-5 rounded border-2 border-dashed border-black/20 flex items-center justify-center flex-shrink-0", getNoteStyle(selectedIdea.content.color).text)}>
                                                                <Plus className="w-3 h-3 opacity-50" />
                                                            </div>
                                                            <input
                                                                value={newChecklistItemText}
                                                                onChange={e => setNewChecklistItemText(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem(selectedIdea)}
                                                                placeholder="Novo item..."
                                                                className={cn("flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-bold placeholder:opacity-50", getNoteStyle(selectedIdea.content.color).text)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-black/5 flex flex-col gap-4">
                                                        <div className="flex items-center justify-between">
                                                            {canUseAI ? (
                                                                <button
                                                                    onClick={() => handleOptimizeIdea(selectedIdea)}
                                                                    disabled={optimizingId === selectedIdea.id || selectedIdea.content.isCompleted}
                                                                    className="px-8 py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:translate-y-[-2px] active:translate-y-[0] transition-all disabled:opacity-30 disabled:translate-y-0"
                                                                >
                                                                    {optimizingId === selectedIdea.id ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                                                                    ) : (
                                                                        <Zap className="w-5 h-5 text-yellow-400" />
                                                                    )}
                                                                    {selectedIdea.content.expansion ? 'Recriar Plano de Conteúdo' : 'Expandir com IA'}
                                                                </button>
                                                            ) : (
                                                                <div className="px-6 py-3 bg-slate-100 rounded-2xl border border-slate-200">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <Zap className="w-3 h-3" />
                                                                        IA disponível no Boost
                                                                    </p>
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() => {
                                                                    if (!selectedIdea.content.note && !selectedIdea.content.title) {
                                                                        toast.error('Adicione conteúdo à ideia antes de agendar.');
                                                                        return;
                                                                    }
                                                                    setIsScheduling(true);
                                                                }}
                                                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:translate-y-[-2px] active:translate-y-[0] transition-all shadow-lg shadow-indigo-500/20"
                                                            >
                                                                <CalendarDays className="w-5 h-5" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div />
                                                            <div className="flex flex-col items-end">
                                                                {isDirtyRef.current && (
                                                                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                                                                        <AlertCircle className="w-3 h-3" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest">Alterações Não Salvas</span>
                                                                    </div>
                                                                )}
                                                                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest leading-none">
                                                                    Backup automático ativado
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: AI Output */}
                                        <div className="w-full md:w-[480px] bg-slate-50 dark:bg-white/[0.02] border-l border-slate-200 dark:border-white/10 p-10 overflow-y-auto custom-scrollbar">
                                            {!selectedIdea.content.expansion && !optimizingId ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                                    <div className="w-20 h-20 bg-slate-200 dark:bg-white/5 rounded-[32px] flex items-center justify-center mb-8">
                                                        <Zap className="w-10 h-10 text-slate-400 dark:text-white/20" />
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-600 dark:text-white/60 mb-2">Potencialize sua Ideia</h4>
                                                    <p className="text-xs font-bold text-slate-400 dark:text-white/40 max-w-[240px] leading-relaxed">
                                                        Clique em "Expandir com IA" para transformar sua anotação em um roteiro completo com título, storytelling e CTA.
                                                    </p>
                                                </div>
                                            ) : optimizingId === selectedIdea.id ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-4">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 border-4 border-slate-200 dark:border-white/5 border-t-violet-500 rounded-full animate-spin" />
                                                        <Zap className="absolute inset-0 m-auto w-6 h-6 text-violet-500" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 animate-pulse">Consultando Inteligência...</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-10">
                                                    {selectedIdea.content.title && (
                                                        <div className="p-6 bg-white dark:bg-white/5 rounded-[32px] shadow-sm border border-slate-200 dark:border-white/10">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 mb-4 block">Título Estratégico</span>
                                                            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{selectedIdea.content.title}</h4>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-4 block">Roteiro Sugerido</span>
                                                        <div className="text-sm font-medium text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap bg-white dark:bg-white/5 p-7 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-sm">
                                                            {selectedIdea.content.expansion}
                                                        </div>
                                                    </div>

                                                    {selectedIdea.content.facts && selectedIdea.content.facts.length > 0 && (
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4 block">Contexto e Autoridade</span>
                                                            <div className="space-y-4">
                                                                {selectedIdea.content.facts.map((fact, idx) => (
                                                                    <div key={idx} className="flex gap-4 items-start bg-white dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                                        <span className="text-xs font-bold text-slate-600 dark:text-white/70 leading-relaxed">{fact}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {selectedIdea.content.cta && (
                                                        <div className="bg-orange-500/10 border border-orange-500/20 p-8 rounded-[32px]">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400 mb-2 block">Chamada para Ação</span>
                                                            <p className="text-sm font-black text-orange-900 dark:text-orange-200 italic">"{selectedIdea.content.cta}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Scheduling Modal */}
                    <AnimatePresence>
                        {isScheduling && selectedIdea && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsScheduling(false)}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                    className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <CalendarDays className="w-32 h-32 text-indigo-500" />
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Agendar no Planner</h3>
                                        <p className="text-xs font-medium text-white/40 mb-8 uppercase tracking-widest">Escolha quando deseja postar esta ideia</p>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Data da Postagem</label>
                                                <input
                                                    type="date"
                                                    value={scheduledDate}
                                                    onChange={(e) => setScheduledDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Horário Sugerido</label>
                                                <input
                                                    type="time"
                                                    value={scheduledTime}
                                                    onChange={(e) => setScheduledTime(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500/50 transition-all"
                                                />
                                            </div>

                                            <div className="pt-4 flex gap-4">
                                                <button
                                                    onClick={() => setIsScheduling(false)}
                                                    className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        setIsSendingToPlanner(true);
                                                        try {
                                                            const [hours, minutes] = scheduledTime.split(':').map(Number);
                                                            const dateObj = new Date(scheduledDate);
                                                            dateObj.setHours(hours, minutes, 0, 0);

                                                            const { error } = await supabase
                                                                .from('planner_posts')
                                                                .insert([{
                                                                    user_id: user?.id,
                                                                    title: selectedIdea.content.title || 'Nova Ideia',
                                                                    description: selectedIdea.content.note,
                                                                    caption: selectedIdea.content.expansion || '',
                                                                    start_date: scheduledDate,
                                                                    scheduled_time: dateObj.toISOString(),
                                                                    platform: 'instagram',
                                                                    is_idea: true,
                                                                    status: 'IDEA'
                                                                }]);

                                                            if (error) throw error;
                                                            toast.success('Ideia enviada para o seu Planner!');
                                                            setIsScheduling(false);
                                                            setSelectedIdea(null);
                                                        } catch (err) {
                                                            console.error(err);
                                                            toast.error('Erro ao enviar para o Planner.');
                                                        } finally {
                                                            setIsSendingToPlanner(false);
                                                        }
                                                    }}
                                                    disabled={isSendingToPlanner}
                                                    className="flex-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {isSendingToPlanner ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                    Confirmar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )
                        }
                    </AnimatePresence >

                    <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar-light::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar-light::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar-light::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
            `}</style>
                </div >
            </div >

            <DragOverlay>
                {activeId && activeType === 'idea' ? (
                    <div className="w-64 h-64 bg-white/80 dark:bg-[#0d0d12]/80 backdrop-blur rounded-[32px] shadow-2xl border border-violet-500 opacity-90 scale-105" />
                ) : null}
            </DragOverlay>
        </DndContext >
    );
}

export default IdeaBank;
