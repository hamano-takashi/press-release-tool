import { NextRequest, NextResponse } from 'next/server'
import { AIAnalysisInput, AIGeneratedProposal, ProposalAngle, PressRelease } from '@/types'
import { generateId } from '@/lib/utils'
import { toAppError, getUserFriendlyMessage, logError } from '@/lib/error-handler'
import { generateWithAI, createProposalPrompt } from '@/lib/ai-client'

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

    // 複数のアングルでプレスリリース案を生成
    const proposals = await generateProposals(input, analysis)

    return NextResponse.json({
      success: true,
      proposals,
      analysis,
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
 * トレンド分析（モック実装）
 * 実際の実装では、NewsAPIやGoogle News APIなどを使用
 */
async function analyzeTrends(input: AIAnalysisInput) {
  // TODO: 実際のAPI連携を実装
  // 現在はモックデータを返す
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
  }
}

/**
 * 複数のアングルでプレスリリース案を生成
 */
async function generateProposals(
  input: AIAnalysisInput,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>
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
    const proposal = await generateProposalForAngle(input, angle, analysis)
    proposals.push(proposal)
  }

  return proposals
}

/**
 * 特定のアングルでプレスリリース案を生成
 * AI APIが利用可能な場合はAIを使用、そうでない場合はテンプレートベースで生成
 */
async function generateProposalForAngle(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>
): Promise<AIGeneratedProposal> {
  const releaseDate = input.releaseDate
    ? typeof input.releaseDate === 'string'
      ? new Date(input.releaseDate)
      : input.releaseDate
    : new Date()

  // AI APIが利用可能な場合はAIを使用
  const hasAIApi = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY

  if (hasAIApi) {
    try {
      const prompt = createProposalPrompt(input, angle, analysis)
      const aiResponse = await generateWithAI(prompt)

      // AIの応答をパース
      try {
        const aiContent = JSON.parse(aiResponse.content)
        return createProposalFromAIResponse(input, angle, releaseDate, aiContent)
      } catch (parseError) {
        console.warn('AI response parsing failed, using template:', parseError)
        // パースに失敗した場合はテンプレートベースで生成
        return generateProposalFromTemplate(input, angle, analysis, releaseDate)
      }
    } catch (aiError) {
      console.warn('AI generation failed, using template:', aiError)
      // AI生成に失敗した場合はテンプレートベースで生成
      return generateProposalFromTemplate(input, angle, analysis, releaseDate)
    }
  }

  // AI APIが利用できない場合はテンプレートベースで生成
  return generateProposalFromTemplate(input, angle, analysis, releaseDate)
}

/**
 * テンプレートベースでプロポーザルを生成
 */
function generateProposalFromTemplate(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  analysis: Awaited<ReturnType<typeof analyzeTrends>>,
  releaseDate: Date
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
  }
}

/**
 * AIの応答からプロポーザルオブジェクトを作成
 */
function createProposalFromAIResponse(
  input: AIAnalysisInput,
  angle: ProposalAngle,
  releaseDate: Date,
  aiContent: any
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

