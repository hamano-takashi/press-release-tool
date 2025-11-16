# APIキー設定ガイド

このガイドでは、プレスリリース作成ツールで使用するAI APIキーの取得方法と設定方法を説明します。

## 📋 目次

1. [必要なAPIキー](#必要なapiキー)
2. [OpenAI APIキーの取得方法](#openai-apiキーの取得方法)
3. [Anthropic Claude APIキーの取得方法](#anthropic-claude-apiキーの取得方法)
4. [Google Gemini APIキーの取得方法](#google-gemini-apiキーの取得方法)
5. [環境変数の設定方法](#環境変数の設定方法)
6. [動作確認](#動作確認)

---

## 必要なAPIキー

このツールでは、以下のAI APIキーの**いずれか1つ以上**を設定する必要があります：

- **OpenAI APIキー** (GPT-4)
- **Anthropic APIキー** (Claude)
- **Google Gemini APIキー**

複数のAPIキーを設定した場合、自動選択モードで最適なAIが選択されます。

---

## OpenAI APIキーの取得方法

### 1. OpenAIアカウントの作成

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. 「Sign up」をクリックしてアカウントを作成（既にアカウントがある場合は「Log in」）

### 2. APIキーの取得

1. ログイン後、右上のプロフィールアイコンをクリック
2. 「View API keys」を選択
3. 「Create new secret key」をクリック
4. キー名を入力（例：「Press Release Tool」）
5. 「Create secret key」をクリック
6. **表示されたAPIキーをコピー**（このキーは一度しか表示されません）

### 3. 料金について

- OpenAI APIは従量課金制です
- GPT-4の料金: 入力 $0.03/1K tokens、出力 $0.06/1K tokens
- 無料クレジットが提供される場合があります
- [料金詳細](https://openai.com/pricing)

---

## Anthropic Claude APIキーの取得方法

### 1. Anthropicアカウントの作成

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. 「Sign up」をクリックしてアカウントを作成

### 2. APIキーの取得

1. ログイン後、右上の「Settings」をクリック
2. 「API Keys」タブを選択
3. 「Create Key」をクリック
4. キー名を入力（例：「Press Release Tool」）
5. 「Create Key」をクリック
6. **表示されたAPIキーをコピー**（このキーは一度しか表示されません）

### 3. 料金について

- Anthropic APIは従量課金制です
- Claude 3 Opusの料金: 入力 $15/1M tokens、出力 $75/1M tokens
- 無料トライアルが提供される場合があります
- [料金詳細](https://www.anthropic.com/pricing)

---

## Google Gemini APIキーの取得方法

### 1. Googleアカウントでログイン

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン

### 2. APIキーの取得

1. 「Create API Key」をクリック
2. プロジェクトを選択（または新規作成）
3. 「Create API Key in new project」または既存のプロジェクトを選択
4. **表示されたAPIキーをコピー**

### 3. 料金について

- Google Gemini APIは無料枠が提供されます
- 無料枠: 60リクエスト/分、1,500リクエスト/日
- 有料プランも利用可能
- [料金詳細](https://ai.google.dev/pricing)

---

## 環境変数の設定方法

### 1. `.env.local` ファイルの作成

プロジェクトのルートディレクトリ（`press-release-tool/`）に `.env.local` ファイルを作成します。

```bash
# プロジェクトのルートディレクトリに移動
cd press-release-tool

# .env.localファイルを作成（Mac/Linux）
touch .env.local

# Windowsの場合は、エクスプローラーで作成するか、以下のコマンドを使用
# type nul > .env.local
```

### 2. 環境変数の設定

`.env.local` ファイルを開き、取得したAPIキーを設定します：

```env
# OpenAI API Key (GPT-4)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic API Key (Claude)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini API Key
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# News API Key (オプション)
NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**重要**: 
- `your_openai_api_key_here` などのプレースホルダーを実際のAPIキーに置き換えてください
- 少なくとも1つのAI APIキーを設定してください
- `.env.local` ファイルはGitにコミットしないでください（既に`.gitignore`に含まれています）

### 3. 開発サーバーの再起動

環境変数を変更した後は、開発サーバーを再起動してください：

```bash
# 開発サーバーを停止（Ctrl+C）
# その後、再起動
npm run dev
```

---

## 動作確認

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. ブラウザで確認

1. [http://localhost:3000](http://localhost:3000) を開く
2. プレスリリース編集ページに移動
3. タイトル欄の「AI補助」ボタンをクリック
4. エラーが表示されず、タイトル案が生成されれば成功です

### 3. エラーが発生する場合

- `.env.local` ファイルが正しい場所にあるか確認
- APIキーが正しく設定されているか確認（余分なスペースや引用符がないか）
- 開発サーバーを再起動したか確認
- ブラウザのコンソールでエラーメッセージを確認

---

## トラブルシューティング

### エラー: "APIキーの設定が必要です"

- `.env.local` ファイルがプロジェクトのルートディレクトリにあるか確認
- 環境変数名が正しいか確認（`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`）
- 開発サーバーを再起動したか確認

### エラー: "APIエラー: 401 Unauthorized"

- APIキーが正しいか確認
- APIキーに余分なスペースや引用符が含まれていないか確認
- APIキーの有効期限が切れていないか確認

### エラー: "APIエラー: 429 Too Many Requests"

- APIのレート制限に達している可能性があります
- しばらく待ってから再試行してください
- 無料枠の使用量を確認してください

---

## セキュリティに関する注意事項

⚠️ **重要**: 

1. **`.env.local` ファイルは絶対にGitにコミットしないでください**
   - このファイルには機密情報が含まれています
   - `.gitignore` に既に含まれていますが、確認してください

2. **APIキーを他人と共有しないでください**
   - APIキーは個人のアカウントに関連付けられています
   - 共有すると、不正な使用や料金の発生につながる可能性があります

3. **本番環境では環境変数を適切に設定してください**
   - Vercel、Netlifyなどのホスティングサービスでは、環境変数を設定画面から設定できます
   - 詳細は [DEPLOY.md](./DEPLOY.md) を参照してください

---

## 参考リンク

- [OpenAI Platform](https://platform.openai.com/)
- [Anthropic Console](https://console.anthropic.com/)
- [Google AI Studio](https://makersuite.google.com/)
- [Next.js 環境変数](https://nextjs.org/docs/basic-features/environment-variables)

---

## サポート

問題が解決しない場合は、以下を確認してください：

1. ブラウザのコンソールでエラーメッセージを確認
2. サーバーのログを確認
3. APIキーの有効性を確認

