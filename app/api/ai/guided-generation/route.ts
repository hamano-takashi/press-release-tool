import { NextRequest, NextResponse } from 'next/server'
import { GuidedCreationAnswers, PressRelease } from '@/types'
import { generateId } from '@/lib/utils'
import { generateWithAI, createPressReleasePrompt } from '@/lib/ai-client'
import { toAppError, getUserFriendlyMessage, logError } from '@/lib/error-handler'

/**
 * ガイド付き作成の回答からプレスリリースを生成するAPI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers, currentStep } = body as {
      answers: GuidedCreationAnswers
      currentStep: number
    }

    // 回答からプレスリリースを生成
    const pressRelease = await generatePressReleaseFromAnswers(answers)

    return NextResponse.json({
      success: true,
      pressRelease,
      nextStep: currentStep + 1,
    })
  } catch (error) {
    console.error('Guided generation error:', error)
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
 * 回答からプレスリリースを生成する関数
 * AI APIが利用可能な場合はAIを使用、そうでない場合はテンプレートベースで生成
 */
async function generatePressReleaseFromAnswers(answers: GuidedCreationAnswers): Promise<PressRelease> {
  // AI APIが利用可能な場合はAIを使用
  const hasAIApi = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
  
  if (hasAIApi) {
    try {
      const prompt = createPressReleasePrompt(answers)
      const aiResponse = await generateWithAI(prompt)
      
      // AIの応答をパース
      try {
        const aiContent = JSON.parse(aiResponse.content)
        return createPressReleaseFromAIResponse(answers, aiContent)
      } catch (parseError) {
        console.warn('AI response parsing failed, using template:', parseError)
        // パースに失敗した場合はテンプレートベースで生成
        return generatePressReleaseFromTemplate(answers)
      }
    } catch (aiError) {
      console.warn('AI generation failed, using template:', aiError)
      // AI生成に失敗した場合はテンプレートベースで生成
      return generatePressReleaseFromTemplate(answers)
    }
  }
  
  // AI APIが利用できない場合はテンプレートベースで生成
  return generatePressReleaseFromTemplate(answers)
}

/**
 * テンプレートベースでプレスリリースを生成
 */
function generatePressReleaseFromTemplate(answers: GuidedCreationAnswers): PressRelease {
  const releaseDate = answers.releaseDate
    ? typeof answers.releaseDate === 'string'
      ? new Date(answers.releaseDate)
      : answers.releaseDate
    : new Date()

  // タイトルを生成
  const title = answers.productServiceName
    ? `${answers.productServiceName}をリリース`
    : 'プレスリリース'

  // 導入文を生成
  const introduction = generateIntroduction(answers)

  // セクションを生成
  const sections = generateSections(answers)

  // プレスリリースオブジェクトを作成
  const pressRelease: PressRelease = {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    releaseDate,
    companyName: answers.companyName,
    title,
    introduction,
    sections,
    logoImage:
      answers.logoImage && typeof answers.logoImage === 'object' && 'url' in answers.logoImage
        ? answers.logoImage
        : undefined,
    mainImage:
      answers.mainImage && typeof answers.mainImage === 'object' && 'url' in answers.mainImage
        ? answers.mainImage
        : undefined,
    additionalImages:
      answers.additionalImages && Array.isArray(answers.additionalImages)
        ? (answers.additionalImages.filter(
            (img) => img && typeof img === 'object' && 'url' in img
          ) as PressRelease['additionalImages'])
        : [],
    contact: {
      name: answers.contactName || '',
      phone: answers.contactPhone || '',
      email: answers.contactEmail || '',
    },
  }

  return pressRelease
}

/**
 * 導入文を生成
 */
function generateIntroduction(answers: GuidedCreationAnswers): string {
  const parts: string[] = []

  if (answers.companyName) {
    parts.push(`${answers.companyName}は`)
  }

  if (answers.productServiceName) {
    parts.push(`${answers.productServiceName}を`)
  }

  if (answers.releaseDate) {
    const date = typeof answers.releaseDate === 'string' ? new Date(answers.releaseDate) : answers.releaseDate
    parts.push(`${date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}にリリースいたします。`)
  } else {
    parts.push('リリースいたします。')
  }

  if (answers.features && answers.features.length > 0) {
    parts.push(`\n\n${answers.productServiceName || '本サービス'}の主な特徴は以下の通りです：`)
    answers.features.forEach((feature, index) => {
      parts.push(`\n${index + 1}. ${feature}`)
    })
  }

  if (answers.targetCustomers) {
    parts.push(`\n\n主なターゲットは${answers.targetCustomers}です。`)
  }

  if (answers.price) {
    parts.push(`価格は${answers.price}です。`)
  }

  if (answers.availability) {
    parts.push(`${answers.availability}でご利用いただけます。`)
  }

  return parts.join('')
}

/**
 * セクションを生成
 */
function generateSections(answers: GuidedCreationAnswers): PressRelease['sections'] {
  const sections: PressRelease['sections'] = []

  // 背景セクション
  if (answers.purpose || answers.background) {
    sections.push({
      id: generateId(),
      type: 'background',
      title: '背景',
      content: [answers.purpose, answers.background].filter(Boolean).join('\n\n'),
      order: sections.length,
    })
  }

  // 開発経緯セクション
  if (answers.background || answers.socialRelevance) {
    sections.push({
      id: generateId(),
      type: 'development',
      title: '開発経緯',
      content: [answers.background, answers.socialRelevance].filter(Boolean).join('\n\n'),
      order: sections.length,
    })
  }

  return sections
}

/**
 * AIの応答からプレスリリースオブジェクトを作成
 */
function createPressReleaseFromAIResponse(
  answers: GuidedCreationAnswers,
  aiContent: any
): PressRelease {
  const releaseDate = answers.releaseDate
    ? typeof answers.releaseDate === 'string'
      ? new Date(answers.releaseDate)
      : answers.releaseDate
    : new Date()

  const sections = (aiContent.sections || []).map((section: any, index: number) => ({
    id: generateId(),
    type: section.type || 'custom',
    title: section.title || 'セクション',
    content: section.content || '',
    order: index,
  }))

  return {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    releaseDate,
    companyName: answers.companyName,
    title: aiContent.title || answers.productServiceName || 'プレスリリース',
    introduction: aiContent.introduction || '',
    sections,
    logoImage:
      answers.logoImage && typeof answers.logoImage === 'object' && 'url' in answers.logoImage
        ? answers.logoImage
        : undefined,
    mainImage:
      answers.mainImage && typeof answers.mainImage === 'object' && 'url' in answers.mainImage
        ? answers.mainImage
        : undefined,
    additionalImages:
      answers.additionalImages && Array.isArray(answers.additionalImages)
        ? (answers.additionalImages.filter(
            (img) => img && typeof img === 'object' && 'url' in img
          ) as PressRelease['additionalImages'])
        : [],
    contact: {
      name: answers.contactName || '',
      phone: answers.contactPhone || '',
      email: answers.contactEmail || '',
    },
  }
}

