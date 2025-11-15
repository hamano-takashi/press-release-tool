#!/bin/bash
# GitHub認証確認と自動プッシュスクリプト

echo "=========================================="
echo "GitHub認証確認とプッシュ"
echo "=========================================="
echo ""

cd /Users/takashihamano/.cursor/press-release-tool

# GitHub CLIの認証状態を確認
if gh auth status > /dev/null 2>&1; then
    echo "✅ GitHub CLIで認証済みです"
    echo ""
    echo "プッシュを実行します..."
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
        echo "❌ プッシュに失敗しました"
    fi
else
    echo "❌ GitHub CLIで認証されていません"
    echo ""
    echo "認証するには、以下のコマンドを実行してください:"
    echo "  gh auth login"
    echo ""
    echo "または、Personal Access Tokenを使用してプッシュ:"
    echo "  git push -u origin main"
    echo "  （認証が求められたら、トークンを入力）"
fi

