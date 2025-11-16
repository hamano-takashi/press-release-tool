import { NextRequest, NextResponse } from 'next/server'
import { PressRelease, AIType } from '@/types'
import { generateWithAI } from '@/lib/ai-client'
import { toAppError, getUserFriendlyMessage, logError } from '@/lib/error-handler'

/**
 * AI補助機能API
 * タイトルや本文の作成をAIで補助する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, pressRelease, selectedAI } = body as {
      type: 'title' | 'introduction' | 'section'
      pressRelease: PressRelease
      selectedAI?: AIType
      sectionContent?: string // セクション作成の場合の既存内容
    }

    if (!pressRelease) {
      return NextResponse.json(
        {
          success: false,
          error: 'プレスリリース情報が必要です',
        },
        { status: 400 }
      )
    }

    // 選択されたAIタイプを取得（デフォルトは'auto'）
    const aiType: AIType = selectedAI || 'auto'

    let prompt: { system: string; user: string }
    let result: string

    switch (type) {
      case 'title':
        prompt = createTitlePrompt(pressRelease)
        break
      case 'introduction':
        prompt = createIntroductionPrompt(pressRelease)
        break
      case 'section':
        prompt = createSectionPrompt(pressRelease, body.sectionContent || '')
        break
      default:
        return NextResponse.json(
          {
            success: false,
            error: '無効なタイプです',
          },
          { status: 400 }
        )
    }

    // AI APIが利用可能な場合はAIを使用
    const hasAIApi =
      process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY

    if (hasAIApi) {
      try {
        const aiResponse = await generateWithAI(prompt, aiType)
        result = aiResponse.content.trim()
      } catch (aiError) {
        console.warn('AI generation failed:', aiError)
        // AI生成に失敗した場合はテンプレートベースで生成
        result = generateTemplateBased(type, pressRelease, body.sectionContent)
      }
    } else {
      // AI APIが利用できない場合はテンプレートベースで生成
      result = generateTemplateBased(type, pressRelease, body.sectionContent)
    }

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('AI assist error:', error)
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
 * タイトル生成用のプロンプトを作成
 */
function createTitlePrompt(pressRelease: PressRelease): { system: string; user: string } {
  const systemPrompt = `あなたはプロのプレスリリースライターです。
ユーザーが提供するプレスリリースの情報を基に、メディアに取り上げられやすい魅力的なタイトルを生成してください。

以下の要件を守ってください：
- 日本語で自然で読みやすいタイトルを作成
- メディアの関心を引く構成にする
- 簡潔で分かりやすい表現を使用（30文字以内を推奨）
- 既存のタイトルや内容を参考にするが、より魅力的な表現を心がける`

  const userPrompt = `以下のプレスリリース情報を基に、魅力的なタイトルを1つ生成してください：

【会社名】${pressRelease.companyName || '未指定'}
【既存のタイトル】${pressRelease.title || 'なし'}
【導入文】${pressRelease.introduction || 'なし'}
【セクション情報】
${pressRelease.sections
  .map((s) => `- ${s.title}: ${s.content.substring(0, 100)}`)
  .join('\n') || 'なし'}

タイトルのみを返してください。説明や補足は不要です。`

  return { system: systemPrompt, user: userPrompt }
}

/**
 * 導入文生成用のプロンプトを作成
 */
function createIntroductionPrompt(pressRelease: PressRelease): { system: string; user: string } {
  const systemPrompt = `あなたはプロのプレスリリースライターです。
ユーザーが提供するプレスリリースの情報を基に、メディアに取り上げられやすい魅力的な導入文を生成してください。

以下の要件を守ってください：
- 日本語で自然で読みやすい文章を作成
- メディアの関心を引く構成にする
- 簡潔で分かりやすい表現を使用（200文字程度）
- 既存の導入文や内容を参考にするが、より魅力的な表現を心がける
- 5W1H（いつ、どこで、誰が、何を、なぜ、どのように）を意識する`

  const userPrompt = `以下のプレスリリース情報を基に、魅力的な導入文を生成してください：

【会社名】${pressRelease.companyName || '未指定'}
【タイトル】${pressRelease.title || '未指定'}
【リリース日】${pressRelease.releaseDate ? new Date(pressRelease.releaseDate).toLocaleDateString('ja-JP') : '未指定'}
【既存の導入文】${pressRelease.introduction || 'なし'}
【セクション情報】
${pressRelease.sections
  .map((s) => `- ${s.title}: ${s.content.substring(0, 200)}`)
  .join('\n') || 'なし'}

導入文のみを返してください。説明や補足は不要です。`

  return { system: systemPrompt, user: userPrompt }
}

/**
 * セクション生成用のプロンプトを作成
 */
function createSectionPrompt(
  pressRelease: PressRelease,
  sectionContent: string
): { system: string; user: string } {
  const systemPrompt = `あなたはプロのプレスリリースライターです。
ユーザーが提供するプレスリリースの情報を基に、セクションの内容を生成または改善してください。

以下の要件を守ってください：
- 日本語で自然で読みやすい文章を作成
- メディアの関心を引く構成にする
- 簡潔で分かりやすい表現を使用
- 既存のセクション内容を参考にするが、より魅力的な表現を心がける
- プレスリリース全体の一貫性を保つ`

  const userPrompt = `以下のプレスリリース情報を基に、セクションの内容を生成または改善してください：

【会社名】${pressRelease.companyName || '未指定'}
【タイトル】${pressRelease.title || '未指定'}
【導入文】${pressRelease.introduction || 'なし'}
【既存のセクション内容】${sectionContent || 'なし'}
【他のセクション情報】
${pressRelease.sections
  .map((s) => `- ${s.title}: ${s.content.substring(0, 150)}`)
  .join('\n') || 'なし'}

セクションの内容のみを返してください。説明や補足は不要です。`

  return { system: systemPrompt, user: userPrompt }
}

/**
 * テンプレートベースで生成（AI APIが利用できない場合）
 */
function generateTemplateBased(
  type: 'title' | 'introduction' | 'section',
  pressRelease: PressRelease,
  sectionContent?: string
): string {
  switch (type) {
    case 'title':
      if (pressRelease.title) {
        return pressRelease.title
      }
      return pressRelease.companyName
        ? `${pressRelease.companyName}が新サービスをリリース`
        : 'プレスリリース'

    case 'introduction':
      if (pressRelease.introduction) {
        return pressRelease.introduction
      }
      const companyName = pressRelease.companyName || '当社'
      const releaseDate = pressRelease.releaseDate
        ? new Date(pressRelease.releaseDate).toLocaleDateString('ja-JP')
        : '本日'
      return `${companyName}は、${releaseDate}に新サービスをリリースいたします。`

    case 'section':
      return sectionContent || 'セクションの内容を入力してください。'

    default:
      return ''
  }
}

