# GitHubへのクイックプッシュ手順

## 最も簡単な方法：GitHub CLIを使用

```bash
cd /Users/takashihamano/.cursor/press-release-tool

# GitHub CLIで認証（ブラウザが開きます）
gh auth login

# 認証後、自動的にプッシュ
git push -u origin main
```

## Personal Access Tokenを使用する場合

1. **トークンを作成**:
   - https://github.com/settings/tokens にアクセス
   - 「Generate new token (classic)」をクリック
   - Note: `press-release-tool`
   - Scopes: `repo` にチェック
   - 「Generate token」をクリック
   - トークンをコピー

2. **プッシュを実行**:
   ```bash
   cd /Users/takashihamano/.cursor/press-release-tool
   git push -u origin main
   ```
   
   認証が求められたら:
   - Username: `hamano-takashi`
   - Password: （トークンを貼り付け）

## 現在の設定

- **リモートリポジトリ**: `https://github.com/hamano-takashi/press-release-tool.git`
- **ブランチ**: `main`
- **コミット**: 完了（42ファイル、12,496行）

## プッシュ後の確認

プッシュが完了したら、以下で確認できます:
https://github.com/hamano-takashi/press-release-tool

