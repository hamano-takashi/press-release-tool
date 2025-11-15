# プレスリリース原稿作成ツール

一般ユーザーが簡単にプレスリリース原稿を作成し、PDF・Word形式で出力できるWebアプリケーションです。

## 機能

- 📝 プレスリリース原稿の作成・編集
- 👁️ リアルタイムプレビュー
- 📄 PDF出力
- 📝 Word出力
- 🤖 AI支援機能（ガイド付き作成、自動案生成）

## 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **フォーム**: React Hook Form
- **PDF生成**: @react-pdf/renderer
- **Word生成**: docx

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# AI API（オプション - フェーズ3で使用）
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# 外部API（オプション - フェーズ3で使用）
NEWS_API_KEY=your_news_api_key
```

## 開発フェーズ

- **フェーズ1**: 基本機能実装（入力フォーム、プレビュー、PDF出力）
- **フェーズ2**: 拡張機能（Word出力、テンプレート、保存機能）
- **フェーズ3**: AI支援機能（ガイド付き作成、自動案生成）
- **フェーズ4**: 改善・最適化

## ドキュメント

- [要件定義書](./requirements.md)
- [技術設計書](./technical-design.md)

