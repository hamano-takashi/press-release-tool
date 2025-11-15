# GitHub認証手順

## Personal Access Tokenの作成

1. GitHubにログインして、以下にアクセス:
   https://github.com/settings/tokens

2. 「Generate new token」→「Generate new token (classic)」をクリック

3. 以下の設定を行います:
   - **Note**: `press-release-tool` など、わかりやすい名前
   - **Expiration**: 有効期限を選択（90日、1年など）
   - **Scopes**: `repo` にチェック（すべてのリポジトリへのアクセス）

4. 「Generate token」をクリック

5. 表示されたトークンをコピー（一度しか表示されません）

## プッシュ方法

### 方法1: トークンをURLに含める（一時的）

```bash
git push https://hamano-takashi:YOUR_TOKEN@github.com/hamano-takashi/press-release-tool.git main
```

### 方法2: Git Credential Helperを使用（推奨）

```bash
# トークンを入力（パスワードの代わりにトークンを入力）
git push -u origin main
# Username: hamano-takashi
# Password: YOUR_TOKEN（ここにトークンを貼り付け）
```

### 方法3: SSH鍵を使用（最も安全）

1. SSH鍵を生成:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. 公開鍵をGitHubに追加:
   - https://github.com/settings/keys にアクセス
   - 「New SSH key」をクリック
   - 公開鍵（~/.ssh/id_ed25519.pub）の内容を貼り付け

3. リモートURLをSSHに変更:
   ```bash
   git remote set-url origin git@github.com:hamano-takashi/press-release-tool.git
   ```

4. プッシュ:
   ```bash
   git push -u origin main
   ```

