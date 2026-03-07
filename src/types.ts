export type TemplateType = 'tweet' | 'quote' | 'minimal' | 'info' | 'atmospheric' | 'gradient' | 'side-card' | 'editorial';

export type ExportFormat = 'png' | 'jpeg' | 'pdf';

export type SlideLayout = 'text-only' | 'image-bg' | 'split-h' | 'split-v' | 'big-number';

export type AspectRatio = '1:1' | '4:5' | '9:16';
export type TextureType = 'none' | 'grain' | 'noise' | 'dots';
export type FontType = 'sans' | 'serif' | 'display' | 'mono';

export interface ImageConfig {
  scale: number;
  x: number;
  y: number;
  brightness?: number;
}

export interface PostSlide {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  layout?: SlideLayout;
  imageConfig?: ImageConfig;
  bgBlur?: number;
  bgBrightness?: number;
  titleLineHeight?: number;
  descriptionLineHeight?: number;
  contentSpacing?: number;
  titleFontSize?: number;
  descriptionFontSize?: number;
  alignment?: 'top' | 'center' | 'bottom';
  suggestedImages?: string[];
  suggestedTexts?: { title: string; description: string }[];
}

export interface PostData {
  name: string;
  handle: string;
  avatarUrl: string;
  slides: PostSlide[];
  templateType: TemplateType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  isVerified: boolean;
  showTwitterDate?: boolean;
  aspectRatio: AspectRatio;
  captionColor: string;
  texture: TextureType;
  textureIntensity: number;
  titleFont: FontType;
}

export type ToolType = 'home' | 'remix' | 'insights' | 'ads' | 'storytelling' | 'ideas' | 'profile' | 'library' | 'admin' | 'tokens' | 'planner' | 'strategy';

export interface AdScript {
  id: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  optimizationTips: string;
  tone: 'pain' | 'fear' | 'desire' | 'difficulty';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio?: string;
  role?: 'admin' | 'user';
  subscription_status?: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled';
  subscription_plan?: 'monthly' | 'quarterly' | 'annual';
  stripe_customer_id?: string;
  last_payment_date?: string;
  created_at?: string;
  token_balance?: number;
  is_unlimited?: boolean;
  features?: string[];
  saved_audience?: string;
  saved_product?: string;
  level?: number;
  xp?: number;
}

/** Representa um insight gerado pela IA sobre o público-alvo */
export interface Insight {
  question: string;
  category: string;
  strategy: string;
  hook: string;
}

export interface LibraryItem {
  id: number;
  user_email: string;
  type: 'static' | 'ad-script' | 'insight' | 'storytelling-script' | 'idea' | 'content-strategy';
  content: PostData | AdScript | Insight[] | Record<string, unknown> | { title: string, text: string } | { note: string, color?: string, title?: string, expansion?: string, facts?: string[], cta?: string, isCompleted?: boolean } | ContentIdea;
  created_at: string;
}

export interface ContentIdea {
  id: number;
  title: string;
  purpose: string;
  description: string;
  expanded?: {
    hook: string;
    content: string;
    cta: string;
    visualNotes: string;
  };
}

export type Platform = 'instagram' | 'tiktok' | 'facebook' | 'youtube';

export interface PlannerPost {
  id: string;
  user_id: string;
  title: string;
  start_date: string;
  platform: Platform;
  is_posted: boolean;
  format?: string;
  description?: string;
  image_url?: string;
  caption?: string;
  created_at?: string;

  // Integração com Instagram
  is_idea?: boolean;
  scheduled_time?: string;
  status?: 'IDEA' | 'SCHEDULED' | 'PUBLISHED' | 'ERROR';
  ig_container_id?: string;
  ig_media_id?: string;
}
