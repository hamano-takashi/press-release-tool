# プレスリリース原稿作成ツール - プロジェクト概要

## 📋 プロジェクト情報

- **プロジェクト名**: プレスリリース原稿作成ツール
- **バージョン**: v0.1.0
- **リリース日**: 2025-11-15
- **GitHubリポジトリ**: https://github.com/hamano-takashi/press-release-tool
- **技術スタック**: Next.js 14+, TypeScript, Tailwind CSS

---

## 🎯 プロジェクトの目的

一般ユーザーが簡単にプレスリリース原稿を作成し、PDF・Word形式で出力できるWebアプリケーションを提供します。

---

## ✨ 主な機能

### 1. 基本機能
- ✅ **入力フォーム**: タイトル、本文、画像、問い合わせ先などを入力
- ✅ **リアルタイムプレビュー**: 入力内容が即座にプレビューに反映
- ✅ **PDF出力**: 複数ページ対応、ページ番号表示
- ✅ **Word出力**: .docx形式で編集可能なファイルを出力
- ✅ **下書き保存**: ローカルストレージに保存・読み込み

### 2. AI支援機能
- ✅ **ガイド付き作成**: 16の質問に答えて自動生成
- ✅ **AI自動生成**: 5つのアングルで複数のプレスリリース案を生成
  - 社会課題解決型
  - トレンド連動型
  - 季節性活用型
  - ユニークストーリー型
  - 業界革新型

### 3. 技術的な特徴
- ✅ **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- ✅ **エラーハンドリング**: ユーザーフレンドリーなエラーメッセージ
- ✅ **AI API連携**: OpenAI GPT-4 / Anthropic Claude対応

---

## 📁 プロジェクト構成

```
press-release-tool/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── ai/            # AI関連API
│   ├── editor/             # エディターページ
│   └── page.tsx            # トップページ
├── components/             # Reactコンポーネント
│   └── editor/            # エディター関連コンポーネント
├── lib/                    # ユーティリティ関数
│   ├── ai-client.ts       # AI API連携
│   ├── pdf-generator.tsx   # PDF生成
│   └── word-generator.ts   # Word生成
├── store/                  # 状態管理（Zustand）
├── types/                  # TypeScript型定義
└── docs/                   # ドキュメント
```

---

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定（オプション）

`.env.local`ファイルを作成:

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
NEWS_API_KEY=your_news_api_key
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

---

## 📦 バージョン管理

### 現在のバージョン: v0.1.0

### コミット履歴

1. **f53f1c9** - feat: プレスリリース原稿作成ツールの実装完了
   - 基本機能の実装
   - AI支援機能の実装
   - PDF/Word出力機能

2. **1c285a5** - docs: デプロイ手順とバージョン管理ドキュメントを追加
   - デプロイ手順の追加
   - CHANGELOG.mdの作成

3. **28c4680** - docs: バージョン管理ドキュメントを追加
   - VERSION.mdの作成

### タグ

- **v0.1.0**: 初回リリース（2025-11-15）

---

## 🔗 リンク

- **GitHubリポジトリ**: https://github.com/hamano-takashi/press-release-tool
- **リリース**: https://github.com/hamano-takashi/press-release-tool/releases/tag/v0.1.0

---

## 📝 ドキュメント

- [README.md](./README.md) - プロジェクト概要とセットアップ
- [requirements.md](./requirements.md) - 要件定義書
- [technical-design.md](./technical-design.md) - 技術設計書
- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴
- [VERSION.md](./VERSION.md) - バージョン管理
- [DEPLOY.md](./DEPLOY.md) - デプロイ手順

---

## 🎉 次のステップ

1. **Vercelでデプロイ**: GitHubリポジトリをVercelに接続して自動デプロイ
2. **環境変数の設定**: AI機能を使う場合はVercelダッシュボードでAPIキーを設定
3. **機能の拡張**: テンプレート機能、NewsAPI連携など

---

**作成日**: 2025-11-15  
**最終更新**: 2025-11-15

