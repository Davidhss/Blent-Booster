import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Plus,
  Trash2,
  Type as TypeIcon,
  User,
  AtSign,
  Palette,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  Copy,
  Upload,
  Layout as LayoutIcon,
  Layers,
  Zap,
  Target,
  Brain,
  Save,
  X,
  ShoppingCart,
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import Markdown from 'react-markdown';
import { cn, highlightText, renderContent } from './lib/utils';
import { analyzePostStyle, generateCaption, generateAudienceQuestions, generateBackgroundImages, suggestTextVariations } from './services/gemini';
import { TemplateType, SlideLayout, AspectRatio, ToolType, UserProfile, Insight, LibraryItem, AdScript, ExportFormat } from './types';
import { usePostEditor, INITIAL_DATA } from './hooks/usePostEditor';
import { useTokenGate } from './hooks/useTokenGate';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PostPreview } from './components/PostPreview';
import { InsightsDashboard } from './components/InsightsDashboard';
import { AdsGenerator } from './components/AdsGenerator';
import { StorytellingGenerator } from './components/StorytellingGenerator';
import { ProfileView } from './components/ProfileView';
import { LibraryView } from './components/LibraryView';
import { IdeaBank } from './components/IdeaBank';
import { supabase } from './lib/supabase';
import { PlannerDashboard } from './components/PlannerDashboard';
import { ContentIdeasGenerator } from './components/ContentIdeasGenerator';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { APP_VERSION } from './config/appVersion';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { BlentLandingPage } from './components/BlentLandingPage';
import { HomeDashboard } from './components/HomeDashboard';
import { SubscriptionPage } from './components/SubscriptionPage';
import { MySubscription } from './components/MySubscription';
import { Toaster, toast } from 'sonner';
import { OnboardingModal } from './components/OnboardingModal';
import { BlockedModal } from './components/BlockedModal';
import { ResetPassword } from './components/ResetPassword';




function MainApp() {
  const { user, profile, isAdmin, isSubscribed, signOut } = useAuth();
  const { isLowBalance, isBlocked, isUnlimited, canAfford, costLabel, deductTokens, TOKEN_COSTS, blockReason, checkAccess } = useTokenGate();
  const showTokens = (isAdmin || APP_VERSION === 'boost');
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showLowBanner, setShowLowBanner] = useState(true);
  const [currentTool, setCurrentTool] = useState<ToolType>('home');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [caption, setCaption] = useState('');
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [activeTab, setActiveTab] = useState<'design' | 'content'>('design');
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugTool, setBugTool] = useState('Geral');
  const [bugDesc, setBugDesc] = useState('');
  const [bugImageFile, setBugImageFile] = useState<File | null>(null);
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  // Insights State
  const [insightMode, setInsightMode] = useState<'basic' | 'detailed'>('basic');
  const [audienceBasic, setAudienceBasic] = useState('');
  const [audienceDetailed, setAudienceDetailed] = useState({
    age: '',
    interests: '',
    pains: '',
    desires: ''
  });
  const [serviceInfo, setServiceInfo] = useState('');
  const [helpInfo, setHelpInfo] = useState('');
  const [awarenessLevel, setAwarenessLevel] = useState('Inconsciente');
  const [informalityLevel, setInformalityLevel] = useState(50);
  const [generatedInsights, setGeneratedInsights] = useState<Insight[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isSuggestingText, setIsSuggestingText] = useState(false);
  const [initialAdsData, setInitialAdsData] = useState<AdScript | null>(null);
  const [initialStoryData, setInitialStoryData] = useState<any>(null);
  const [totalItemsCount, setTotalItemsCount] = useState(0);

  const {
    postData, setPostData,
    currentSlideIndex, setCurrentSlideIndex,
    currentSlide, canAddSlide, MAX_SLIDES,
    postRef, fileInputRef, slideImageInputRef, avatarInputRef,
    handleAddSlide, handleRemoveSlide,
    updateSlideTitle, updateSlideDescription, updateSlideLayout,
    updateSlideBlur, updateSlideBrightness, updateSlideTypography,
    updateImageConfig, removeSlideImage,
    applySuggestedImage, applySuggestedText,
    setSuggestedImages, setSuggestedTexts,
    handleSlideImageUpload, handleAvatarUpload,
    getImageStyle,
  } = usePostEditor();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile from Supabase:', error);
          return;
        }

        if (data) {
          setUserProfile(data);
          setPostData(prev => ({
            ...prev,
            name: prev.name === 'Seu Nome' && data.name ? data.name : prev.name,
            handle: prev.handle === 'seu_arroba' && data.handle ? data.handle : prev.handle,
            avatarUrl: prev.avatarUrl === 'https://picsum.photos/seed/user/200/200' && data.avatarUrl ? data.avatarUrl : prev.avatarUrl
          }));
        } else {
          // Create default profile
          const defaultProfile = {
            id: user.id,
            email: user.email,
            name: 'Seu Nome',
            handle: 'seu_arroba',
            avatarUrl: `https://picsum.photos/seed/${user.id}/200/200`
          };
          const { error: insertError } = await supabase.from('profiles').insert([defaultProfile]);
          if (insertError) {
            console.error('Error creating default profile:', insertError);
            toast.error('Erro ao criar perfil padrão.');
          }
          setUserProfile(defaultProfile);
          setPostData(prev => ({
            ...prev,
            name: prev.name === 'Seu Nome' ? defaultProfile.name : prev.name,
            handle: prev.handle === 'seu_arroba' ? defaultProfile.handle : prev.handle,
            avatarUrl: prev.avatarUrl === 'https://picsum.photos/seed/user/200/200' ? defaultProfile.avatarUrl : prev.avatarUrl
          }));
        }
      } catch (err) {
        console.error('Error fetching profile', err);
      }
    };
    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    const fetchItemsCount = async () => {
      if (!user) return;
      const { count, error } = await supabase
        .from('library')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!error && count !== null) {
        setTotalItemsCount(count);
      }
    };
    fetchItemsCount();

    // Subscribe to changes to keep count in sync
    const sub = supabase
      .channel('library_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library', filter: `user_id=eq.${user.id}` }, () => {
        fetchItemsCount();
      })
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [user]);




  const handleSaveToLibrary = async (type: 'static' | 'ad-script' | 'insight' | 'storytelling-script' | 'content-strategy', content: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('library')
        .insert([{ user_id: user.id, type, content }]);

      if (error) throw error;



      toast.success('Salvo na biblioteca com sucesso!');
    } catch (err) {
      console.error('Error saving to library', err);
      toast.error('Erro ao salvar na biblioteca.');
    }
  };

  const handleUseLibraryItem = (item: LibraryItem) => {
    switch (item.type) {
      case 'static':
        setPostData(item.content as any);
        setCurrentTool('remix');
        break;
      case 'content-strategy':
        // For strategy, we might just want to show the tool or a specific state
        setCurrentTool('strategy');
        break;
      case 'insight':
        setGeneratedInsights(item.content as Insight[]);
        setCurrentTool('insights');
        break;
      case 'ad-script':
        setInitialAdsData(item.content as AdScript);
        setCurrentTool('ads');
        break;
      case 'storytelling-script':
        setInitialStoryData(item.content);
        setCurrentTool('storytelling');
        break;
    }
  };

  const handleGenerateQuestions = async () => {
    if (!(await deductTokens('generateInsights'))) return;
    setIsGeneratingQuestions(true);
    const audienceData = insightMode === 'basic' ? audienceBasic : audienceDetailed;
    const result = await generateAudienceQuestions(
      audienceData,
      serviceInfo,
      helpInfo,
      awarenessLevel,
      informalityLevel
    );
    setGeneratedInsights(result.insights || []);
    setIsGeneratingQuestions(false);
  };

  const handleGenerateBackgroundImages = async () => {
    if (!currentSlide.title) return;
    if (!(await deductTokens('generateBackgroundImages'))) return;
    setIsGeneratingImages(true);
    const images = await generateBackgroundImages(currentSlide.title, imagePrompt);
    if (images.length === 0) {
      toast.error('Não foi possível gerar imagens. Tente novamente.');
    } else {
      setSuggestedImages(images);
    }
    setIsGeneratingImages(false);
  };

  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [quoteTopic, setQuoteTopic] = useState('');

  const handleSuggestTextVariations = async () => {
    if (!currentSlide.title) return;
    if (!(await deductTokens('generateTextVariations'))) return;
    setIsSuggestingText(true);
    const result = await suggestTextVariations(currentSlide.title, currentSlide.description || '');
    if (!result.variations || result.variations.length === 0) {
      toast.error('Não foi possível gerar variações. Tente novamente.');
    } else {
      setSuggestedTexts(result.variations);
    }
    setIsSuggestingText(false);
  };

  const handleGenerateQuote = async () => {
    if (!quoteTopic) {
      toast.error('Digite um assunto para gerar a citação.');
      return;
    }
    if (!(await deductTokens('generateQuote'))) return;
    setIsGeneratingQuote(true);
    const { generateQuote } = await import('./services/gemini');
    const result = await generateQuote(quoteTopic);
    if (result) {
      // Quote text ? title (big/prominent), author ? description (credit)
      updateSlideTitle(`"${result.text}"`);
      updateSlideDescription(`é ${result.author}`);
      toast.success('Citaýýo gerada com sucesso!');
    } else {
      toast.error('Não foi possível gerar a citação.');
    }
    setIsGeneratingQuote(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setIsAnalyzing(true);
      const result = await analyzePostStyle(base64);
      if (result) {
        // New behavior: extract text from the image and populate title + description
        if (result.mainTitle) updateSlideTitle(result.mainTitle);
        if (result.bodyText) updateSlideDescription(result.bodyText);
        toast.success('Texto extraído com sucesso!');
      } else {
        toast.error('Não foi possível extrair o texto. Tente com outro arquivo.');
      }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateCaption = async () => {
    if (!(await deductTokens('generateCaption'))) return;
    setIsGeneratingCaption(true);
    const allText = postData.slides.map(s => `${s.title} ${s.description}`).join(' ');
    const result = await generateCaption(allText);
    if (!result) {
      toast.error('Não foi possível gerar a legenda. Tente novamente.');
    } else {
      setCaption(result);
      setShowCaptionModal(true);
    }
    setIsGeneratingCaption(false);
  };

  const handleDownload = async (format?: ExportFormat | React.MouseEvent) => {
    if (!postRef.current) return;
    setIsExporting(true);
    try {
      // Add a fallback in case the argument is an Event object from onClick
      const finalFormat = typeof format === 'string' ? format : exportFormat;
      const exportOptions = { quality: 1, pixelRatio: 4, cacheBust: true, style: { overflow: 'hidden' as const } };

      if (finalFormat === 'pdf') {
        const pngUrl = await toPng(postRef.current, exportOptions);
        const img = new window.Image();
        img.onload = () => {
          const w = img.width;
          const h = img.height;
          const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] });
          pdf.addImage(pngUrl, 'PNG', 0, 0, w, h);
          pdf.save(`Blent-boost-slide-${currentSlideIndex + 1}.pdf`);
          toast.success('Post exportado como PDF!');
          setIsExporting(false);
        };
        img.onerror = () => { toast.error('Falha ao exportar PDF.'); setIsExporting(false); };
        img.src = pngUrl;
        return; // setIsExporting handled in callbacks
      }

      let dataUrl: string;
      if (finalFormat === 'jpeg') {
        dataUrl = await toJpeg(postRef.current, { ...exportOptions, quality: 0.95 });
      } else {
        dataUrl = await toPng(postRef.current, exportOptions);
      }

      const link = document.createElement('a');
      link.download = `Blent-boost-slide-${currentSlideIndex + 1}.${finalFormat}`;
      link.href = dataUrl;
      link.click();
      toast.success(`Post exportado em ${finalFormat.toUpperCase()}!`);
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Falha ao exportar. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast.success('Legenda copiada para a área de transferência!');
  };

  const handleBugSubmit = async () => {
    if (!bugDesc.trim()) {
      toast.error('Descreva o bug antes de enviar.');
      return;
    }

    setIsSubmittingBug(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      let finalDesc = bugDesc;

      if (bugImageFile) {
        // Upload to avatars bucket temporarily or public
        const fileExt = bugImageFile.name.split('.').pop() || 'png';
        const fileName = `bug-reports/${user?.id || 'anon'}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, bugImageFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          finalDesc += `\n\nImagem anexa: ${publicUrl}`;
        } else {
          console.error("Falha ao upar imagem do bug report", uploadError);
        }
      }

      const { data, error } = await supabase.functions.invoke('report-bug', {
        body: {
          tool: bugTool,
          description: finalDesc,
          userEmail: user?.email || 'Usuário Deslogado'
        }
      });

      if (error) {
        console.error('Bug report error:', error);
        throw new Error(`Status ${error.message}`);
      }
      if (data?.error) {
        throw new Error(data.error);
      }

      setShowBugReport(false);
      setBugDesc('');
      setBugImageFile(null);
      toast.success('Relatório de bug enviado para a Assessoria Blent!');
    } catch (err) {
      console.error('Error submitting bug:', err);
      toast.error('Erro ao enviar relatório. Tente novamente mais tarde.');
    } finally {
      setIsSubmittingBug(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#0d0d12] text-white font-sans selection:bg-violet-600 selection:text-white flex flex-col">
      {/* Global Low-Balance Banner */}
      <AnimatePresence>
        {showTokens && isLowBalance && !isUnlimited && showLowBanner && (
          <motion.div
            key="low-balance-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 z-50 shrink-0"
          >
            <span className="text-base">?</span>
            <p className="text-sm font-bold text-amber-300 flex-1">
              Seus créditos estão acabando! Garanta mais na nossa loja para não parar sua produção.
            </p>
            <button
              onClick={() => setCurrentTool('tokens')}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 transition-all whitespace-nowrap"
            >
              <ShoppingCart className="w-3 h-3" /> Ver Loja
            </button>
            <button
              onClick={() => setShowLowBanner(false)}
              className="text-amber-400/60 hover:text-amber-300 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked Modal */}
      {showTokens && <BlockedModal open={showBlockedModal} onClose={() => setShowBlockedModal(false)} onGoToStore={() => setCurrentTool('tokens')} />}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <Sidebar
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
          userProfile={userProfile}
          onOpenBugReport={() => setShowBugReport(true)}

        />

        <div className="flex-1 overflow-y-auto h-[100dvh] md:h-screen pb-16 md:pb-0">
          {currentTool === 'home' ? (
            <HomeDashboard setCurrentTool={setCurrentTool} totalItemsCount={totalItemsCount} />
          ) : currentTool === 'remix' ? (
            <>
              <Header
                isGeneratingCaption={isGeneratingCaption}
                isExporting={isExporting}
                onGenerateCaption={handleGenerateCaption}
                onDownload={handleDownload}
                onSave={() => handleSaveToLibrary('static', postData)}
                exportFormat={exportFormat}
                onFormatChange={setExportFormat}
              />

              <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: Controls */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-[#14141e] rounded-3xl border border-white/[0.06] overflow-hidden flex flex-col flex-1">
                    {/* Tabs */}
                    <div className="flex border-b border-white/[0.06]">
                      {(['design', 'content'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab ? "border-b-2 border-violet-500 text-violet-400" : "text-white/25 hover:text-white/60"
                          )}
                        >
                          {tab === 'design' ? '🎨 Visual & Design' : '📝 Conteúdo & Mídia'}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
                      <AnimatePresence mode="wait">
                        {
                          activeTab === 'design' && (
                            <motion.div
                              key="design"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-8"
                            >
                              {/* Template Style - PRIMEIRO PASSO */}
                              <section>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                  <Sparkles className="w-3 h-3" />
                                  1. Template Principal
                                </h2>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {([
                                    { id: 'tweet', label: 'Twitter', emoji: '🐦' },
                                    { id: 'quote', label: 'Citação', emoji: '💬' },
                                    { id: 'minimal', label: 'Minimal', emoji: '✨' },
                                    { id: 'info', label: 'Info', emoji: '📊' },
                                    { id: 'atmospheric', label: 'Atmosférico', emoji: '🌌' },
                                    { id: 'gradient', label: 'Gradiente', emoji: '🌈' },
                                    { id: 'side-card', label: 'Card', emoji: '🖼️' },
                                    { id: 'editorial', label: 'Editorial', emoji: '📰' },
                                  ] as { id: TemplateType; label: string; emoji: string }[]).map((tpl) => (
                                    <button
                                      key={tpl.id}
                                      onClick={() => setPostData(prev => ({ ...prev, templateType: tpl.id }))}
                                      className={cn(
                                        "py-2.5 px-1 rounded-xl text-[8px] font-black uppercase tracking-wider border transition-all flex flex-col items-center gap-1",
                                        postData.templateType === tpl.id
                                          ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                                          : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/[0.15] hover:text-white"
                                      )}
                                    >
                                      <span className="text-base">{tpl.emoji}</span>
                                      {tpl.label}
                                    </button>
                                  ))}
                                </div>
                              </section>

                              {/* Credentials Section - Condicional */}
                              {true && (
                                <section className="pt-6 border-t border-white/[0.06]">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    Credenciais do Autor
                                  </h2>
                                  <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                                    {postData.templateType === 'tweet' && (
                                      <div
                                        className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group relative shrink-0"
                                        onClick={() => avatarInputRef.current?.click()}
                                      >
                                        <img src={postData.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Upload className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                    )}
                                    <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                      {postData.templateType !== 'minimal' && postData.templateType !== 'info' && (
                                        <input
                                          type="text"
                                          value={postData.name}
                                          placeholder="Seu Nome"
                                          onChange={(e) => setPostData(prev => ({ ...prev, name: e.target.value }))}
                                          className="w-full px-0 bg-transparent border-none focus:ring-0 transition-all text-sm font-black tracking-tight text-white placeholder:text-white/20 outline-none"
                                        />
                                      )}
                                      {postData.templateType !== 'atmospheric' && (
                                        <div className="flex items-center gap-1 text-white/30">
                                          <AtSign className="w-3 h-3" />
                                          <input
                                            type="text"
                                            value={postData.handle}
                                            placeholder="seu_arroba"
                                            onChange={(e) => setPostData(prev => ({ ...prev, handle: e.target.value }))}
                                            className="w-full px-0 bg-transparent border-none focus:ring-0 transition-all text-xs font-bold text-white/60 placeholder:text-white/20 outline-none"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    {postData.templateType === 'tweet' && (
                                      <button
                                        onClick={() => setPostData(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                                        className={cn(
                                          "w-8 h-4 rounded-full transition-all relative shrink-0",
                                          postData.isVerified ? "bg-blue-500" : "bg-white/10"
                                        )}
                                      >
                                        <div className={cn(
                                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                          postData.isVerified ? "right-0.5" : "left-0.5"
                                        )} />
                                      </button>
                                    )}
                                  </div>
                                  {postData.templateType === 'tweet' && (
                                    <div className="mt-3 flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                                      <span className="text-[10px] font-black uppercase text-white/50 tracking-wider">Mostrar Data e Hora</span>
                                      <button
                                        onClick={() => setPostData(prev => ({ ...prev, showTwitterDate: prev.showTwitterDate === false ? true : false }))}
                                        className={cn(
                                          "w-8 h-4 rounded-full transition-all relative shrink-0",
                                          postData.showTwitterDate !== false ? "bg-violet-500" : "bg-white/10"
                                        )}
                                      >
                                        <div className={cn(
                                          "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                          postData.showTwitterDate !== false ? "right-0.5" : "left-0.5"
                                        )} />
                                      </button>
                                    </div>
                                  )}
                                </section>
                              )}

                              {/* Slide Layout Section - Filtro Condicional */}
                              {postData.templateType !== 'atmospheric' && (
                                <section className="pt-6 border-t border-white/[0.06]">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                    <LayoutIcon className="w-3 h-3" />
                                    Layout do Slide
                                  </h2>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(postData.templateType === 'info' ? ['text-only', 'image-bg', 'split-h', 'split-v', 'big-number'] :
                                      postData.templateType === 'tweet' ? ['text-only', 'image-bg', 'split-v'] : // maping default formats to what makes sense
                                        ['text-only', 'image-bg']).map((layout) => {
                                          const layoutName = layout as SlideLayout;
                                          return (
                                            <button
                                              key={layout}
                                              onClick={() => updateSlideLayout(layoutName)}
                                              className={cn(
                                                "py-3 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-2 text-center",
                                                currentSlide.layout === layout
                                                  ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20"
                                                  : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:border-white/[0.15] hover:text-white/60"
                                              )}
                                            >
                                              {layout === 'text-only' && <TypeIcon className="w-4 h-4" />}
                                              {layout === 'image-bg' && <ImageIcon className="w-4 h-4" />}
                                              {layout === 'split-h' && <Layers className="w-4 h-4" />}
                                              {layout === 'split-v' && <LayoutIcon className="w-4 h-4 rotate-90" />}
                                              {layout === 'big-number' && <span className="w-4 h-4 flex items-center justify-center font-black text-xs">1</span>}
                                              {layout === 'text-only' ? 'Sem Imagem' : layout === 'image-bg' ? 'Fundo Completo' : layout === 'split-h' ? 'Divisão Horiz.' : layout === 'split-v' ? 'Imagem Destacada' : 'Número Grande'}
                                            </button>
                                          );
                                        })}
                                  </div>
                                </section>
                              )}

                              {/* Alignment Control */}
                              {(postData.templateType === 'tweet' || postData.templateType === 'minimal') && (
                                <section className="pt-6 border-t border-white/[0.06]">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                    <LayoutIcon className="w-3 h-3" />
                                    Alinhamento Vertical
                                  </h2>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(['top', 'center', 'bottom'] as const).map((align) => (
                                      <button
                                        key={align}
                                        onClick={() => {
                                          const newSlides = [...postData.slides];
                                          newSlides[currentSlideIndex].alignment = align;
                                          setPostData(prev => ({ ...prev, slides: newSlides }));
                                        }}
                                        className={cn(
                                          "py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                          currentSlide.alignment === align
                                            ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                                            : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/[0.15] hover:text-white"
                                        )}
                                      >
                                        {align === 'top' ? 'Topo' : align === 'center' ? 'Centro' : 'Base'}
                                      </button>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {/* Aspect Ratio */}
                              <section className="pt-6 border-t border-white/[0.06]">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                  <LayoutIcon className="w-3 h-3" />
                                  Proporção / Formato
                                </h2>
                                <div className="grid grid-cols-3 gap-2">
                                  {(['1:1', '4:5', '9:16'] as AspectRatio[]).map((ratio) => (
                                    <button
                                      key={ratio}
                                      onClick={() => setPostData(prev => ({ ...prev, aspectRatio: ratio }))}
                                      className={cn(
                                        "py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-2",
                                        postData.aspectRatio === ratio
                                          ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                                          : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/[0.15] hover:text-white"
                                      )}
                                    >
                                      <div className={cn(
                                        "border-2 border-current rounded-sm",
                                        ratio === '1:1' ? "w-3 h-3" : ratio === '4:5' ? "w-3 h-4" : "w-2.5 h-5"
                                      )} />
                                      {ratio === '1:1' ? 'Feed Quadrado' : ratio === '4:5' ? 'Feed Retrato' : 'Stories/Reels'}
                                    </button>
                                  ))}
                                </div>
                              </section>

                              {/* Font Selection */}
                              {postData.templateType !== 'tweet' && (
                                <section className="pt-6 border-t border-white/[0.06]">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                    <TypeIcon className="w-3 h-3" />
                                    Fonte do Título
                                  </h2>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { id: 'sans', name: 'Sans', class: 'font-sans' },
                                      { id: 'serif', name: 'Serif', class: 'font-serif' },
                                      { id: 'display', name: 'Display', class: 'font-display' },
                                      { id: 'mono', name: 'Mono', class: 'font-mono' }
                                    ].map((font) => (
                                      <button
                                        key={font.id}
                                        onClick={() => setPostData(prev => ({ ...prev, titleFont: font.id as any }))}
                                        className={cn(
                                          "py-3 px-3 rounded-xl text-[10px] border transition-all flex flex-col items-center gap-1",
                                          postData.titleFont === font.id
                                            ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                                            : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/[0.15] hover:text-white"
                                        )}
                                      >
                                        <span className={cn("text-base font-bold", font.class)}>Abc</span>
                                        <span className="uppercase tracking-widest text-[8px] font-black">{font.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </section>
                              )}

                              {/* Colors */}
                              <section className="pt-6 border-t border-white/[0.06]">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                  <Palette className="w-3 h-3" />
                                  Cores do Sistema
                                </h2>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Fundo</label>
                                      <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                        <input
                                          type="color"
                                          value={postData.primaryColor}
                                          onChange={(e) => setPostData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                          className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="text-[10px] font-mono font-bold uppercase text-white/80">{postData.primaryColor}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Texto</label>
                                      <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                        <input
                                          type="color"
                                          value={postData.secondaryColor}
                                          onChange={(e) => setPostData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                          className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="text-[10px] font-mono font-bold uppercase text-white/80">{postData.secondaryColor}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex justify-between">
                                      <span>Destaque</span>
                                      <span className="text-white/20 lowercase">Use [[palavra]]</span>
                                    </label>
                                    <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                      <input
                                        type="color"
                                        value={postData.accentColor}
                                        onChange={(e) => setPostData(prev => ({ ...prev, accentColor: e.target.value }))}
                                        className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                                      />
                                      <span className="text-[10px] font-mono font-bold uppercase text-white/80">{postData.accentColor}</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 flex-wrap pt-2">
                                    {['#ffffff', '#000000', '#0f0f13', '#1e1b4b', '#f0f9ff', '#fbbf24', '#0d0d12', '#2e1065'].map(color => (
                                      <button
                                        key={color}
                                        onClick={() => setPostData(prev => ({ ...prev, primaryColor: color }))}
                                        className={cn(
                                          "w-6 h-6 rounded-full border border-white/10 transition-transform hover:scale-110",
                                          postData.primaryColor === color && "ring-2 ring-violet-500 ring-offset-2 ring-offset-[#14141e]"
                                        )}
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </section>

                              {/* Textures */}
                              <section className="pt-6 border-t border-white/[0.06] space-y-4">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                  <Layers className="w-3 h-3" />
                                  Textura
                                </h2>
                                <div className="grid grid-cols-4 gap-2">
                                  {(['none', 'grain', 'noise', 'dots'] as const).map((tex) => (
                                    <button
                                      key={tex}
                                      onClick={() => setPostData(prev => ({ ...prev, texture: tex }))}
                                      className={cn(
                                        "py-2 px-1 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all flex flex-col items-center gap-1",
                                        postData.texture === tex
                                          ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20"
                                          : "bg-white/[0.03] text-white/40 border-white/[0.06] hover:border-white/[0.15] hover:text-white"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-4 h-4 rounded-sm border border-white/10",
                                        tex === 'none' && "bg-white",
                                        tex === 'grain' && "bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover",
                                        tex === 'noise' && "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-repeat",
                                        tex === 'dots' && "bg-[url('https://www.transparenttextures.com/patterns/60-lines.png')] bg-repeat"
                                      )} />
                                      {tex === 'none' ? 'Sem' : tex === 'grain' ? 'Grão' : tex === 'noise' ? 'Ruído' : 'Dots'}
                                    </button>
                                  ))}
                                </div>

                                {postData.texture !== 'none' && (
                                  <div className="space-y-2 px-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-30">
                                      <span>Intensidade</span>
                                      <span>{Math.round(postData.textureIntensity * 100)}%</span>
                                    </div>
                                    <input
                                      type="range" min="0.05" max="0.8" step="0.05"
                                      value={postData.textureIntensity}
                                      onChange={(e) => setPostData(prev => ({ ...prev, textureIntensity: parseFloat(e.target.value) }))}
                                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                  </div>
                                )}
                              </section>

                              {/* Typography Controls - for ALL templates */}
                              <section className="pt-6 border-t border-white/[0.06]">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                  <TypeIcon className="w-3 h-3" />
                                  Tipografia Avançada
                                </h2>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-30">
                                      <span>Tamanho do Título</span>
                                      <span>{currentSlide.titleFontSize ?? 48}px</span>
                                    </div>
                                    <input type="range" min="18" max="120" step="2"
                                      value={currentSlide.titleFontSize ?? 48}
                                      onChange={(e) => updateSlideTypography({ titleFontSize: parseInt(e.target.value) })}
                                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-30">
                                      <span>Tamanho do Conteýdo</span>
                                      <span>{currentSlide.descriptionFontSize ?? 18}px</span>
                                    </div>
                                    <input type="range" min="10" max="60" step="1"
                                      value={currentSlide.descriptionFontSize ?? 18}
                                      onChange={(e) => updateSlideTypography({ descriptionFontSize: parseInt(e.target.value) })}
                                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-30">
                                      <span>Altura da Linha (Título)</span>
                                      <span>{(currentSlide.titleLineHeight ?? 1.1).toFixed(1)}</span>
                                    </div>
                                    <input type="range" min="0.6" max="2" step="0.1"
                                      value={currentSlide.titleLineHeight ?? 1.1}
                                      onChange={(e) => updateSlideTypography({ titleLineHeight: parseFloat(e.target.value) })}
                                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-30">
                                      <span>Altura da Linha (Texto)</span>
                                      <span>{(currentSlide.descriptionLineHeight ?? 1.5).toFixed(1)}</span>
                                    </div>
                                    <input type="range" min="0.8" max="3" step="0.1"
                                      value={currentSlide.descriptionLineHeight ?? 1.5}
                                      onChange={(e) => updateSlideTypography({ descriptionLineHeight: parseFloat(e.target.value) })}
                                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-30">
                                      <span>Espaço Título ? Texto</span>
                                      <span>{currentSlide.contentSpacing ?? 16}px</span>
                                    </div>
                                    <input type="range" min="0" max="64" step="2"
                                      value={currentSlide.contentSpacing ?? 16}
                                      onChange={(e) => updateSlideTypography({ contentSpacing: parseInt(e.target.value) })}
                                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                  </div>
                                </div>
                              </section>

                              {/* Reference Visual */}
                              <section className="pt-6 border-t border-white/[0.06]">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                  <ImageIcon className="w-3 h-3" />
                                  Extrair Texto do Post (Envie um Print)
                                </h2>
                                <div
                                  onClick={() => isAnalyzing ? undefined : fileInputRef.current?.click()}
                                  className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/30 transition-all group bg-white/[0.01]"
                                >
                                  {isAnalyzing ? (
                                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                                  ) : (
                                    <Upload className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors" />
                                  )}
                                  <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">
                                      {isAnalyzing ? 'Extraindo Texto...' : 'Subir Imagem do Post'}
                                    </p>
                                    <p className="text-[8px] font-bold text-white/30">A IA extrai o texto e preenche o týtulo e conteúdo</p>
                                  </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                              </section>
                            </motion.div>
                          )
                        }

                        {
                          activeTab === 'content' && (
                            <motion.div
                              key="content"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-8"
                            >
                              <section>
                                <div className="flex items-center justify-between mb-4">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                                    <TypeIcon className="w-3 h-3" />
                                    1. Texto do Slide
                                  </h2>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-white/20 tabular-nums">
                                      {postData.slides.length}/{MAX_SLIDES}
                                    </span>
                                    <button
                                      onClick={() => handleRemoveSlide(currentSlideIndex)}
                                      disabled={postData.slides.length <= 1}
                                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-20"
                                      title="Remover slide"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={handleAddSlide}
                                      disabled={!canAddSlide}
                                      className="p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                      title={canAddSlide ? 'Adicionar slide' : `Limite de ${MAX_SLIDES} slides atingido`}
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-white/25">Título</label>
                                      <button
                                        onClick={handleSuggestTextVariations}
                                        disabled={isSuggestingText || !currentSlide.title}
                                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-30"
                                      >
                                        {isSuggestingText ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        Melhorar com IA
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={currentSlide.title || ''}
                                      onChange={(e) => updateSlideTitle(e.target.value)}
                                      className="w-full p-4 bg-white/[0.04] rounded-2xl border border-white/[0.07] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-base font-black tracking-tight text-white placeholder:text-white/20 outline-none"
                                      placeholder="Título principal do slide..."
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <label className="text-[9px] font-black uppercase tracking-widest text-white/25">Descrição / Corpo do Texto</label>
                                    </div>

                                    {/* Gerador de Citação */}
                                    <div className="flex flex-col gap-1.5 mb-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] items-center gap-1 font-black uppercase tracking-widest text-violet-400 flex">
                                          <Sparkles className="w-3 h-3" /> Gerador de Frases com IA
                                        </span>
                                        <span className="text-[9px] font-medium text-white/30">
                                          Digite um tema (ex: motivação, vendas) e a IA buscará uma frase impactante.
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <input
                                          type="text"
                                          value={quoteTopic}
                                          onChange={(e) => setQuoteTopic(e.target.value)}
                                          placeholder="Tema da frase..."
                                          className="flex-1 min-w-0 bg-white/[0.05] border border-white/[0.1] rounded-lg text-xs text-white placeholder:text-white/20 outline-none px-3 py-2 focus:border-violet-500/50 transition-all"
                                        />
                                        <button
                                          onClick={handleGenerateQuote}
                                          disabled={isGeneratingQuote || !quoteTopic}
                                          className="px-4 py-2 bg-violet-600 text-white hover:bg-violet-500 transition-all rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                                        >
                                          {isGeneratingQuote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                          Gerar Frase
                                        </button>
                                      </div>
                                    </div>

                                    <textarea
                                      value={currentSlide.description || ''}
                                      onChange={(e) => updateSlideDescription(e.target.value)}
                                      rows={4}
                                      className="w-full p-4 bg-white/[0.04] rounded-2xl border border-white/[0.07] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm font-medium resize-none text-white/85 placeholder:text-white/20 outline-none"
                                      placeholder="Texto de apoio ou citação gerada..."
                                    />
                                  </div>

                                  {currentSlide.suggestedTexts && currentSlide.suggestedTexts.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Sugestões da IA</h3>
                                      <div className="space-y-2">
                                        {currentSlide.suggestedTexts.map((v, i) => (
                                          <button
                                            key={i}
                                            onClick={() => applySuggestedText(v.title, v.description)}
                                            className="w-full p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-left hover:bg-violet-500/20 transition-all group"
                                          >
                                            <p className="text-xs font-black text-violet-300 mb-1">{v.title}</p>
                                            <p className="text-[10px] text-violet-400/60 line-clamp-2">{v.description}</p>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <p className="text-[10px] font-bold text-white/15 italic">
                                    Dica Destaque: Envolva a palavra em [[colchetes duplos]] para aplicar a cor de destaque definida no design.
                                  </p>
                                </div>

                              </section>

                              {/* Image Settings */}
                              {(currentSlide.layout !== 'text-only' || postData.templateType === 'atmospheric') && (
                                <section className="pt-6 border-t border-white/[0.06] space-y-6">
                                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" />
                                    2. Imagem Principal
                                  </h2>
                                  <div className="flex flex-col gap-3">
                                    {currentSlide.layout === 'image-bg' || postData.templateType === 'atmospheric' ? (
                                      <input
                                        type="text"
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        placeholder="Descreva a imagem de fundo para a IA gerar..."
                                        className="w-full p-4 bg-white/[0.02] rounded-xl border border-white/[0.08] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-xs font-bold text-white placeholder:text-white/20 focus:outline-none"
                                      />
                                    ) : null}

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => slideImageInputRef.current?.click()}
                                        className="flex-1 py-3 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                        {currentSlide.imageUrl ? 'Trocar Imagem' : 'Fazer Upload'}
                                      </button>
                                      {(currentSlide.layout === 'image-bg' || postData.templateType === 'atmospheric') && (
                                        <div className="relative flex-1" title="Em breve disponível">
                                          <button
                                            disabled
                                            className="w-full py-3 bg-violet-600/30 text-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed select-none border border-violet-500/10"
                                          >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Criar Fundo IA
                                          </button>
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#1a1a24] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-xl whitespace-nowrap">?? Em breve disponível</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {currentSlide.suggestedImages && currentSlide.suggestedImages.length > 0 && (
                                      <div className="grid grid-cols-3 gap-2 pt-2">
                                        {currentSlide.suggestedImages.map((img, i) => (
                                          <button
                                            key={i}
                                            onClick={() => applySuggestedImage(img)}
                                            className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-violet-500 transition-all relative group"
                                          >
                                            <img src={img} className="w-full h-full object-cover" alt={`Sugestão ${i + 1}`} />
                                            <div className="absolute inset-0 bg-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <CheckCircle2 className="w-5 h-5 text-white" />
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {currentSlide.imageUrl && (
                                      <button
                                        onClick={removeSlideImage}
                                        className="w-full py-2.5 text-red-500/60 text-[9px] font-black uppercase tracking-widest hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                      >
                                        Remover Imagem
                                      </button>
                                    )}
                                  </div>
                                  <input type="file" ref={slideImageInputRef} onChange={handleSlideImageUpload} className="hidden" accept="image/*" />

                                  {currentSlide.imageUrl && (
                                    <div className="space-y-6 pt-4 border-t border-white/[0.06]">
                                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Ajustes da Imagem</h3>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-30">
                                            <span>Scale (Zoom)</span>
                                            <span>{Math.round((currentSlide.imageConfig?.scale || 1) * 100)}%</span>
                                          </div>
                                          <input
                                            type="range" min="0.5" max="3" step="0.1"
                                            value={currentSlide.imageConfig?.scale || 1}
                                            onChange={(e) => updateImageConfig({ scale: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-30">
                                              <span>Posição X</span>
                                              <span>{currentSlide.imageConfig?.x || 0}px</span>
                                            </div>
                                            <input
                                              type="range" min="-200" max="200" step="1"
                                              value={currentSlide.imageConfig?.x || 0}
                                              onChange={(e) => updateImageConfig({ x: parseInt(e.target.value) })}
                                              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-30">
                                              <span>Posição Y</span>
                                              <span>{currentSlide.imageConfig?.y || 0}px</span>
                                            </div>
                                            <input
                                              type="range" min="-200" max="200" step="1"
                                              value={currentSlide.imageConfig?.y || 0}
                                              onChange={(e) => updateImageConfig({ y: parseInt(e.target.value) })}
                                              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                            />
                                          </div>
                                        </div>
                                        {(currentSlide.layout === 'image-bg' || postData.templateType === 'atmospheric') && (
                                          <>
                                            <div className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-30">
                                                <span>Desfoque (Blur Fundo)</span>
                                                <span>{currentSlide.bgBlur || 0}px</span>
                                              </div>
                                              <input
                                                type="range" min="0" max="20" step="1"
                                                value={currentSlide.bgBlur || 0}
                                                onChange={(e) => updateSlideBlur(parseInt(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-30">
                                                <span>Exposição Brilho</span>
                                                <span>{Math.round((currentSlide.bgBrightness ?? 1) * 100)}%</span>
                                              </div>
                                              <input
                                                type="range" min="0.1" max="2" step="0.05"
                                                value={currentSlide.bgBrightness ?? 1}
                                                onChange={(e) => updateSlideBrightness(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </section>
                              )}
                            </motion.div>
                          )
                        }

                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Center: Preview */}
                <div className="lg:col-span-8 flex flex-col items-center gap-8">
                  <PostPreview
                    postData={postData}
                    currentSlideIndex={currentSlideIndex}
                    postRef={postRef}
                    getImageStyle={getImageStyle}
                    renderContent={(t, d, c) => renderContent(t, d, c, postData.titleFont, postData.accentColor)}
                    highlightText={(t, c) => highlightText(t, c || postData.accentColor)}
                    isExporting={isExporting}
                  />

                  {/* Slide Navigation */}
                  <div className="mt-6 flex items-center gap-4">
                    <button
                      onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentSlideIndex === 0}
                      className="p-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all disabled:opacity-20"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex gap-1.5">
                      {postData.slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlideIndex(i)}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            currentSlideIndex === i ? "bg-violet-500 w-6" : "bg-white/20 w-2 hover:bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentSlideIndex(prev => Math.min(postData.slides.length - 1, prev + 1))}
                      disabled={currentSlideIndex === postData.slides.length - 1}
                      className="p-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] transition-all disabled:opacity-20"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </main>
            </>
          ) : currentTool === 'insights' ? (
            <div className="p-8 max-w-6xl mx-auto">
              <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-blue-500/15 border border-blue-500/20 rounded-xl">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-white">Audience Insights</h1>
                    <p className="text-white/40 text-sm font-medium">Descubra o que seu público realmente quer saber.</p>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-5">
                  <section className="bg-[#14141e] p-6 rounded-2xl border border-white/[0.06] space-y-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Dados do Público</h2>
                      <div className="flex bg-white/[0.05] p-1 rounded-xl gap-1">
                        <button
                          onClick={() => setInsightMode('basic')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                            insightMode === 'basic' ? "bg-violet-600 text-white shadow-sm" : "text-white/40 hover:text-white/70"
                          )}
                        >
                          BÁSICO
                        </button>
                        <button
                          onClick={() => setInsightMode('detailed')}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                            insightMode === 'detailed' ? "bg-violet-600 text-white shadow-sm" : "text-white/40 hover:text-white/70"
                          )}
                        >
                          DETALHADO
                        </button>
                      </div>
                    </div>

                    {insightMode === 'basic' ? (
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 block">Quem é seu público?</label>
                        <textarea
                          value={audienceBasic}
                          onChange={(e) => setAudienceBasic(e.target.value)}
                          placeholder="Ex: Empreendedores iniciantes que querem vender no Instagram mas têm vergonha..."
                          className="w-full p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm h-28 resize-none"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 block">Interesses</label>
                          <input
                            type="text"
                            value={audienceDetailed.interests}
                            onChange={(e) => setAudienceDetailed({ ...audienceDetailed, interests: e.target.value })}
                            placeholder="Ex: Marketing, Design, Produtividade"
                            className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 block">Idade/Perfil</label>
                          <input
                            type="text"
                            value={audienceDetailed.age}
                            onChange={(e) => setAudienceDetailed({ ...audienceDetailed, age: e.target.value })}
                            placeholder="Ex: 25-40 anos, CLT"
                            className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 block">Desejos</label>
                          <input
                            type="text"
                            value={audienceDetailed.desires}
                            onChange={(e) => setAudienceDetailed({ ...audienceDetailed, desires: e.target.value })}
                            placeholder="Ex: Liberdade geográfica"
                            className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1 block">Dores/Dificuldades</label>
                          <textarea
                            value={audienceDetailed.pains}
                            onChange={(e) => setAudienceDetailed({ ...audienceDetailed, pains: e.target.value })}
                            placeholder="Ex: Medo de julgamento, falta de tempo..."
                            className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all text-sm h-20 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="space-y-4 pt-4 border-t border-white/[0.06]">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">O que você faz? (Seu Serviço)</label>
                      <input
                        type="text"
                        value={serviceInfo}
                        onChange={(e) => setServiceInfo(e.target.value)}
                        placeholder="Ex: Consultoria de Tráfego Pago"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Como você ajuda? (Seu Diferencial)</label>
                      <input
                        type="text"
                        value={helpInfo}
                        onChange={(e) => setHelpInfo(e.target.value)}
                        placeholder="Ex: Ajudo negócios locais a venderem 3x mais usando Instagram"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 block">Nível de Consciência</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Inconsciente', 'Consciente do Problema', 'Consciente da Solução', 'Consciente do Produto', 'Totalmente Consciente'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setAwarenessLevel(level)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-tighter border transition-all",
                              awarenessLevel === level
                                ? "bg-violet-600 text-white border-violet-600 shadow-md"
                                : "bg-white/[0.03] text-white/30 border-white/[0.06] hover:border-white/[0.15]"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block">Nível de Informalidade</label>
                        <span className="text-[10px] font-black text-violet-400">{informalityLevel}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold text-white/20 uppercase">Formal</span>
                        <input
                          type="range" min="0" max="100" step="1"
                          value={informalityLevel}
                          onChange={(e) => setInformalityLevel(parseInt(e.target.value))}
                          className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                        <span className="text-[9px] font-bold text-white/20 uppercase">Informal</span>
                      </div>
                    </div>
                  </section>

                  <button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions || (!audienceBasic && !audienceDetailed.interests) || !serviceInfo || !canAfford(TOKEN_COSTS.generateInsights)}
                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-40 shadow-lg shadow-violet-500/20"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mapeando Psicologia do Público...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        Gerar Dashboard Estratégico ({costLabel('generateInsights')})
                      </>
                    )}
                  </button>
                </div>

                {/* Results Section */}
                <div className="space-y-5">
                  <div className="bg-[#14141e] border border-white/[0.07] p-6 rounded-2xl relative overflow-hidden min-h-[500px] flex flex-col">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                      <Brain className="w-40 h-40 text-white" />
                    </div>

                    <div className="relative z-10 flex-1">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/30 mb-0.5">Dashboard Estratégico</h2>
                          <p className="text-[10px] font-bold text-white/15 uppercase tracking-widest">Insights por Psicologia do Consumidor</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {generatedInsights.length > 0 && (
                            <button
                              onClick={() => handleSaveToLibrary('insight', generatedInsights)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-white/50 hover:text-white"
                            >
                              <Save className="w-3 h-3" />
                              Salvar
                            </button>
                          )}
                          {generatedInsights.length > 0 && (
                            <div className="px-2.5 py-1 bg-violet-500/20 border border-violet-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest text-violet-300">
                              {generatedInsights.length} Insights
                            </div>
                          )}
                        </div>
                      </div>

                      <InsightsDashboard
                        insights={generatedInsights}
                        onCopyHook={(hook) => {
                          navigator.clipboard.writeText(hook);
                          toast.success('Gancho copiado!');
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : currentTool === 'strategy' ? (
            <ContentIdeasGenerator
              userEmail={user?.email || ''}
              onSave={handleSaveToLibrary}
            />
          ) : currentTool === 'ads' ? (
            <AdsGenerator
              userEmail={user?.email || ''}
              initialData={initialAdsData}
              onSave={(type, content) => handleSaveToLibrary(type, content)}
            />
          ) : currentTool === 'storytelling' ? (
            <StorytellingGenerator
              initialData={initialStoryData}
              onSave={(type, content) => handleSaveToLibrary(type, content)}
            />
          ) : currentTool === 'tokens' ? (
            <MySubscription />
          ) : currentTool === 'admin' && isAdmin ? (
            <AdminDashboard />
          ) : currentTool === 'library' ? (
            <LibraryView
              userEmail={user?.email || ''}
              onUseItem={handleUseLibraryItem}
            />
          ) : currentTool === 'ideas' ? (
            <IdeaBank />
          ) : currentTool === 'planner' && (isAdmin || APP_VERSION === 'Blent' || (userProfile?.features || []).includes('planner')) ? (
            <PlannerDashboard />
          ) : (
            <ProfileView
              userEmail={user?.email || ''}
              initialProfile={userProfile}
              initialTab="settings"
              onUpdateProfile={(p) => {
                setUserProfile(p);
                setPostData(prev => ({ ...prev, name: p.name, handle: p.handle, avatarUrl: p.avatarUrl }));
              }}
              onDeleteLibraryItem={() => { }}
              onUseItem={handleUseLibraryItem}
            />
          )}
        </div>

        {/* Token Usage Banner */}
        {
          showTokens && !isAdmin && profile?.token_balance !== undefined && profile.token_balance < 5 && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 shadow-lg">
                <span className="text-base">?</span>
                <p className="text-sm font-bold text-amber-300 flex-1">
                  Seus créditos estão acabando! Garanta mais na nossa loja para não parar sua produção.
                </p>
                <button
                  onClick={() => setCurrentTool('tokens')}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 transition-all whitespace-nowrap"
                >
                  <ShoppingCart className="w-3 h-3" /> Ver Loja
                </button>
              </div>
            </div>
          )
        }

        {/* Caption Modal */}
        <AnimatePresence>
          {showCaptionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCaptionModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <Sparkles className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Legenda Sugerida</h3>
                        <p className="text-xs text-black/40 uppercase tracking-widest font-semibold">Gerada por IA</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCaptionModal(false)}
                      className="p-2 hover:bg-black/5 rounded-full transition-all"
                    >
                      <Trash2 className="w-5 h-5 text-black/20" />
                    </button>
                  </div>

                  <div className="bg-black/5 rounded-2xl p-6 max-h-[400px] overflow-y-auto">
                    <p className="text-sm text-black/80 font-medium leading-relaxed whitespace-pre-wrap">{caption}</p>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={copyCaption}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar Legenda
                    </button>
                    <button
                      onClick={() => setShowCaptionModal(false)}
                      className="px-6 py-3 border border-black/10 rounded-xl font-bold hover:bg-black/5 transition-all text-sm"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bug Report Modal */}
        <AnimatePresence>
          {showBugReport && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBugReport(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[#14141e] border border-white/[0.08] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Zap className="text-orange-400 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Reportar Bug</h3>
                    <p className="text-xs text-white/40 font-semibold">Ajude a melhorar o {APP_VERSION === 'Blent' ? 'Blent' : 'Blent Boost'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Ferramenta com Problema</label>
                    <select
                      value={bugTool}
                      onChange={(e) => setBugTool(e.target.value)}
                      className="w-full p-3 bg-[#0d0d12] border border-white/[0.08] rounded-xl text-white/90 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
                    >
                      <option value="Geral">Geral</option>
                      <option value="Remix">{APP_VERSION === 'Blent' ? 'Blent' : 'Blent Boost (Editor)'}</option>
                      <option value="Audience Insights">Audience Insights</option>
                      <option value="Roteirista de Anýncios">Roteirista de Anýncios</option>
                      <option value="Roteirista Storytelling">Roteirista Storytelling</option>
                      <option value="Banco de Ideias">Banco de Ideias</option>
                      <option value="Meu Acervo">Meu Acervo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Descrição do Problema</label>
                    <textarea
                      value={bugDesc}
                      onChange={(e) => setBugDesc(e.target.value)}
                      placeholder="Descreva o que aconteceu..."
                      className="w-full p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm h-32 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Imagem / Captura de Tela (Opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBugImageFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-white/[0.04] file:text-white/80 hover:file:bg-white/[0.08] cursor-pointer"
                    />
                    {bugImageFile && <p className="text-xs text-orange-400 mt-2 font-medium">{bugImageFile.name}</p>}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleBugSubmit}
                    disabled={isSubmittingBug}
                    className="flex-1 py-3 bg-orange-500 text-black rounded-xl font-bold hover:bg-orange-400 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingBug ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmittingBug ? 'Enviando...' : 'Enviar Relatório'}
                  </button>
                  <button
                    onClick={() => setShowBugReport(false)}
                    disabled={isSubmittingBug}
                    className="px-6 py-3 border border-white/[0.08] rounded-xl font-bold hover:bg-white/5 transition-all text-sm text-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div >
    </div >
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" richColors />
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, isAdmin, isSubscribed, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/reset-password') {
      setIsResetPassword(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from('user_insights')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setOnboardingDone(!!data);
    };
    checkOnboarding();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d12]">
        <Loader2 className="w-8 h-8 animate-spin text-white/20" />
      </div>
    );
  }

  if (isResetPassword) {
    return <ResetPassword />;
  }

  if (!user) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} initialMode={authMode} />;
    }
    if (APP_VERSION === 'Blent') {
      return (
        <LandingPage
          onGoToLogin={() => {
            setAuthMode('login');
            setShowAuth(true);
          }}
          onGoToSignup={() => {
            setAuthMode('signup');
            setShowAuth(true);
          }}
        />
      );
    }
    return (
      <LandingPage
        onGoToLogin={() => {
          setAuthMode('login');
          setShowAuth(true);
        }}
        onGoToSignup={() => {
          setAuthMode('signup');
          setShowAuth(true);
        }}
      />
    );
  }

  if (!isSubscribed && !isAdmin) {
    return <SubscriptionPage />;
  }

  return (
    <>
      {/* Onboarding modal for new users */}
      {onboardingDone === false && (
        <OnboardingModal open={true} onComplete={() => setOnboardingDone(true)} />
      )}
      <MainApp />
    </>
  );
}
