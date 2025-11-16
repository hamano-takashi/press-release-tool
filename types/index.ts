// プレスリリースの型定義

export interface ImageData {
  id: string;
  url: string; // Base64またはURL
  filename: string;
  size: number;
  type: string; // MIME type
  width?: number;
  height?: number;
}

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface PressReleaseSection {
  id: string;
  type: 'background' | 'development' | 'custom';
  title: string;
  content: string;
  order: number;
}

export interface PressRelease {
  // 基本情報
  id: string; // UUID
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // ヘッダー情報
  companyName?: string;
  releaseDate: Date | string;
  
  // タイトル・ヘッドライン
  title: string;
  subtitle?: string;
  slogan?: string; // スローガン・キャッチコピー
  
  // 本文
  introduction: string; // 導入段落
  sections: PressReleaseSection[]; // セクション配列
  
  // 画像
  logoImage?: ImageData;
  mainImage?: ImageData;
  additionalImages: ImageData[];
  
  // 問い合わせ先
  contact: ContactInfo;
  
  // メタデータ
  templateId?: string;
  tags?: string[];
}

// ガイド付き作成の回答データ
export interface GuidedCreationAnswers {
  // 基本情報
  companyName?: string;
  productServiceName?: string;
  releaseDate?: Date | string;
  
  // 商品・サービス詳細
  features?: string[]; // 特徴（3つ）
  targetCustomers?: string;
  price?: string;
  availability?: string;
  
  // 背景・ストーリー
  purpose?: string;
  background?: string;
  socialRelevance?: string;
  
  // 画像
  logoImage?: File | ImageData;
  mainImage?: File | ImageData;
  additionalImages?: (File | ImageData)[];
  
  // 問い合わせ先
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

// AI生成案のデータ構造
export type ProposalAngle = 
  | 'social-issue'      // 社会課題解決型
  | 'trend-aligned'     // トレンド連動型
  | 'seasonal'          // 季節性活用型
  | 'unique-story'      // ユニークストーリー型
  | 'industry-innovative'; // 業界革新型

export interface AIGeneratedProposal {
  id: string;
  angle: ProposalAngle;
  title: string;
  introduction: string;
  background: string;
  development: string;
  recommendation: string; // 推奨理由
  expectedMediaReaction: string;
  preview: PressRelease; // 完全な原稿プレビュー
}

export interface AIAnalysisInput {
  productServiceName: string;
  description: string;
  industry: string;
  targetCustomers: string;
  features: string[];
  priceRange: string;
  releaseDate: Date | string;
}

// アプリケーションの状態管理
export type EditorMode = 'normal' | 'guided' | 'ai-generate';

export interface GuidedCreationState {
  currentStep: number;
  answers: GuidedCreationAnswers;
  isGenerating: boolean;
}

export interface AIGenerationState {
  isGenerating: boolean;
  proposals: AIGeneratedProposal[];
  selectedProposal: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  previewMode: 'desktop' | 'mobile' | 'print';
}

export interface AppState {
  // 現在編集中のプレスリリース
  currentPressRelease: PressRelease | null;
  
  // 編集モード
  mode: EditorMode;
  
  // ガイド付き作成の状態
  guidedCreation: GuidedCreationState;
  
  // AI生成の状態
  aiGeneration: AIGenerationState;
  
  // UI状態
  ui: UIState;
}

// テンプレートの型定義
export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'product' | 'service' | 'event' | 'custom';
  preview?: string; // プレビュー画像のURL（オプション）
  pressRelease: Omit<PressRelease, 'id' | 'createdAt' | 'updatedAt'>; // テンプレートの内容
  createdAt: Date | string;
  updatedAt: Date | string;
  isDefault?: boolean; // デフォルトテンプレートかどうか
}

