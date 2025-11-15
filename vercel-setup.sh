#!/bin/bash
# Vercel CLI認証設定スクリプト

echo "Vercel CLI認証を設定します..."
echo ""

# 既存の設定をクリア
rm -rf ~/.vercel .vercel 2>/dev/null
unset VERCEL_TOKEN

# Vercel CLIでログイン
echo "以下の手順で認証を完了してください："
echo "1. ブラウザが自動的に開きます"
echo "2. Vercelアカウントでログインしてください"
echo "3. デバイス認証を完了してください"
echo ""
read -p "準備ができたらEnterキーを押してください..."

vercel login

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 認証が完了しました！"
    echo ""
    echo "デプロイするには以下のコマンドを実行してください："
    echo "  vercel --prod"
else
    echo ""
    echo "❌ 認証に失敗しました。もう一度お試しください。"
fi

