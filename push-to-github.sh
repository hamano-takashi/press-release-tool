#!/bin/bash
# GitHubへのプッシュスクリプト

echo "=========================================="
echo "GitHubへのプッシュ手順"
echo "=========================================="
echo ""

# 現在の状態を確認
echo "📋 現在の状態を確認中..."
git status --short
echo ""

# リモートリポジトリの確認
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ リモートリポジトリが設定されています:"
    git remote get-url origin
    echo ""
    echo "プッシュを実行しますか？ (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        echo ""
        echo "🚀 GitHubにプッシュ中..."
        git push -u origin main
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ プッシュが完了しました！"
        else
            echo ""
            echo "❌ プッシュに失敗しました。認証が必要な可能性があります。"
            echo "Personal Access Tokenを使用してプッシュしてください。"
        fi
    else
        echo "プッシュをキャンセルしました。"
    fi
else
    echo "❌ リモートリポジトリが設定されていません。"
    echo ""
    echo "以下の手順でリポジトリを設定してください："
    echo ""
    echo "1. GitHubでリポジトリを作成:"
    echo "   https://github.com/new にアクセス"
    echo ""
    echo "2. リポジトリ名を入力（例: press-release-tool）"
    echo ""
    echo "3. 以下のコマンドを実行（YOUR_USERNAMEを実際のユーザー名に置き換え）:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/press-release-tool.git"
    echo ""
    echo "4. 再度このスクリプトを実行:"
    echo "   ./push-to-github.sh"
fi

