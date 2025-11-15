# プレスリリース原稿作成ツール 技術設計書

## 1. 技術スタック決定

### 1.1 フロントエンド

**決定技術：**
- **フレームワーク**: Next.js 14+ (App Router)
  - 理由：Reactベース、SSR/SSG対応、API Routesでバックエンド機能も実装可能
- **言語**: TypeScript
  - 理由：型安全性、保守性向上
- **スタイリング**: Tailwind CSS
  - 理由：開発速度、カスタマイズ性
- **状態管理**: Zustand または React Context API
  - 理由：軽量、シンプルな状態管理
- **フォーム管理**: React Hook Form
  - 理由：パフォーマンス、バリデーション
- **PDF生成**: react-pdf / @react-pdf/renderer
  - 理由：ReactコンポーネントとしてPDF生成可能
- **Word生成**: docx
  - 理由：軽量、TypeScript対応

### 1.2 バックエンド

**決定技術：**
- **フレームワーク**: Next.js API Routes (サーバーレス関数)
  - 理由：フロントエンドと同じプロジェクトで管理、デプロイが簡単
- **AI API**: OpenAI GPT-4 / Anthropic Claude API
  - 理由：日本語対応、高品質な生成
- **外部API連携**:
  - NewsAPI (ニュース取得)
  - Google News RSS (代替案)
- **ストレージ**: 
  - ローカルストレージ（ブラウザ）: 下書き保存用
  - 必要に応じて: Supabase / Firebase Storage (画像保存)

### 1.3 デプロイ

**決定環境：**
- **ホスティング**: Vercel
  - 理由：Next.jsとの親和性、サーバーレス関数対応、無料プランあり
- **環境変数管理**: Vercel Environment Variables
- **ドメイン**: 必要に応じてカスタムドメイン

## 2. データモデル設計

### 2.1 プレスリリースデータ構造

```typescript
interface PressRelease {
  // 基本情報
  id: string; // UUID
  createdAt: Date;
  updatedAt: Date;
  
  // ヘッダー情報
  companyName?: string;
  releaseDate: Date;
  
  // タイトル・ヘッドライン
  title: string;
  subtitle?: string;
  
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

interface PressReleaseSection {
  id: string;
  type: 'background' | 'development' | 'custom';
  title: string;
  content: string;
  order: number;
}

interface ImageData {
  id: string;
  url: string; // Base64またはURL
  filename: string;
  size: number;
  type: string; // MIME type
  width?: number;
  height?: number;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}
```

### 2.2 ガイド付き作成の回答データ

```typescript
interface GuidedCreationAnswers {
  // 基本情報
  companyName?: string;
  productServiceName?: string;
  releaseDate?: Date;
  
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
  logoImage?: File;
  mainImage?: File;
  additionalImages?: File[];
  
  // 問い合わせ先
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}
```

### 2.3 AI生成案のデータ構造

```typescript
interface AIGeneratedProposal {
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

type ProposalAngle = 
  | 'social-issue'      // 社会課題解決型
  | 'trend-aligned'     // トレンド連動型
  | 'seasonal'          // 季節性活用型
  | 'unique-story'      // ユニークストーリー型
  | 'industry-innovative'; // 業界革新型

interface AIAnalysisInput {
  productServiceName: string;
  description: string;
  industry: string;
  targetCustomers: string;
  features: string[];
  priceRange: string;
  releaseDate: Date;
}
```

## 3. API設計

### 3.1 エンドポイント一覧

#### 3.1.1 プレスリリース管理

```
GET    /api/press-releases          // 一覧取得（ローカルストレージ）
GET    /api/press-releases/:id      // 詳細取得
POST   /api/press-releases          // 新規作成
PUT    /api/press-releases/:id      // 更新
DELETE /api/press-releases/:id      // 削除
```

#### 3.1.2 AI機能

```
POST   /api/ai/guided-generation    // ガイド付き作成の原稿生成
POST   /api/ai/proposals            // 自動プレスリリース案生成
POST   /api/ai/analyze-trends       // トレンド分析（内部使用）
```

#### 3.1.3 画像管理

```
POST   /api/images/upload           // 画像アップロード
GET    /api/images/:id               // 画像取得
DELETE /api/images/:id               // 画像削除
```

#### 3.1.4 出力機能

```
POST   /api/export/pdf              // PDF出力
POST   /api/export/word             // Word出力
```

### 3.2 API詳細仕様

#### POST /api/ai/guided-generation

**リクエスト:**
```typescript
{
  answers: GuidedCreationAnswers;
  currentStep: number;
}
```

**レスポンス:**
```typescript
{
  success: boolean;
  pressRelease: PressRelease;
  nextStep?: number;
  error?: string;
}
```

#### POST /api/ai/proposals

**リクエスト:**
```typescript
{
  input: AIAnalysisInput;
}
```

**レスポンス:**
```typescript
{
  success: boolean;
  proposals: AIGeneratedProposal[];
  analysis: {
    trends: string[];
    newsTopics: string[];
    marketConditions: string;
  };
  error?: string;
}
```

#### POST /api/export/pdf

**リクエスト:**
```typescript
{
  pressRelease: PressRelease;
}
```

**レスポンス:**
```typescript
{
  success: boolean;
  pdfUrl: string; // Base64またはBlob URL
  error?: string;
}
```

## 4. 画面遷移設計

### 4.1 画面一覧

1. **トップページ** (`/`)
   - 新規作成 / 続きから作成 / テンプレート選択

2. **編集画面** (`/editor`)
   - 通常モード / ガイドモード / AI生成モードの切替

3. **ガイド付き作成画面** (`/editor/guided`)
   - 質問表示、回答入力、プレビュー

4. **AI生成画面** (`/editor/ai-generate`)
   - 情報入力、案一覧表示

### 4.2 画面遷移フロー

```
トップページ
  ├─ 新規作成 → 編集画面（通常モード）
  ├─ 続きから作成 → 編集画面（保存データ読み込み）
  └─ テンプレート選択 → 編集画面（テンプレート適用）

編集画面
  ├─ 通常モード（手動入力）
  ├─ ガイドモード → ガイド付き作成画面
  └─ AI生成モード → AI生成画面

ガイド付き作成画面
  └─ 完了 → 編集画面（生成された原稿を読み込み）

AI生成画面
  └─ 案選択 → 編集画面（選択した案を読み込み）
```

## 5. 状態管理設計

### 5.1 グローバル状態

```typescript
interface AppState {
  // 現在編集中のプレスリリース
  currentPressRelease: PressRelease | null;
  
  // 編集モード
  mode: 'normal' | 'guided' | 'ai-generate';
  
  // ガイド付き作成の状態
  guidedCreation: {
    currentStep: number;
    answers: GuidedCreationAnswers;
    isGenerating: boolean;
  };
  
  // AI生成の状態
  aiGeneration: {
    isGenerating: boolean;
    proposals: AIGeneratedProposal[];
    selectedProposal: string | null;
  };
  
  // UI状態
  ui: {
    sidebarOpen: boolean;
    previewMode: 'desktop' | 'mobile' | 'print';
  };
}
```

### 5.2 ローカルストレージ構造

```typescript
interface LocalStorageData {
  drafts: PressRelease[]; // 下書き一覧
  templates: Template[];  // カスタムテンプレート
  settings: UserSettings; // ユーザー設定
}
```

## 6. セキュリティ設計

### 6.1 APIキー管理

- 環境変数で管理（`NEXT_PUBLIC_` プレフィックスは使用しない）
- バックエンドAPI Routesでのみ使用
- Vercel Environment Variablesで設定

### 6.2 ファイルアップロード

- ファイルサイズ制限：10MB/画像
- ファイル形式チェック：jpg, png, gif, webp
- Base64エンコードでクライアント側で処理（サーバーストレージ不要の場合）

### 6.3 XSS対策

- Reactの自動エスケープ機能を活用
- ユーザー入力のサニタイズ
- 危険なHTMLタグのフィルタリング

## 7. パフォーマンス最適化

### 7.1 画像最適化

- Next.js Image コンポーネント使用
- 画像の遅延読み込み
- WebP形式への変換（可能な場合）

### 7.2 コード分割

- 動的インポートでAI機能を遅延読み込み
- PDF/Word生成ライブラリの遅延読み込み

### 7.3 キャッシュ戦略

- ローカルストレージで下書きをキャッシュ
- AI生成結果の一時キャッシュ（同じ入力の場合）

## 8. エラーハンドリング

### 8.1 エラー種別

```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_GENERATION_ERROR = 'AI_GENERATION_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
}
```

### 8.2 エラー処理方針

- ユーザーフレンドリーなエラーメッセージ（日本語）
- エラーログの記録（開発環境）
- リトライ機能（ネットワークエラーの場合）
- フォールバック機能（AI生成失敗時の代替案）

## 9. テスト戦略

### 9.1 テスト種別

- **単体テスト**: Jest + React Testing Library
- **統合テスト**: Playwright / Cypress
- **E2Eテスト**: 主要機能のフロー

### 9.2 テスト対象

- フォームバリデーション
- PDF/Word出力機能
- ローカルストレージ操作
- AI API連携（モック）

## 10. 開発環境セットアップ

### 10.1 必要な環境変数

```env
# AI API
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# 外部API
NEWS_API_KEY=your_news_api_key

# その他
NODE_ENV=development
```

### 10.2 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番環境起動
npm start

# テスト実行
npm test

# リント
npm run lint
```

---

**作成日：** 2025年1月
**バージョン：** 1.0

