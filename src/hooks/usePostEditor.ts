import React, { useState, useRef, useCallback } from 'react';
import { PostData, PostSlide, SlideLayout } from '../types';

const MAX_SLIDES = 10;

const INITIAL_SLIDE: PostSlide = {
    id: crypto.randomUUID(),
    title: 'Título Impactante',
    description: 'Uma descrição detalhada que complementa o seu título e engaja o seu público.',
    layout: 'text-only',
    imageConfig: { scale: 1, x: 0, y: 0, brightness: 1 },
    bgBrightness: 1,
    bgBlur: 0,
    titleLineHeight: 1,
    descriptionLineHeight: 1.5,
    contentSpacing: 16,
    titleFontSize: 48,
    descriptionFontSize: 18,
    alignment: 'top'
};

export const INITIAL_DATA: PostData = {
    name: 'Seu Nome',
    handle: 'seu_arroba',
    avatarUrl: 'https://picsum.photos/seed/user/200/200',
    slides: [INITIAL_SLIDE],
    templateType: 'tweet',
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    accentColor: '#fbbf24',
    isVerified: true,
    showTwitterDate: true,
    aspectRatio: '1:1',
    captionColor: '#fbbf24',
    texture: 'none',
    textureIntensity: 0.15,
    titleFont: 'sans',
};

/**
 * Hook que encapsula toda a lógica de estado do editor de posts.
 * Extrai do App.tsx ~400 linhas de código, evitando mutações diretas de array.
 */
export function usePostEditor() {
    const [postData, setPostData] = useState<PostData>(INITIAL_DATA);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const postRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const slideImageInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const currentSlide = postData.slides[currentSlideIndex];

    /** Atualiza uma slide específica de forma imutável */
    const updateSlide = useCallback((index: number, updates: Partial<PostSlide>) => {
        setPostData(prev => ({
            ...prev,
            slides: prev.slides.map((slide, i) =>
                i === index ? { ...slide, ...updates } : slide
            )
        }));
    }, []);

    const handleAddSlide = useCallback(() => {
        if (postData.slides.length >= MAX_SLIDES) return;
        const newSlide: PostSlide = {
            id: crypto.randomUUID(),
            title: 'Novo Título',
            description: 'Nova descrição...',
            layout: 'text-only',
            imageConfig: { scale: 1, x: 0, y: 0 }
        };
        setPostData(prev => ({
            ...prev,
            slides: [...prev.slides, newSlide]
        }));
        setCurrentSlideIndex(prev => prev + 1);
    }, [postData.slides.length]);

    const handleRemoveSlide = useCallback((index: number) => {
        if (postData.slides.length <= 1) return;
        setPostData(prev => ({
            ...prev,
            slides: prev.slides.filter((_, i) => i !== index)
        }));
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
    }, [postData.slides.length]);

    const updateSlideTitle = useCallback((title: string) => {
        updateSlide(currentSlideIndex, { title });
    }, [currentSlideIndex, updateSlide]);

    const updateSlideDescription = useCallback((description: string) => {
        updateSlide(currentSlideIndex, { description });
    }, [currentSlideIndex, updateSlide]);

    const updateSlideLayout = useCallback((layout: SlideLayout) => {
        updateSlide(currentSlideIndex, { layout });
    }, [currentSlideIndex, updateSlide]);

    const updateSlideBlur = useCallback((bgBlur: number) => {
        updateSlide(currentSlideIndex, { bgBlur });
    }, [currentSlideIndex, updateSlide]);

    const updateSlideBrightness = useCallback((bgBrightness: number) => {
        updateSlide(currentSlideIndex, { bgBrightness });
    }, [currentSlideIndex, updateSlide]);

    const updateSlideTypography = useCallback((updates: Partial<Pick<PostSlide,
        'titleLineHeight' | 'descriptionLineHeight' | 'contentSpacing' | 'titleFontSize' | 'descriptionFontSize'>
    >) => {
        updateSlide(currentSlideIndex, updates);
    }, [currentSlideIndex, updateSlide]);

    const updateImageConfig = useCallback((config: Partial<NonNullable<PostSlide['imageConfig']>>) => {
        updateSlide(currentSlideIndex, {
            imageConfig: { ...currentSlide.imageConfig!, ...config }
        });
    }, [currentSlideIndex, updateSlide, currentSlide.imageConfig]);

    const removeSlideImage = useCallback(() => {
        updateSlide(currentSlideIndex, { imageUrl: undefined });
    }, [currentSlideIndex, updateSlide]);

    const applySuggestedImage = useCallback((url: string) => {
        updateSlide(currentSlideIndex, { imageUrl: url, layout: 'image-bg' });
    }, [currentSlideIndex, updateSlide]);

    const applySuggestedText = useCallback((title: string, description: string) => {
        updateSlide(currentSlideIndex, { title, description });
    }, [currentSlideIndex, updateSlide]);

    const setSuggestedImages = useCallback((images: string[]) => {
        updateSlide(currentSlideIndex, { suggestedImages: images });
    }, [currentSlideIndex, updateSlide]);

    const setSuggestedTexts = useCallback((variations: { title: string; description: string }[]) => {
        updateSlide(currentSlideIndex, { suggestedTexts: variations });
    }, [currentSlideIndex, updateSlide]);

    const handleSlideImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateSlide(currentSlideIndex, { imageUrl: base64 });
        };
        reader.readAsDataURL(file);
    }, [currentSlideIndex, updateSlide]);

    const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setPostData(prev => ({ ...prev, avatarUrl: base64 }));
        };
        reader.readAsDataURL(file);
    }, []);

    const getImageStyle = useCallback(() => {
        if (!currentSlide.imageConfig) return {};
        const { scale, x, y, brightness } = currentSlide.imageConfig;
        return {
            transform: `scale(${scale}) translate(${x}px, ${y}px)`,
            filter: `brightness(${brightness ?? 1})`,
            transition: 'transform 0.2s ease-out, filter 0.2s ease-out'
        };
    }, [currentSlide.imageConfig]);

    const canAddSlide = postData.slides.length < MAX_SLIDES;

    return {
        postData,
        setPostData,
        currentSlideIndex,
        setCurrentSlideIndex,
        currentSlide,
        canAddSlide,
        MAX_SLIDES,
        // Refs
        postRef,
        fileInputRef,
        slideImageInputRef,
        avatarInputRef,
        // Handlers
        handleAddSlide,
        handleRemoveSlide,
        updateSlideTitle,
        updateSlideDescription,
        updateSlideLayout,
        updateSlideBlur,
        updateSlideBrightness,
        updateSlideTypography,
        updateImageConfig,
        removeSlideImage,
        applySuggestedImage,
        applySuggestedText,
        setSuggestedImages,
        setSuggestedTexts,
        handleSlideImageUpload,
        handleAvatarUpload,
        getImageStyle,
    };
}
