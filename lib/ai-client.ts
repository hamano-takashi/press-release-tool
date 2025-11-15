/**
 * AI API連携クライアント
 * OpenAI GPT-4 または Anthropic Claude APIを使用してプレスリリースを生成
 */

interface AIPrompt {
  system: string
  user: string
}

interface AIResponse {
  content: string
  error?: string
}

/**
 * OpenAI APIを使用してテキストを生成
 */
async function generateWithOpenAI(prompt: AIPrompt): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEYが設定されていません')
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('OpenAI APIからコンテンツが返されませんでした')
    }

    return { content }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

/**
 * Anthropic Claude APIを使用してテキストを生成
 */
async function generateWithClaude(prompt: AIPrompt): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEYが設定されていません')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2024-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        system: prompt.system,
        messages: [
          {
            role: 'user',
            content: prompt.user,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `Claude API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      )
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      throw new Error('Claude APIからコンテンツが返されませんでした')
    }

    return { content }
  } catch (error) {
    console.error('Claude API error:', error)
    throw error
  }
}

/**
 * 利用可能なAI APIを使用してテキストを生成
 * OpenAI > Claude の順で試行
 */
export async function generateWithAI(prompt: AIPrompt): Promise<AIResponse> {
  // OpenAI APIを優先的に試行
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateWithOpenAI(prompt)
    } catch (error) {
      console.warn('OpenAI API failed, trying Claude:', error)
      // OpenAIが失敗した場合、Claudeを試行
      if (process.env.ANTHROPIC_API_KEY) {
        return await generateWithClaude(prompt)
      }
      throw error
    }
  }

  // Claude APIを試行
  if (process.env.ANTHROPIC_API_KEY) {
    return await generateWithClaude(prompt)
  }

  // どちらのAPIキーも設定されていない場合
  throw new Error('AI APIキーが設定されていません。OPENAI_API_KEYまたはANTHROPIC_API_KEYを設定してください。')
}

/**
 * プレスリリース生成用のプロンプトを作成
 */
export function createPressReleasePrompt(answers: any): AIPrompt {
  const systemPrompt = `あなたはプロのプレスリリースライターです。
ユーザーが提供する情報を基に、メディアに取り上げられやすい高品質なプレスリリース原稿を作成してください。

以下の要件を守ってください：
- 日本語で自然で読みやすい文章を作成
- メディアの関心を引く構成にする
- 事実に基づいた内容にする
- 簡潔で分かりやすい表現を使用
- プレスリリースの標準的なフォーマットに従う`

  const userPrompt = `以下の情報を基に、プレスリリース原稿を作成してください：

${JSON.stringify(answers, null, 2)}

以下の形式でJSON形式で返してください：
{
  "title": "プレスリリースのタイトル",
  "introduction": "導入段落",
  "sections": [
    {
      "type": "background",
      "title": "背景",
      "content": "背景セクションの内容"
    },
    {
      "type": "development",
      "title": "開発経緯",
      "content": "開発経緯セクションの内容"
    }
  ]
}`

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}

/**
 * プロポーザル生成用のプロンプトを作成
 * 特定のアングルでプレスリリース案を生成する
 */
export function createProposalPrompt(
  input: {
    productServiceName: string
    description: string
    industry: string
    targetCustomers: string
    features: string[]
    priceRange: string
    releaseDate: Date | string
  },
  angle: 'social-issue' | 'trend-aligned' | 'seasonal' | 'unique-story' | 'industry-innovative',
  analysis: {
    trends: string[]
    newsTopics: string[]
    marketConditions: string
  }
): AIPrompt {
  const angleDescriptions: Record<typeof angle, string> = {
    'social-issue': '社会課題解決型：社会課題の解決に貢献する角度で、社会的意義を強調します',
    'trend-aligned': 'トレンド連動型：現在のトレンドと関連付ける角度で、時事性を重視します',
    'seasonal': '季節性活用型：季節や時事に合わせた角度で、タイムリーなニュースとして構成します',
    'unique-story': 'ユニークストーリー型：独自性やストーリー性を強調する角度で、差別化を図ります',
    'industry-innovative': '業界革新型：業界に革新をもたらす角度で、業界への影響を強調します',
  }

  const systemPrompt = `あなたはプロのプレスリリースライターです。
商品・サービスの情報と最新のトレンド分析を基に、メディアに取り上げられやすい高品質なプレスリリース案を作成してください。

以下の要件を守ってください：
- 日本語で自然で読みやすい文章を作成
- 指定されたアングルに沿った内容にする
- メディアの関心を引く構成にする
- 事実に基づいた内容にする
- 簡潔で分かりやすい表現を使用
- トレンド分析の結果を適切に反映する`

  const userPrompt = `以下の情報を基に、${angleDescriptions[angle]}のアングルでプレスリリース案を作成してください：

【商品・サービス情報】
- 商品・サービス名: ${input.productServiceName}
- 詳細説明: ${input.description}
- 業界・カテゴリ: ${input.industry || '未指定'}
- ターゲット顧客: ${input.targetCustomers || '未指定'}
- 主な特徴: ${input.features.join('、') || '未指定'}
- 価格帯: ${input.priceRange || '未指定'}
- リリース予定日: ${typeof input.releaseDate === 'string' ? input.releaseDate : input.releaseDate.toISOString().split('T')[0]}

【トレンド分析結果】
- 注目トレンド: ${analysis.trends.join('、')}
- ニューストピック: ${analysis.newsTopics.join('、')}
- 市場状況: ${analysis.marketConditions}

以下の形式でJSON形式で返してください：
{
  "title": "プレスリリースのタイトル（メディアの関心を引くタイトル）",
  "introduction": "導入段落（最初の段落、読者の関心を引く内容）",
  "background": "背景セクションの内容（なぜ今このタイミングか）",
  "development": "開発経緯セクションの内容（開発のストーリー）",
  "recommendation": "このアングルが良い理由（なぜメディアに取り上げられやすいか）",
  "expectedMediaReaction": "想定されるメディア反応（どのようなメディアに響くか）"
}`

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}


