#!/bin/bash

# APIキー設定補助スクリプト
# このスクリプトは .env.local ファイルを作成するための補助ツールです

echo "=========================================="
echo "APIキー設定補助スクリプト"
echo "=========================================="
echo ""

# .env.localファイルが既に存在するか確認
if [ -f .env.local ]; then
    echo "⚠️  .env.local ファイルが既に存在します。"
    read -p "上書きしますか？ (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "処理をキャンセルしました。"
        exit 0
    fi
fi

echo ""
echo "以下のAI APIキーのいずれか1つ以上を設定してください："
echo "1. OpenAI API Key (GPT-4)"
echo "2. Anthropic API Key (Claude)"
echo "3. Google Gemini API Key"
echo ""
echo "（Enterキーを押すとスキップできます）"
echo ""

# OpenAI API Key
read -p "OpenAI API Key を入力してください: " openai_key
if [ -n "$openai_key" ]; then
    OPENAI_API_KEY="OPENAI_API_KEY=$openai_key"
else
    OPENAI_API_KEY="# OPENAI_API_KEY=your_openai_api_key_here"
fi

# Anthropic API Key
read -p "Anthropic API Key を入力してください: " anthropic_key
if [ -n "$anthropic_key" ]; then
    ANTHROPIC_API_KEY="ANTHROPIC_API_KEY=$anthropic_key"
else
    ANTHROPIC_API_KEY="# ANTHROPIC_API_KEY=your_anthropic_api_key_here"
fi

# Gemini API Key
read -p "Google Gemini API Key を入力してください: " gemini_key
if [ -n "$gemini_key" ]; then
    GEMINI_API_KEY="GEMINI_API_KEY=$gemini_key"
else
    GEMINI_API_KEY="# GEMINI_API_KEY=your_gemini_api_key_here"
fi

# News API Key (オプション)
read -p "News API Key を入力してください（オプション）: " news_key
if [ -n "$news_key" ]; then
    NEWS_API_KEY="NEWS_API_KEY=$news_key"
else
    NEWS_API_KEY="# NEWS_API_KEY=your_news_api_key_here"
fi

# .env.localファイルを作成
cat > .env.local << EOF
# AI API Keys
# 少なくとも1つのAI APIキーを設定してください（OpenAI、Anthropic、Geminiのいずれか）

# OpenAI API Key (GPT-4)
# 取得方法: https://platform.openai.com/api-keys
$OPENAI_API_KEY

# Anthropic API Key (Claude)
# 取得方法: https://console.anthropic.com/settings/keys
$ANTHROPIC_API_KEY

# Google Gemini API Key
# 取得方法: https://makersuite.google.com/app/apikey
$GEMINI_API_KEY

# News API Key (オプション)
# 取得方法: https://newsapi.org/register
$NEWS_API_KEY
EOF

echo ""
echo "✅ .env.local ファイルを作成しました！"
echo ""
echo "次のステップ:"
echo "1. 開発サーバーを再起動してください: npm run dev"
echo "2. ブラウザで http://localhost:3000 を開いてください"
echo "3. タイトル欄の「AI補助」ボタンをクリックして動作確認してください"
echo ""
echo "詳細な設定方法は API_KEY_SETUP.md を参照してください。"

