# デプロイ手順

## Vercelへのデプロイ

### 方法1: Vercel CLIで直接デプロイ

1. Vercel CLIでログイン
   ```bash
   vercel login
   ```

2. プロジェクトをデプロイ
   ```bash
   vercel --prod
   ```

3. 環境変数を設定（VercelダッシュボードまたはCLI）
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add ANTHROPIC_API_KEY
   vercel env add NEWS_API_KEY  # オプション
   ```

### 方法2: GitHub経由でデプロイ

1. GitHubリポジトリを作成
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/press-release-tool.git
   git push -u origin main
   ```

2. Vercelダッシュボードでプロジェクトをインポート
   - https://vercel.com/new にアクセス
   - GitHubリポジトリを選択
   - 環境変数を設定
   - デプロイ

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

- `OPENAI_API_KEY` (オプション): OpenAI APIキー
- `ANTHROPIC_API_KEY` (オプション): Anthropic Claude APIキー
- `NEWS_API_KEY` (オプション): NewsAPIキー

### デプロイ後の確認

デプロイが完了したら、以下のURLでアクセスできます：
- 本番環境: `https://your-project.vercel.app`
- プレビュー環境: `https://your-project-git-branch.vercel.app`

