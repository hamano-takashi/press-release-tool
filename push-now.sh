#!/bin/bash
# GitHubへのプッシュスクリプト（自動実行版）

echo "=========================================="
echo "GitHubへのプッシュを実行します"
echo "=========================================="
echo ""

cd /Users/takashihamano/.cursor/press-release-tool

# リモートリポジトリの確認
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "リモートリポジトリを設定中..."
    git remote add origin https://github.com/hamano-takashi/press-release-tool.git
fi

echo "リモートリポジトリ:"
git remote get-url origin
echo ""

# ブランチの確認
git branch -M main
echo ""

echo "プッシュを実行します..."
echo "認証が求められたら、Personal Access Tokenを入力してください。"
echo ""
echo "トークンがない場合は、以下で作成してください:"
echo "https://github.com/settings/tokens"
echo ""
echo "----------------------------------------"
echo ""

# プッシュを実行
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ プッシュが完了しました！"
    echo "=========================================="
    echo ""
    echo "GitHubリポジトリ:"
    echo "https://github.com/hamano-takashi/press-release-tool"
    echo ""
else
    echo ""
    echo "=========================================="
    echo "❌ プッシュに失敗しました"
    echo "=========================================="
    echo ""
    echo "【対処方法】"
    echo "1. Personal Access Tokenを作成:"
    echo "   https://github.com/settings/tokens"
    echo ""
    echo "2. 以下のコマンドで再度プッシュ:"
    echo "   cd /Users/takashihamano/.cursor/press-release-tool"
    echo "   git push -u origin main"
    echo ""
    echo "   認証が求められたら:"
    echo "   - Username: hamano-takashi"
    echo "   - Password: （トークンを貼り付け）"
    echo ""
fi

