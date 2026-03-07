import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const highlightText = (text: string, color: string = '#fbbf24') => {
  if (!text) return '';
  const parts = text.split(/(\[\[.*?\]\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      return (
        <span key={i} style={{ color }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
};

export const renderContent = (title?: string, description?: string, className?: string, titleFont?: string, highlightColor?: string) => {
  const getFontClass = (font?: string) => {
    switch (font) {
      case 'serif': return 'font-serif';
      case 'display': return 'font-display';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h3 className={cn(
          "text-2xl font-black leading-tight tracking-tight",
          getFontClass(titleFont)
        )}>
          {highlightText(title, highlightColor)}
        </h3>
      )}
      {description && (
        <p className="text-sm font-medium opacity-60 leading-relaxed">
          {highlightText(description, highlightColor)}
        </p>
      )}
    </div>
  );
};
