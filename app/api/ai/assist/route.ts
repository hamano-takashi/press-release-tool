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
    // 環境変数のデバッグログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('環境変数の確認:', {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasClaude: !!process.env.ANTHROPIC_API_KEY,
        hasGemini: !!process.env.GEMINI_API_KEY,
        geminiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) || '未設定',
      })
    }
    
    let body
    try {
      body = await request.json()
      console.log('AI assist API called:', { type: body.type, selectedAI: body.selectedAI })
    } catch (parseError) {
      console.error('リクエストボディのパースエラー:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'リクエストボディの解析に失敗しました',
        },
        { status: 400 }
      )
    }
    
    const { type, pressRelease, selectedAI } = body as {
      type: 'title' | 'introduction' | 'section'
      pressRelease: PressRelease
      selectedAI?: AIType
      sectionContent?: string // セクション作成の場合の既存内容
    }

    if (!pressRelease) {
      console.error('プレスリリース情報がありません')
      return NextResponse.json(
        {
          success: false,
          error: 'プレスリリース情報が必要です',
        },
        { status: 400 }
      )
    }

    if (!type) {
      console.error('タイプが指定されていません')
      return NextResponse.json(
        {
          success: false,
          error: 'タイプ（title/introduction/section）を指定してください',
        },
        { status: 400 }
      )
    }

    // 選択されたAIタイプを取得（デフォルトは'auto'）
    const aiType: AIType = selectedAI || 'auto'
    console.log('使用するAIタイプ:', aiType)

    let prompt: { system: string; user: string }
    let result: string | { proposals: Array<{ title: string; approach: string }> }

    try {
      switch (type) {
        case 'title':
          // タイトルの場合は複数案を生成
          prompt = createTitleProposalsPrompt(pressRelease)
          break
        case 'introduction':
          prompt = createIntroductionPrompt(pressRelease)
          break
        case 'section':
          prompt = createSectionPrompt(pressRelease, body.sectionContent || '')
          break
        default:
          console.error('無効なタイプ:', type)
          return NextResponse.json(
            {
              success: false,
              error: `無効なタイプです: ${type}`,
            },
            { status: 400 }
          )
      }
    } catch (promptError) {
      console.error('プロンプト作成エラー:', promptError)
      return NextResponse.json(
        {
          success: false,
          error: 'プロンプトの作成に失敗しました',
        },
        { status: 500 }
      )
    }

    // AI APIが利用可能な場合はAIを使用
    // 環境変数を明示的にtrimして、余分なスペースを削除
    const openaiKey = process.env.OPENAI_API_KEY?.trim()
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim()
    const geminiKey = process.env.GEMINI_API_KEY?.trim()
    
    const hasAIApi = !!(openaiKey || anthropicKey || geminiKey)

    console.log('AI API利用可能性:', {
      hasAIApi,
      hasOpenAI: !!openaiKey,
      hasClaude: !!anthropicKey,
      hasGemini: !!geminiKey,
      geminiKeyLength: geminiKey?.length || 0,
      geminiKeyPrefix: geminiKey?.substring(0, 10) || '未設定',
    })
    
    // 環境変数が読み込まれていない場合の警告
    if (!hasAIApi && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ AI APIキーが読み込まれていません。')
      console.warn('確認事項:')
      console.warn('1. .env.localファイルがプロジェクトルートに存在するか')
      console.warn('2. 環境変数名が正しいか（GEMINI_API_KEY等）')
      console.warn('3. 開発サーバーを再起動したか（npm run dev）')
      console.warn('4. .env.localファイルに余分なスペースや引用符がないか')
    }

    if (hasAIApi) {
      try {
        console.log('AI生成を開始します...')
        const aiResponse = await generateWithAI(prompt, aiType)
        const responseContent = aiResponse.content.trim()
        console.log('AI生成成功（最初）:', responseContent.substring(0, 200))
        
        // タイトルの場合は複数案をパース
        if (type === 'title') {
          try {
            // JSON形式で返されることを期待
            // まず、マークダウンコードブロック内のJSONを抽出
            let jsonString = responseContent.trim()
            
            // ```json または ``` で囲まれている場合を処理
            const jsonBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/)
            if (jsonBlockMatch) {
              jsonString = jsonBlockMatch[1].trim()
            }
            
            // 最初の { から最後の } までを抽出（マークダウンコードブロックがない場合）
            if (!jsonString.startsWith('{')) {
              const firstBrace = jsonString.indexOf('{')
              const lastBrace = jsonString.lastIndexOf('}')
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonString = jsonString.substring(firstBrace, lastBrace + 1)
              }
            }
            
            const parsed = JSON.parse(jsonString)
            if (parsed.proposals && Array.isArray(parsed.proposals)) {
              result = { proposals: parsed.proposals }
              console.log(`タイトル案を${parsed.proposals.length}件生成しました`)
            } else {
              // proposalsがない場合は、単一のタイトルとして扱う
              // または、タイトルフィールドがある場合はそれを使用
              if (parsed.title && typeof parsed.title === 'string') {
                result = { proposals: [{ title: parsed.title, approach: 'AI生成' }] }
                console.log('タイトル生成完了（単一案をproposals形式に変換）:', parsed.title)
              } else {
                // JSON形式でない場合は、単一のタイトルとして扱う
                result = responseContent
                console.log('タイトル生成完了（単一案）:', result)
              }
            }
          } catch (parseError) {
            // JSONパースに失敗した場合は、応答を解析してタイトル案を抽出
            console.warn('JSONパースエラー、応答からタイトル案を抽出します:', parseError)
            console.log('AIレスポンス:', responseContent.substring(0, 500))
            
            // 応答からタイトルらしき部分を抽出
            const lines = responseContent.split('\n').filter(line => line.trim().length > 0)
            const extractedTitles: Array<{ title: string; approach: string }> = []
            
            // 番号付きリストや箇条書きからタイトルを抽出
            for (const line of lines) {
              const trimmed = line.trim()
              // 「1. タイトル」や「- タイトル」などの形式を抽出
              const match = trimmed.match(/^[\d\-・•]\s*(.+)$/)
              if (match && match[1].length > 5 && match[1].length < 200) {
                extractedTitles.push({
                  title: match[1].trim(),
                  approach: '抽出されたタイトル'
                })
              } else if (trimmed.length > 5 && trimmed.length < 200 && !trimmed.startsWith('【') && !trimmed.includes('：')) {
                // 説明文でない可能性のある行をタイトル候補として追加
                extractedTitles.push({
                  title: trimmed,
                  approach: '抽出されたタイトル'
                })
              }
            }
            
            if (extractedTitles.length > 0) {
              // 最大5個まで
              result = { proposals: extractedTitles.slice(0, 5) }
              console.log(`応答から${extractedTitles.length}件のタイトル案を抽出しました`)
            } else {
              // 抽出できなかった場合は、応答全体を1つのタイトル案として扱う
              const cleanTitle = responseContent.replace(/```[\s\S]*?```/g, '').trim().split('\n')[0].trim()
              if (cleanTitle.length > 0 && cleanTitle.length < 200) {
                result = { proposals: [{ title: cleanTitle, approach: 'AI生成' }] }
                console.log('応答全体をタイトル案として使用:', cleanTitle)
              } else {
                // それでもダメな場合はエラー
                throw new Error('タイトル案の生成に失敗しました。AIがJSON形式で返していない可能性があります。')
              }
            }
          }
        } else {
          result = responseContent
          console.log('AI生成文字数:', result.length)
        }
      } catch (aiError) {
        console.error('AI generation failed:', aiError)
        const errorMessage = aiError instanceof Error ? aiError.message : 'AI生成に失敗しました'
        const errorStack = aiError instanceof Error ? aiError.stack : undefined
        
        // 詳細なエラー情報をログに記録
        console.error('AI生成エラー詳細:', {
          message: errorMessage,
          stack: errorStack,
          type,
          selectedAI: aiType,
          hasOpenAI: !!openaiKey,
          hasClaude: !!anthropicKey,
          hasGemini: !!geminiKey,
        })
        
        // AI生成に失敗した場合はテンプレートベースで生成
        console.log('テンプレートベースで生成します')
        // タイトルの場合は複数案を生成できないため、エラーを返す
        if (type === 'title') {
          // Gemini APIのエラーの場合は、より詳細なメッセージを返す
          if (errorMessage.includes('Gemini') || errorMessage.includes('APIキー') || errorMessage.includes('API key')) {
            throw new Error(`Gemini APIエラー: ${errorMessage}`)
          }
          throw new Error(`タイトル案の生成に失敗しました: ${errorMessage}`)
        }
        result = generateTemplateBased(type, pressRelease, body.sectionContent)
        
        // エラー情報をログに記録（ただし、テンプレートベースで生成は成功として扱う）
        console.warn('AI生成失敗、テンプレートベースで生成:', errorMessage)
      }
    } else {
      // AI APIが利用できない場合はエラーを返す（タイトルの場合）
      if (type === 'title') {
        // 環境変数の状態を確認
        const envStatus = {
          openai: !!openaiKey,
          claude: !!anthropicKey,
          gemini: !!geminiKey,
        }
        
        // 開発環境では詳細な情報を提供
        const debugInfo = process.env.NODE_ENV === 'development' 
          ? `\n\nデバッグ情報:\n- OPENAI_API_KEY: ${envStatus.openai ? '設定済み' : '未設定'}\n- ANTHROPIC_API_KEY: ${envStatus.claude ? '設定済み' : '未設定'}\n- GEMINI_API_KEY: ${envStatus.gemini ? '設定済み（' + (geminiKey?.substring(0, 10) || '') + '...）' : '未設定'}\n\n解決方法:\n1. .env.localファイルがプロジェクトルート（press-release-tool/）にあるか確認\n2. 環境変数名が正しいか確認（GEMINI_API_KEY=...）\n3. 開発サーバーを再起動: npm run dev\n4. .env.localファイルに余分なスペースや引用符がないか確認`
          : ''
        
        return NextResponse.json(
          {
            success: false,
            error: `タイトル案の生成にはAI APIキーの設定が必要です。OPENAI_API_KEY、ANTHROPIC_API_KEY、またはGEMINI_API_KEYのいずれかを設定してください。${debugInfo}`,
          },
          { status: 400 }
        )
      }
      // タイトル以外の場合はテンプレートベースで生成
      console.log('AI APIキーが設定されていないため、テンプレートベースで生成します')
      result = generateTemplateBased(type, pressRelease, body.sectionContent)
    }

    // タイトルの場合の結果チェック
    if (type === 'title') {
      if (typeof result === 'object' && 'proposals' in result) {
        if (!result.proposals || result.proposals.length === 0) {
          console.error('タイトル案が空です:', result)
          return NextResponse.json(
            {
              success: false,
              error: 'タイトル案の生成に失敗しました',
            },
            { status: 500 }
          )
        }
        console.log('AI補助機能成功（タイトル案）:', { type, proposalsCount: result.proposals.length })
        return NextResponse.json({
          success: true,
          proposals: result.proposals,
        })
      } else if (typeof result === 'string') {
        if (!result || result.trim().length === 0) {
          console.error('タイトルが空です:', result)
          return NextResponse.json(
            {
              success: false,
              error: 'タイトルの生成に失敗しました',
            },
            { status: 500 }
          )
        }
        console.log('AI補助機能成功（タイトル単一案）:', { type, result })
        return NextResponse.json({
          success: true,
          result: result.trim(),
        })
      }
    }

    // タイトル以外の場合
    if (!result || (typeof result === 'string' && result.trim().length === 0)) {
      console.error('結果が空です:', { type, result })
      return NextResponse.json(
        {
          success: false,
          error: '生成結果が空です',
        },
        { status: 500 }
      )
    }

    console.log('AI補助機能成功:', { type, resultLength: typeof result === 'string' ? result.length : 'N/A' })
    return NextResponse.json({
      success: true,
      result: typeof result === 'string' ? result.trim() : result,
    })
  } catch (error) {
    console.error('AI assist error:', error)
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : { error }
    console.error('エラー詳細:', errorDetails)
    
    const appError = toAppError(error)
    logError(appError)

    // 開発環境では詳細なエラーメッセージを返す
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `${getUserFriendlyMessage(appError)}\n\n詳細: ${error instanceof Error ? error.message : String(error)}`
      : getUserFriendlyMessage(appError)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * タイトル案生成用のプロンプトを作成（複数案）
 */
function createTitleProposalsPrompt(pressRelease: PressRelease): { system: string; user: string } {
  const systemPrompt = `あなたは優秀なプロの広報・PRプランナーで、メディアに頻繁に取り上げられるプレスリリースを作成する専門家です。
ユーザーが提供する情報を「素材」として受け取り、その本質を理解して、プレスリリースとして効果的なタイトル案を複数生成してください。

【重要な原則】
**ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を汲み取って、プレスリリースとして効果的な表現に変換してください。**

【あなたの役割】
- ユーザーの入力情報を「素材」として受け取り、その本質的な価値やニュース性を抽出する
- 抽出した本質を基に、異なる視点・アプローチから複数のタイトル案を創造する
- ユーザーの表現をそのまま使うのではなく、プレスリリースとして適切な表現に変換・再構成する
- メディアや読者の関心を強く引く、プロフェッショナルなタイトル案を作成する

【情報処理のプロセス】
1. **情報の抽出**: ユーザーの入力情報から、本質的な価値、ニュース性、社会的意義を抽出する
2. **複数の視点で再構成**: 抽出した情報を、異なる視点・アプローチからプレスリリースとして効果的な表現に再構成する
3. **表現の最適化**: メディアに取り上げられやすい形式に仕上げる

【タイトル案の目標】
1. **本質の抽出**: ユーザーの入力情報から本質的な価値やニュース性を見出す
2. **多様な視点**: 異なる視点・アプローチから複数のタイトル案を生成する
3. **効果的な表現**: プレスリリースとして効果的で、メディアに取り上げられやすい表現にする
4. **自然さ**: 日本語として自然で読みやすい表現を使用する
5. **明確性**: 何についてのニュースかが明確に伝わる
6. **魅力**: 読者が「これは知りたい」と思う要素を含める

【タイトル案作成の方針】
- ユーザーの入力情報を「素材」として受け取り、その本質を理解する
- 本質を基に、異なる視点・アプローチから複数のタイトル案を創造する
- ユーザーの表現をそのまま使うのではなく、メディアに取り上げられやすい形式に仕上げる
- 自然な日本語で、読みやすく理解しやすい表現を心がける
- 長さは内容に応じて柔軟に対応（短くても長くても、自然で効果的であれば良い）
- プロフェッショナルなプレスリリースとして完成度の高いタイトル案を作成する

【生成する視点の例】
- 健康・トレンド視点: 健康志向やトレンドに対応した視点
- ニュース性・独自性視点: 業界初、新商品などのニュース性を強調
- 社会課題・価値提案視点: 社会課題の解決や価値提案を強調
- 具体的な価値提示視点: 具体的な数値や事実を含めた視点
- ストーリー性視点: ストーリー性や背景を強調した視点`

  const sectionsInfo = pressRelease.sections.length > 0
    ? pressRelease.sections.map((s) => `- ${s.title}: ${s.content.substring(0, 200)}`).join('\n')
    : 'なし'

  const userPrompt = `以下のプレスリリース情報を基に、優秀なプロの広報・PRプランナーとして、情報の本質を汲み取って、異なる視点・アプローチからプレスリリースとして効果的なタイトル案を3-5個生成してください。

【最重要】ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を理解して、プレスリリースとして効果的な表現に変換してください。ユーザーの表現は「素材」として受け取り、その本質を抽出して、メディアに取り上げられやすい形式に仕上げてください。

【基本情報】
会社名: ${pressRelease.companyName || '未指定'}
リリース日: ${pressRelease.releaseDate ? new Date(pressRelease.releaseDate).toLocaleDateString('ja-JP') : '未指定'}

【タイトル関連（参考情報）】
既存のタイトル: ${pressRelease.title || 'なし'}
サブタイトル: ${pressRelease.subtitle || 'なし'}
スローガン・キャッチコピー: ${pressRelease.slogan || 'なし'}

【本文内容】
導入文: ${pressRelease.introduction || 'なし'}

【セクション情報】
${sectionsInfo}

【生成プロセス】
1. **情報の本質を抽出**: ユーザーの入力情報（会社名、導入文、セクション情報など）から、本質的な価値、ニュース性、社会的意義を抽出してください
2. **複数の視点で再構成**: 抽出した本質を基に、異なる視点・アプローチからプレスリリースとして効果的な表現に変換・再構成してください
3. **メディア視点で最適化**: メディアに取り上げられやすい形式に仕上げてください

【生成方針】
- **情報の本質を理解**: ユーザーの表現をそのまま使うのではなく、その背後にある本質的な価値やニュース性を理解してください
- **多様な視点**: 異なる視点・アプローチから複数のタイトル案を生成してください（例：健康・トレンド視点、ニュース性視点、社会課題視点、具体的価値視点、ストーリー性視点など）
- **効果的な表現に変換**: 理解した本質を、プレスリリースとして効果的な表現に変換してください
- **メディア視点**: メディアが「これは記事にしたい」と思うような要素を含めてください
- **自然な日本語**: 自然な日本語で、読みやすく理解しやすいタイトルを作成してください
- **価値の明確化**: ニュース性や価値を明確に伝える表現を使用してください
- **具体性**: 具体的な数値や事実を含めると効果的です（可能な場合）
- **柔軟性**: 長さは内容に応じて柔軟に対応してください（自然で効果的であれば、短くても長くても良い）

【出力形式】
以下のJSON形式で返してください：
{
  "proposals": [
    {
      "title": "タイトル案1",
      "approach": "このタイトル案の視点・アプローチを簡潔に説明（例：健康・トレンド視点、ニュース性・独自性視点など）"
    },
    {
      "title": "タイトル案2",
      "approach": "このタイトル案の視点・アプローチを簡潔に説明"
    },
    ...
  ]
}

必ず3-5個のタイトル案を生成し、それぞれ異なる視点・アプローチから作成してください。`

  return { system: systemPrompt, user: userPrompt }
}

/**
 * タイトル生成用のプロンプトを作成（単一案、後方互換性のため残す）
 */
function createTitlePrompt(pressRelease: PressRelease): { system: string; user: string } {
  const systemPrompt = `あなたは優秀なプロの広報・PRプランナーで、メディアに頻繁に取り上げられるプレスリリースを作成する専門家です。
ユーザーが提供する情報を「素材」として受け取り、その本質を理解して、プレスリリースとして効果的なタイトルに仕上げてください。

【重要な原則】
**ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を汲み取って、プレスリリースとして効果的な表現に変換してください。**

【あなたの役割】
- ユーザーの入力情報を「素材」として受け取り、その本質的な価値やニュース性を抽出する
- 抽出した本質を基に、メディアに取り上げられやすい効果的なタイトルを創造する
- ユーザーの表現をそのまま使うのではなく、プレスリリースとして適切な表現に変換・再構成する
- メディアや読者の関心を強く引く、プロフェッショナルなタイトルを作成する

【情報処理のプロセス】
1. **情報の抽出**: ユーザーの入力情報から、本質的な価値、ニュース性、社会的意義を抽出する
2. **価値の再構成**: 抽出した情報を、プレスリリースとして効果的な表現に再構成する
3. **表現の最適化**: メディアに取り上げられやすい形式に仕上げる

【タイトルの目標】
1. **本質の抽出**: ユーザーの入力情報から本質的な価値やニュース性を見出す
2. **効果的な表現**: プレスリリースとして効果的で、メディアに取り上げられやすい表現にする
3. **自然さ**: 日本語として自然で読みやすい表現を使用する
4. **明確性**: 何についてのニュースかが明確に伝わる
5. **魅力**: 読者が「これは知りたい」と思う要素を含める

【効果的なタイトルの特徴】
- ユーザーの表現をそのまま使うのではなく、プレスリリースとして適切な表現に変換する
- 具体的な数値や事実を含める（可能な場合）
- 社会への影響や貢献を示す（適切な場合）
- 読者の関心に響く表現を使用する
- 商品やサービスの本質的な価値を表現する
- メディアが「これは記事にしたい」と思うような要素を含める

【タイトル作成の方針】
- ユーザーの入力情報を「素材」として受け取り、その本質を理解する
- 本質を基に、プレスリリースとして効果的な表現に変換・再構成する
- ユーザーの表現をそのまま使うのではなく、メディアに取り上げられやすい形式に仕上げる
- 自然な日本語で、読みやすく理解しやすい表現を心がける
- 長さは内容に応じて柔軟に対応（短くても長くても、自然で効果的であれば良い）
- プロフェッショナルなプレスリリースとして完成度の高いタイトルを作成する`

  const sectionsInfo = pressRelease.sections.length > 0
    ? pressRelease.sections.map((s) => `- ${s.title}: ${s.content.substring(0, 200)}`).join('\n')
    : 'なし'

  const userPrompt = `以下のプレスリリース情報を基に、優秀なプロの広報・PRプランナーとして、情報の本質を汲み取って、プレスリリースとして効果的なタイトルを1つ生成してください。

【最重要】ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を理解して、プレスリリースとして効果的な表現に変換してください。ユーザーの表現は「素材」として受け取り、その本質を抽出して、メディアに取り上げられやすい形式に仕上げてください。

【基本情報】
会社名: ${pressRelease.companyName || '未指定'}
リリース日: ${pressRelease.releaseDate ? new Date(pressRelease.releaseDate).toLocaleDateString('ja-JP') : '未指定'}

【タイトル関連（参考情報）】
既存のタイトル: ${pressRelease.title || 'なし'}
サブタイトル: ${pressRelease.subtitle || 'なし'}
スローガン・キャッチコピー: ${pressRelease.slogan || 'なし'}

【本文内容】
導入文: ${pressRelease.introduction || 'なし'}

【セクション情報】
${sectionsInfo}

【生成プロセス】
1. **情報の本質を抽出**: ユーザーの入力情報（会社名、導入文、セクション情報など）から、本質的な価値、ニュース性、社会的意義を抽出してください
2. **プレスリリースとして再構成**: 抽出した本質を基に、プレスリリースとして効果的な表現に変換・再構成してください
3. **メディア視点で最適化**: メディアに取り上げられやすい形式に仕上げてください

【生成方針】
- **情報の本質を理解**: ユーザーの表現をそのまま使うのではなく、その背後にある本質的な価値やニュース性を理解してください
- **効果的な表現に変換**: 理解した本質を、プレスリリースとして効果的な表現に変換してください
- **メディア視点**: メディアが「これは記事にしたい」と思うような要素を含めてください
- **自然な日本語**: 自然な日本語で、読みやすく理解しやすいタイトルを作成してください
- **価値の明確化**: ニュース性や価値を明確に伝える表現を使用してください
- **具体性**: 具体的な数値や事実を含めると効果的です（可能な場合）
- **柔軟性**: 長さは内容に応じて柔軟に対応してください（自然で効果的であれば、短くても長くても良い）

タイトルのみを返してください。説明や補足は不要です。`

  return { system: systemPrompt, user: userPrompt }
}

/**
 * 導入文生成用のプロンプトを作成
 */
function createIntroductionPrompt(pressRelease: PressRelease): { system: string; user: string } {
  const systemPrompt = `あなたは優秀なプロの広報・PRプランナーで、メディアに頻繁に取り上げられるプレスリリースを作成する専門家です。
ユーザーが提供する情報を「素材」として受け取り、その本質を理解して、プレスリリースとして効果的な導入文（リード文）に仕上げてください。

【重要な原則】
**ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を汲み取って、プレスリリースとして効果的な表現に変換してください。**

【あなたの役割】
- ユーザーの入力情報を「素材」として受け取り、その本質的な価値やニュース性を抽出する
- 抽出した本質を基に、メディアに取り上げられやすい効果的な導入文を創造する
- ユーザーの表現をそのまま使うのではなく、プレスリリースとして適切な表現に変換・再構成する
- メディアや読者の関心を強く引く、プロフェッショナルな導入文を作成する

【情報処理のプロセス】
1. **情報の抽出**: ユーザーの入力情報から、本質的な価値、ニュース性、社会的意義を抽出する
2. **価値の再構成**: 抽出した情報を、プレスリリースとして効果的な表現に再構成する
3. **表現の最適化**: メディアに取り上げられやすい形式に仕上げる

【導入文の目標】
1. **本質の抽出**: ユーザーの入力情報から本質的な価値やニュース性を見出す
2. **効果的な表現**: プレスリリースとして効果的で、メディアに取り上げられやすい表現にする
3. **自然さ**: 日本語として自然で読みやすい文章を作成する
4. **魅力**: 最初の1-2文で読者の関心を強く引きつける
5. **明確性**: いつ、どこで、誰が、何を、なぜ、どのようにを明確に示す
6. **流れ**: タイトル→導入文→本文へと自然に流れる構成にする

【導入文作成の方針】
- ユーザーの入力情報を「素材」として受け取り、その本質を理解する
- 本質を基に、プレスリリースとして効果的な表現に変換・再構成する
- ユーザーの表現をそのまま使うのではなく、メディアに取り上げられやすい形式に仕上げる
- 自然な日本語で、読みやすく理解しやすい文章を心がける
- 最初の文で最も重要なニュースや価値を提示する
- 具体的な数値や事実を含めると効果的です（可能な場合）
- 読者が「これは知りたい」と思う要素を含める
- **充実した内容**: 簡潔すぎる文章（2、3行で終わるような手抜き文章）は絶対に避け、必要な情報を十分に含めた充実した導入文を作成してください。内容に応じて適切な長さで、読者に価値を十分に伝える文章にしてください。プロフェッショナルなプレスリリースとして完成度の高い導入文を作成してください
- タイトルと連動し、自然に本文へと流れる構成にする
- 5W1H（いつ、どこで、誰が、何を、なぜ、どのように）を明確に含める
- 背景や意義、社会への影響なども含めて、読者に価値を伝える`

  const sectionsInfo = pressRelease.sections.length > 0
    ? pressRelease.sections.map((s) => `- ${s.title}: ${s.content.substring(0, 300)}`).join('\n')
    : 'なし'

  const userPrompt = `以下のプレスリリース情報を基に、優秀なプロの広報・PRプランナーとして、情報の本質を汲み取って、プレスリリースとして効果的な導入文を生成してください。

【最重要】ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を理解して、プレスリリースとして効果的な表現に変換してください。ユーザーの表現は「素材」として受け取り、その本質を抽出して、メディアに取り上げられやすい形式に仕上げてください。

【基本情報】
会社名: ${pressRelease.companyName || '未指定'}
リリース日: ${pressRelease.releaseDate ? new Date(pressRelease.releaseDate).toLocaleDateString('ja-JP') : '未指定'}

【タイトル関連】
タイトル: ${pressRelease.title || '未指定'}
サブタイトル: ${pressRelease.subtitle || 'なし'}
スローガン・キャッチコピー: ${pressRelease.slogan || 'なし'}

【既存の導入文（参考情報）】
${pressRelease.introduction || 'なし'}

【セクション情報】
${sectionsInfo}

【生成プロセス】
1. **情報の本質を抽出**: ユーザーの入力情報（会社名、タイトル、セクション情報など）から、本質的な価値、ニュース性、社会的意義を抽出してください
2. **プレスリリースとして再構成**: 抽出した本質を基に、プレスリリースとして効果的な表現に変換・再構成してください
3. **メディア視点で最適化**: メディアに取り上げられやすい形式に仕上げてください

【生成方針】
- **情報の本質を理解**: ユーザーの表現をそのまま使うのではなく、その背後にある本質的な価値やニュース性を理解してください
- **効果的な表現に変換**: 理解した本質を、プレスリリースとして効果的な表現に変換してください
- **メディア視点**: メディアが「これは記事にしたい」と思うような要素を含めてください
- **自然な日本語**: 自然な日本語で、読みやすく理解しやすい文章を作成してください
- **価値の提示**: 最初の1-2文で最も重要なニュースや価値を明確に提示してください
- **明確性**: いつ、どこで、誰が、何を、なぜ、どのようにを明確に含めてください
- **具体性**: 具体的な数値や事実を含めると効果的です（可能な場合）
- **詳細性**: 背景、意義、社会への影響、期待される効果なども含めて、読者に価値を十分に伝える充実した内容にしてください
- **充実した内容**: 簡潔すぎる文章（2、3行で終わるような手抜き文章）は絶対に避け、必要な情報を十分に含めた充実した導入文を作成してください。内容に応じて適切な長さで、読者に価値を十分に伝える文章にしてください。プロフェッショナルなプレスリリースとして完成度の高い導入文を作成してください
- **流れ**: タイトルと連動し、自然に本文へと流れる構成にしてください

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
  const systemPrompt = `あなたは優秀なプロの広報・PRプランナーで、メディアに頻繁に取り上げられるプレスリリースを作成する専門家です。
ユーザーが提供する情報を「素材」として受け取り、その本質を理解して、プレスリリースとして効果的なセクション内容に仕上げてください。

【重要な原則】
**ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を汲み取って、プレスリリースとして効果的な表現に変換してください。**

【あなたの役割】
- ユーザーの入力情報を「素材」として受け取り、その本質的な価値やニュース性を抽出する
- 抽出した本質を基に、メディアに取り上げられやすい効果的なセクション内容を創造する
- ユーザーの表現をそのまま使うのではなく、プレスリリースとして適切な表現に変換・再構成する
- メディアや読者の関心を強く引く、プロフェッショナルなセクション内容を作成する

【情報処理のプロセス】
1. **情報の抽出**: ユーザーの入力情報から、本質的な価値、ニュース性、社会的意義を抽出する
2. **価値の再構成**: 抽出した情報を、プレスリリースとして効果的な表現に再構成する
3. **表現の最適化**: メディアに取り上げられやすい形式に仕上げる

【セクションの目標】
1. **本質の抽出**: ユーザーの入力情報から本質的な価値やニュース性を見出す
2. **効果的な表現**: プレスリリースとして効果的で、メディアに取り上げられやすい表現にする
3. **自然さ**: 日本語として自然で読みやすい文章を作成する
4. **ストーリーテリング**: 読者を引き込むストーリーを語る
5. **明確性**: 具体的な数値、事実、事例を含める（可能な場合）
6. **一貫性**: タイトル、導入文、他のセクションとの整合性を保つ
7. **流れ**: 前後のセクションから自然に流れる構成にする

【セクション作成の方針】
- ユーザーの入力情報を「素材」として受け取り、その本質を理解する
- 本質を基に、プレスリリースとして効果的な表現に変換・再構成する
- ユーザーの表現をそのまま使うのではなく、メディアに取り上げられやすい形式に仕上げる
- 自然な日本語で、読みやすく理解しやすい文章を心がける
- 背景セクション: なぜこのタイミングで発表するのか、社会課題や市場状況との関連性を示す
- 開発経緯セクション: 開発のストーリー、苦労や工夫、エピソードを含める
- カスタムセクション: セクションタイトルに応じた内容を、ストーリー性を持たせて作成
- 具体的な数値や事実を含めると効果的です（可能な場合）
- 読者が「これは知りたい」と思う要素を含める
- **充実した内容**: 簡潔すぎる文章（2、3行で終わるような手抜き文章）は絶対に避け、必要な情報を十分に含めた充実したセクション内容を作成してください。内容に応じて適切な長さで、読者に価値を十分に伝える文章にしてください。プロフェッショナルなプレスリリースとして完成度の高いセクション内容を作成してください
- ストーリー性を持たせ、読者を引き込む構成にする
- 背景、経緯、詳細、意義、効果など、セクションタイトルに応じた内容を十分に展開する`

  const otherSections = pressRelease.sections
    .filter((s) => s.content !== sectionContent)
    .map((s) => `- ${s.title}: ${s.content.substring(0, 200)}`)
    .join('\n') || 'なし'

  const userPrompt = `以下のプレスリリース情報を基に、優秀なプロの広報・PRプランナーとして、情報の本質を汲み取って、プレスリリースとして効果的なセクション内容を生成してください。

【最重要】ユーザーの入力情報を一字一句そのまま使うのではなく、情報の本質を理解して、プレスリリースとして効果的な表現に変換してください。ユーザーの表現は「素材」として受け取り、その本質を抽出して、メディアに取り上げられやすい形式に仕上げてください。

【基本情報】
会社名: ${pressRelease.companyName || '未指定'}
リリース日: ${pressRelease.releaseDate ? new Date(pressRelease.releaseDate).toLocaleDateString('ja-JP') : '未指定'}

【タイトル関連】
タイトル: ${pressRelease.title || '未指定'}
サブタイトル: ${pressRelease.subtitle || 'なし'}
スローガン・キャッチコピー: ${pressRelease.slogan || 'なし'}

【導入文】
${pressRelease.introduction || 'なし'}

【既存のセクション内容（参考情報）】
${sectionContent || 'なし'}

【他のセクション情報】
${otherSections}

【生成プロセス】
1. **情報の本質を抽出**: ユーザーの入力情報（会社名、タイトル、導入文、他のセクション情報など）から、本質的な価値、ニュース性、社会的意義を抽出してください
2. **プレスリリースとして再構成**: 抽出した本質を基に、プレスリリースとして効果的な表現に変換・再構成してください
3. **メディア視点で最適化**: メディアに取り上げられやすい形式に仕上げてください

【生成方針】
- **情報の本質を理解**: ユーザーの表現をそのまま使うのではなく、その背後にある本質的な価値やニュース性を理解してください
- **効果的な表現に変換**: 理解した本質を、プレスリリースとして効果的な表現に変換してください
- **メディア視点**: メディアが「これは記事にしたい」と思うような要素を含めてください
- **自然な日本語**: 自然な日本語で、読みやすく理解しやすい文章を作成してください
- **ストーリーテリング**: セクションタイトルに応じた内容を、読者を引き込むストーリーとして語ってください
- **具体性**: 具体的な数値や事実を含めると効果的です（可能な場合）
- **詳細性**: 背景、経緯、詳細、意義、効果など、セクションタイトルに応じた内容を十分に展開してください。簡潔すぎず、必要な情報を十分に含めた充実した内容にしてください
- **充実した内容**: 簡潔すぎる文章（2、3行で終わるような手抜き文章）は絶対に避け、必要な情報を十分に含めた充実したセクション内容を作成してください。内容に応じて適切な長さで、読者に価値を十分に伝える文章にしてください。プロフェッショナルなプレスリリースとして完成度の高いセクション内容を作成してください
- **一貫性**: タイトル、導入文、他のセクションとの整合性を保ち、自然に流れる構成にしてください
- **セクションタイプ別の対応**:
  - 背景セクション: 社会課題や市場状況との関連性、なぜ今このタイミングかを明確にし、背景を十分に説明してください
  - 開発経緯セクション: 開発のストーリー、苦労や工夫、エピソードを含め、開発の経緯を詳しく説明してください
  - カスタムセクション: セクションタイトルに応じた内容を、ストーリー性を持たせて十分に展開してください

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
      // タイトルの場合は、既存のタイトルをそのまま返さず、新しいタイトルを生成
      // 複数案を生成する必要があるため、テンプレートベースでは単一の案を返す
      if (pressRelease.companyName) {
        return `${pressRelease.companyName}が新サービスをリリース`
      }
      // 導入文やセクション情報からタイトルを推測
      if (pressRelease.introduction) {
        const intro = pressRelease.introduction.substring(0, 50)
        return intro.replace(/[。、]/g, '').trim() || 'プレスリリース'
      }
      return 'プレスリリース'

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

