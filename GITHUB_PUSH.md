# GitHubへのプッシュ手順

## 1. GitHubでリポジトリを作成

1. https://github.com/new にアクセス
2. リポジトリ名を入力（例: `press-release-tool`）
3. 公開設定を選択（Public または Private）
4. 「Create repository」をクリック

## 2. リモートリポジトリを追加してプッシュ

```bash
cd /Users/takashihamano/.cursor/press-release-tool

# GitHubで作成したリポジトリのURLを設定（YOUR_USERNAMEを実際のユーザー名に置き換え）
git remote add origin https://github.com/YOUR_USERNAME/press-release-tool.git

# メインブランチを設定
git branch -M main

# プッシュ
git push -u origin main
```

## 3. GitHub認証

初回プッシュ時は認証が必要です：
- Personal Access Tokenを使用する方法
- GitHub CLIを使用する方法

### Personal Access Tokenを使用する場合

1. https://github.com/settings/tokens でトークンを作成
2. `repo`スコープを選択
3. トークンをコピー
4. プッシュ時にパスワードの代わりにトークンを入力

