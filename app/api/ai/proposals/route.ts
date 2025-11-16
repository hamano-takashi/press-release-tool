import { NextRequest, NextResponse } from 'next/server'
import { AIAnalysisInput, AIGeneratedProposal, ProposalAngle, PressRelease, AIType, SCALEPower } from '@/types'
import { generateId } from '@/lib/utils'
import { toAppError, getUserFriendlyMessage, logError } from '@/lib/error-handler'
import { generateWithAI, createProposalPrompt } from '@/lib/ai-client'
import { fetchIndustryNews, extractTrendsFromNews } from '@/lib/news-api'
import { ANGLE_TO_SCALE_POWERS, checkCompatibility, SCALE_POWERS } from '@/lib/scale-pr-model'

/**
 * AI自動プレスリリース案生成API
 * 商品・サービスの情報から複数のプレスリリース案を生成します
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input } = body as { input: AIAnalysisInput }

    // 入力検証
    if (!input.productServiceName || !input.description) {
      return NextResponse.json(
        {
          success: false,
          error: '商品・サービス名と詳細説明は必須です',
        },
        { status: 400 }
      )
    }

    // トレンド分析（実際の実装では外部APIを呼び出す）
    const analysis = await analyzeTrends(input)

    // 選択されたAIタイプを取得（デフォルトは'auto'）
    const selectedAI: AIType = input.selectedAI || 'auto'

    // 複数のアングルでプレスリリース案を生成
    const proposals = await generateProposals(input, analysis, selectedAI)

    console.log(`Generated ${proposals.length} proposals`)

    // 適合性が低い提案も含めて全て返す（フィルタリングしない）
    // 適合性スコアは提案に含まれているので、ユーザーが判断できる
    // ただし、スコアが非常に低い（10未満）ものは除外する
    const filteredProposals = proposals.filter(p => {
      if (p.compatibilityScore === undefined) return true // スコアがない場合は含める
      return p.compatibilityScore >= 10 // スコア10以上は含める
    })

    console.log(`Filtered proposals: ${filteredProposals.length} out of ${proposals.length}`)

    // 提案が1つもない場合は、最低限の提案を生成する
    if (filteredProposals.length === 0 && proposals.length > 0) {
      // スコアが最も高い提案を1つ返す
      const bestProposal = proposals.reduce((best, current) => {
        const bestScore = best.compatibilityScore || 0
        const currentScore = current.compatibilityScore || 0
        return currentScore > bestScore ? current : best
      })
      filteredProposals.push(bestProposal)
      console.log(`Using best proposal with score: ${bestProposal.compatibilityScore}`)
    }

    return NextResponse.json({
      success: true,
      proposals: filteredProposals,
      analysis,
      totalGenerated: proposals.length,
      compatibleCount: filteredProposals.length,
    })
  } catch (error) {
    console.error('Proposal generation error:', error)
    const appError = toAppError(error)
    logError(appError)
    
    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyMessage(appError),
      },
      { status: 500 }
    )
  }
}

/**
 * トレンド分析
 * NewsAPIを使用して実際のニュースとトレンドを取得
 */
async function analyzeTrends(input: AIAnalysisInput) {
  const apiKey = process.env.NEWS_API_KEY

  // NewsAPIキーがある場合は実際のAPIを使用
  if (apiKey) {
    try {
      // 業界に関連するニュースを取得
      const industryNews = await fetchIndustryNews(input.industry || input.productServiceName)

      // ニュースからトレンドキーワードを抽出
      const trends = extractTrendsFromNews(industryNews)

      // ニューストピックを抽出
      const newsTopics = industryNews.slice(0, 5).map((article) => article.title)

      // 市場状況を分析（ニュースの内容から推測）
      const marketConditions = analyzeMarketConditions(industryNews, input)

      return {
        trends: trends.length > 0 ? trends : getDefaultTrends(),
        newsTopics: newsTopics.length > 0 ? newsTopics : getDefaultNewsTopics(),
        marketConditions,
        articles: industryNews.slice(0, 5), // 最新5件の記事
      }
    } catch (error) {
      console.warn('NewsAPI連携に失敗しました。モックデータを使用します:', error)
      // エラー時はモックデータを返す
      return getMockTrendAnalysis(input)
    }
  }

  // NewsAPIキーがない場合はモックデータを返す
  return getMockTrendAnalysis(input)
}

/**
 * モックトレンド分析データ
 */
function getMockTrendAnalysis(input: AIAnalysisInput) {
  return {
    trends: [
      'AI技術の進化',
      'DX推進',
      'サステナビリティ',
      'リモートワーク',
      '健康意識の高まり',
    ],
    newsTopics: [
      'AI活用事例の増加',
      'デジタル変革の加速',
      '環境配慮型サービスの拡大',
    ],
    marketConditions: '市場は成長傾向にあり、イノベーションが求められています',
    articles: [],
  }
}

/**
 * デフォルトのトレンド
 */
function getDefaultTrends(): string[] {
  return [
    'AI技術の進化',
    'DX推進',
    'サステナビリティ',
    'リモートワーク',
    '健康意識の高まり',
  ]
}

/**
 * デフォルトのニューストピック
 */
function getDefaultNewsTopics(): string[] {
  return [
    'AI活用事例の増加',
    'デジタル変革の加速',
    '環境配慮型サービスの拡大',
  ]
}

/**
 * 市場状況を分析
 */
function analyzeMarketConditions(
  articles: Array<{ title: string; description: string }>,
  input: AIAnalysisInput
): string {
  if (articles.length === 0) {
    return '市場は成長傾向にあり、イノベーションが求められています'
  }

  // 記事の内容から市場状況を推測
  const positiveKeywords = ['成長', '拡大', '増加', '好調', '成功']
  const negativeKeywords = ['減少', '縮小', '低迷', '課題', '問題']

  let positiveCount = 0
  let negativeCount = 0

  articles.forEach((article) => {
    const text = `${article.title} ${article.description}`
    positiveKeywords.forEach((keyword) => {
      if (text.includes(keyword)) positiveCount++
    })
    negativeKeywords.forEach((keyword) => {
      if (text.includes(keyword)) negativeCount++
    })
  })

  if (positiveCount > negativeCount) {
    return `${input.industry || '市場'}は成長傾向にあり、${input.productServiceName}のようなイノベーションが求められています`
  } else if (negativeCount > positiveCount) {
    return `${input.industry || '市場'}では課題が存在しており、${input.productServiceName}のような解決策が期待されています`
  } else {
    return `${input.industry || '市場'}は安定した状況にあり、${input.productServiceName}のような新たなアプローチが注目されています`
  }
}

/**
 * 複数のアングルでプレスリリース案を生成
 */
async function generateProposals(
  input: AIAnalysisInput,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>,
  selectedAI: AIType
): Promise<AIGeneratedProposal[]> {
  const angles: ProposalAngle[] = [
    'social-issue',
    'trend-aligned',
    'seasonal',
    'unique-story',
    'industry-innovative',
  ]

  const proposals: AIGeneratedProposal[] = []

  for (const angle of angles) {
    try {
      // 適合性チェック
      const compatibility = checkCompatibility(input, analysis.trends, angle)
      
      console.log(`Angle ${angle}: compatibility score = ${compatibility.score}, isCompatible = ${compatibility.isCompatible}`)
      
      // 適合性が非常に低い場合（スコア10未満）のみスキップ
      // ただし、AI APIが利用できない場合はテンプレートベースで生成するため、スキップしない
      // また、trend-alignedアングルは常に生成する（トレンド分析結果に基づくため）
      const hasAIApi = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY
      if (compatibility.score < 10 && hasAIApi && angle !== 'trend-aligned') {
        console.log(`Skipping angle ${angle} due to very low compatibility score: ${compatibility.score}`)
        continue
      }

      const proposal = await generateProposalForAngle(input, angle, analysis, selectedAI, compatibility)
      proposals.push(proposal)
    } catch (error) {
      console.error(`Error generating proposal for angle ${angle}:`, error)
      // エラーが発生しても他のアングルの生成を続ける
    }
  }

  return proposals
}

/**
 * 特定のアングルでプレスリリース案を生成
 * AI APIが利用可能な場合はAIを使用、そうでない場合はテンプレートベースで生成
 * SCALE PR Competency Modelの力を憑依させる
 */
async function generateProposalForAngle(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>,
  selectedAI: AIType,
  compatibility: { score: number; isCompatible: boolean; reasons: string[] }
): Promise<AIGeneratedProposal> {
  const releaseDate = input.releaseDate
    ? typeof input.releaseDate === 'string'
      ? new Date(input.releaseDate)
      : input.releaseDate
    : new Date()

  // SCALE PRの力を取得
  const scalePowers = ANGLE_TO_SCALE_POWERS[angle]
  const scalePowerNames = scalePowers.map(power => SCALE_POWERS[power].name)

  // AI APIが利用可能な場合はAIを使用
  const hasAIApi = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY

  if (hasAIApi) {
    try {
      const prompt = createProposalPrompt(
        input,
        angle,
        analysis,
        scalePowerNames,
        compatibility
      )
      const aiResponse = await generateWithAI(prompt, selectedAI)

      // AIの応答をパース
      try {
        const aiContent = JSON.parse(aiResponse.content)
        return createProposalFromAIResponse(
          input,
          angle,
          releaseDate,
          aiContent,
          compatibility,
          scalePowers
        )
      } catch (parseError) {
        console.warn('AI response parsing failed, using template:', parseError)
        // パースに失敗した場合はテンプレートベースで生成
        return generateProposalFromTemplate(input, angle, analysis, releaseDate, compatibility, scalePowers)
      }
    } catch (aiError) {
      console.warn('AI generation failed, using template:', aiError)
      // AI生成に失敗した場合はテンプレートベースで生成
      return generateProposalFromTemplate(input, angle, analysis, releaseDate, compatibility, scalePowers)
    }
  }

  // AI APIが利用できない場合はテンプレートベースで生成
  return generateProposalFromTemplate(input, angle, analysis, releaseDate, compatibility, scalePowers)
}

/**
 * テンプレートベースでプロポーザルを生成
 */
function generateProposalFromTemplate(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>,
  releaseDate: Date,
  compatibility: { score: number; isCompatible: boolean; reasons: string[] },
  scalePowers: string[]
): AIGeneratedProposal {
  const { title, introduction, background, development, recommendation, expectedMediaReaction } =
    generateContentForAngle(input, angle, analysis)

  const pressRelease: PressRelease = {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    releaseDate,
    companyName: '',
    title,
    introduction,
    sections: [
      {
        id: generateId(),
        type: 'background',
        title: '背景',
        content: background,
        order: 0,
      },
      {
        id: generateId(),
        type: 'development',
        title: '開発経緯',
        content: development,
        order: 1,
      },
    ],
    additionalImages: [],
    contact: {
      name: '',
      phone: '',
      email: '',
    },
  }

  return {
    id: generateId(),
    angle,
    title,
    introduction,
    background,
    development,
    recommendation,
    expectedMediaReaction,
    preview: pressRelease,
    compatibilityScore: compatibility.score,
    scalePowers: scalePowers as SCALEPower[],
    isCompatible: compatibility.isCompatible,
  }
}

/**
 * AIの応答からプロポーザルオブジェクトを作成
 */
function createProposalFromAIResponse(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  releaseDate: Date,
  aiContent: any,
  compatibility: { score: number; isCompatible: boolean; reasons: string[] },
  scalePowers: string[]
): AIGeneratedProposal {
  const title = aiContent.title || input.productServiceName || 'プレスリリース'
  const introduction = aiContent.introduction || ''
  const background = aiContent.background || ''
  const development = aiContent.development || ''
  const recommendation = aiContent.recommendation || 'このアングルはメディアの関心を引く可能性があります。'
  const expectedMediaReaction = aiContent.expectedMediaReaction || '幅広いメディアでの掲載が期待されます。'

  const pressRelease: PressRelease = {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    releaseDate,
    companyName: '',
    title,
    introduction,
    sections: [
      {
        id: generateId(),
        type: 'background',
        title: '背景',
        content: background,
        order: 0,
      },
      {
        id: generateId(),
        type: 'development',
        title: '開発経緯',
        content: development,
        order: 1,
      },
    ],
    additionalImages: [],
    contact: {
      name: '',
      phone: '',
      email: '',
    },
  }

  return {
    id: generateId(),
    angle,
    title,
    introduction,
    background,
    development,
    recommendation,
    expectedMediaReaction,
    preview: pressRelease,
    compatibilityScore: compatibility.score,
    scalePowers: scalePowers as SCALEPower[],
    isCompatible: compatibility.isCompatible,
  }
}

/**
 * アングルに応じたコンテンツを生成
 */
function generateContentForAngle(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>
): {
  title: string
  introduction: string
  background: string
  development: string
  recommendation: string
  expectedMediaReaction: string
} {
  const productName = input.productServiceName
  const features = input.features.join('、')

  switch (angle) {
    case 'social-issue':
      return {
        title: `${productName}が社会課題の解決に貢献`,
        introduction: `${productName}は、現代社会が直面する課題を解決するために開発されました。${input.description}`,
        background: `現在、${input.industry || '社会'}では様々な課題が存在しています。${input.description}を通じて、これらの課題に取り組んでいます。`,
        development: `開発の背景には、${input.targetCustomers || 'ユーザー'}のニーズがあります。${features}などの特徴を備えています。`,
        recommendation: '社会課題解決型のアングルは、メディアの関心が高く、社会的意義を強調することで多くのメディアに取り上げられる可能性があります。',
        expectedMediaReaction: '社会課題に取り組む姿勢が評価され、テレビ、新聞、Webメディアなど幅広いメディアでの掲載が期待されます。',
      }

    case 'trend-aligned':
      return {
        title: `${productName}が${analysis.trends[0]}のトレンドに対応`,
        introduction: `${productName}は、現在注目されている${analysis.trends[0]}のトレンドに対応したサービスです。${input.description}`,
        background: `現在の市場では、${analysis.trends.join('、')}などのトレンドが注目されています。`,
        development: `${productName}は、これらのトレンドを踏まえて開発されました。${features}などの特徴があります。`,
        recommendation: 'トレンド連動型のアングルは、時事性が高く、最新のニュースと関連付けることでメディアの関心を引くことができます。',
        expectedMediaReaction: 'トレンドに敏感なWebメディアや業界誌での掲載が期待されます。',
      }

    case 'seasonal':
      return {
        title: `${productName}が${getSeasonalContext()}に最適`,
        introduction: `${productName}は、${getSeasonalContext()}に最適なサービスです。${input.description}`,
        background: `${getSeasonalContext()}は、${input.industry || '市場'}にとって重要な時期です。`,
        development: `この時期に合わせて、${productName}を開発しました。${features}などの特徴を備えています。`,
        recommendation: '季節性を活用することで、タイムリーなニュースとして取り上げられやすくなります。',
        expectedMediaReaction: '季節に合わせたニュースとして、多くのメディアで取り上げられる可能性があります。',
      }

    case 'unique-story':
      return {
        title: `${productName}の独自性とストーリー性`,
        introduction: `${productName}は、独自のアプローチで${input.description}を実現します。`,
        background: `従来の${input.industry || 'サービス'}とは異なるアプローチを採用しています。`,
        development: `開発の過程で、${features}などの独自の特徴を実現しました。`,
        recommendation: 'ユニークなストーリー性は、メディアの関心を引く重要な要素です。',
        expectedMediaReaction: '独自性が評価され、専門メディアや業界誌での詳細な紹介が期待されます。',
      }

    case 'industry-innovative':
      return {
        title: `${productName}が${input.industry || '業界'}に革新をもたらす`,
        introduction: `${productName}は、${input.industry || '業界'}に革新をもたらすサービスです。${input.description}`,
        background: `${input.industry || '業界'}では、従来のアプローチからの変革が求められています。`,
        development: `${productName}は、${features}などの革新的な特徴により、業界の常識を変えます。`,
        recommendation: '業界革新型のアングルは、業界関係者や専門メディアの関心が高く、詳細な紹介が期待されます。',
        expectedMediaReaction: '業界誌や専門メディアでの詳細な紹介、そして業界関係者からの注目が期待されます。',
      }

    default:
      return {
        title: `${productName}をリリース`,
        introduction: `${productName}をリリースいたします。${input.description}`,
        background: `${input.description}`,
        development: `${features}などの特徴があります。`,
        recommendation: '標準的なアプローチです。',
        expectedMediaReaction: '一般的なメディアでの紹介が期待されます。',
      }
  }
}

/**
 * 季節のコンテキストを取得
 */
function getSeasonalContext(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return '春の時期'
  if (month >= 6 && month <= 8) return '夏の時期'
  if (month >= 9 && month <= 11) return '秋の時期'
  return '冬の時期'
}

