# 変更履歴

このファイルには、プロジェクトへのすべての重要な変更が記録されます。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づき、
このプロジェクトは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [0.1.0] - 2025-11-15

### 追加
- プレスリリース原稿作成ツールの基本機能を実装
- 入力フォーム、リアルタイムプレビュー機能
- PDF出力機能（複数ページ対応、ページ番号表示）
- Word出力機能（.docx形式）
- ガイド付き作成機能（16の質問に答えて自動生成）
- AI自動プレスリリース案生成機能（5つのアングル）
- AI API連携（OpenAI GPT-4 / Anthropic Claude）
- 下書き保存・読み込み機能（ローカルストレージ）
- エラーハンドリングの強化
- レスポンシブデザイン対応

### 技術スタック
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Zustand（状態管理）
- @react-pdf/renderer（PDF生成）
- docx（Word生成）

### ドキュメント
- README.md: プロジェクト概要とセットアップ手順
- requirements.md: 要件定義書
- technical-design.md: 技術設計書
- DEPLOY.md: デプロイ手順

[0.1.0]: https://github.com/hamano-takashi/press-release-tool/releases/tag/v0.1.0

