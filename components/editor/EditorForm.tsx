'use client'

import { useState, useEffect } from 'react'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import ImageUploader from '@/components/editor/ImageUploader'
import SectionEditor from '@/components/editor/SectionEditor'
import { PressReleaseSection } from '@/types'
import { generateId } from '@/lib/utils'
import Button from '@/components/Button'

export default function EditorForm() {
  const { currentPressRelease, updatePressRelease, selectedAI, setSelectedAI } = usePressReleaseStore()
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [isGeneratingIntroduction, setIsGeneratingIntroduction] = useState(false)
  const [showAISelector, setShowAISelector] = useState(false)
  const [titleProposals, setTitleProposals] = useState<Array<{ title: string; approach: string }> | null>(null)

  // ブラウザ拡張機能のエラーを無視するグローバルエラーハンドラー
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleError = (event: ErrorEvent) => {
      // ブラウザ拡張機能のエラーを無視
      if (
        event.filename &&
        (event.filename.includes('chrome-extension://') ||
         event.filename.includes('moz-extension://') ||
         event.filename.includes('safari-extension://'))
      ) {
        console.warn('ブラウザ拡張機能のエラーを無視:', {
          message: event.message,
          filename: event.filename,
        })
        event.preventDefault()
        return
      }
    }

    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('error', handleError)
    }
  }, [])

  if (!currentPressRelease) return null

  const handleChange = (field: string, value: any) => {
    updatePressRelease({ [field]: value })
  }

  const handleContactChange = (field: string, value: string) => {
    updatePressRelease({
      contact: {
        ...currentPressRelease.contact,
        [field]: value,
      },
    })
  }

  const handleAddSection = () => {
    const newSection: PressReleaseSection = {
      id: generateId(),
      type: 'custom',
      title: '',
      content: '',
      order: currentPressRelease.sections.length,
    }
    handleChange('sections', [...currentPressRelease.sections, newSection])
  }

  const handleUpdateSection = (id: string, updates: Partial<PressReleaseSection>) => {
    const updatedSections = currentPressRelease.sections.map((section) =>
      section.id === id ? { ...section, ...updates } : section
    )
    handleChange('sections', updatedSections)
  }

  const handleDeleteSection = (id: string) => {
    const filteredSections = currentPressRelease.sections.filter((s) => s.id !== id)
    handleChange('sections', filteredSections)
  }

  // AI補助機能を呼び出す関数
  const handleAIAssist = async (type: 'title' | 'introduction' | 'section', sectionContent?: string) => {
    if (!currentPressRelease) {
      alert('プレスリリースが読み込まれていません')
      return null
    }

    const loadingState = type === 'title' ? setIsGeneratingTitle : setIsGeneratingIntroduction
    loadingState(true)

    try {
      console.log('AI補助機能を呼び出します:', { type, selectedAI, hasPressRelease: !!currentPressRelease })
      
      const requestBody = {
        type,
        pressRelease: currentPressRelease,
        selectedAI: selectedAI || 'auto',
        sectionContent,
      }

      console.log('リクエストボディ:', JSON.stringify(requestBody, null, 2))

      // fetchリクエストを実行（ブラウザ拡張機能のエラーを無視）
      let response: Response
      try {
        response = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          // ブラウザ拡張機能の干渉を避けるための設定
          credentials: 'same-origin',
        })
      } catch (fetchError) {
        // ネットワークエラーやブラウザ拡張機能のエラーをキャッチ
        console.error('Fetch error:', fetchError)
        // ブラウザ拡張機能のエラーは無視して、実際のエラーを確認
        if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。')
        }
        throw fetchError
      }

      console.log('レスポンスステータス:', response.status, response.statusText)

      const responseText = await response.text()
      console.log('APIレスポンステキスト:', responseText.substring(0, 200))

      if (!response.ok) {
        let errorText = ''
        let errorData: any = null
        try {
          errorData = JSON.parse(responseText)
          errorText = errorData.error || JSON.stringify(errorData)
        } catch {
          errorText = responseText
        }
        console.error('APIエラー:', errorText)
        
        // APIキー関連のエラーの場合は、より親切なメッセージを表示
        if (errorText.includes('APIキー') || errorText.includes('API_KEY')) {
          const friendlyMessage = 'AI機能を使用するには、環境変数にAI APIキーを設定する必要があります。\n\n設定方法:\n1. OpenAI APIキー: OPENAI_API_KEY\n2. Anthropic Claude APIキー: ANTHROPIC_API_KEY\n3. Google Gemini APIキー: GEMINI_API_KEY\n\nいずれか1つを設定してください。'
          throw new Error(friendlyMessage)
        }
        
        throw new Error(`APIエラー: ${response.status} ${response.statusText} - ${errorText}`)
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log('APIレスポンス:', data)
      } catch (parseError) {
        console.error('JSONパースエラー:', parseError)
        throw new Error('APIレスポンスの解析に失敗しました')
      }

      if (data.success) {
        if (type === 'title') {
          // 複数のタイトル案が返された場合
          if (data.proposals && Array.isArray(data.proposals)) {
            console.log('タイトル案を生成しました:', data.proposals)
            setTitleProposals(data.proposals)
          } else if (data.result) {
            // 単一のタイトルが返された場合（後方互換性）
            const newTitle = data.result.trim()
            console.log('タイトルを更新します:', { 
              oldTitle: currentPressRelease.title, 
              newTitle: newTitle,
              newTitleLength: newTitle.length 
            })
            handleChange('title', newTitle)
            console.log('タイトルを更新しました:', newTitle)
          }
        } else if (type === 'introduction') {
          const newIntroduction = data.result.trim()
          console.log('導入文を更新します:', { 
            oldIntroduction: currentPressRelease.introduction?.substring(0, 50), 
            newIntroduction: newIntroduction.substring(0, 50),
            newIntroductionLength: newIntroduction.length 
          })
          handleChange('introduction', newIntroduction)
          console.log('導入文を更新しました:', newIntroduction.substring(0, 50))
        }
        // sectionの場合はSectionEditorで処理
        return data.result
      } else {
        const errorMessage = data.error || 'AI補助機能の実行に失敗しました'
        console.error('AI補助機能エラー:', errorMessage, data)
        
        // APIキー関連のエラーの場合は、より親切なメッセージを表示
        let displayMessage = errorMessage
        if (errorMessage.includes('APIキー') || errorMessage.includes('API_KEY') || errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('ANTHROPIC_API_KEY') || errorMessage.includes('GEMINI_API_KEY')) {
          displayMessage = 'AI機能を使用するには、環境変数にAI APIキーを設定する必要があります。\n\n設定方法:\n1. OpenAI APIキー: OPENAI_API_KEY\n2. Anthropic Claude APIキー: ANTHROPIC_API_KEY\n3. Google Gemini APIキー: GEMINI_API_KEY\n\nいずれか1つを設定してください。\n\n（開発環境では .env.local ファイルに設定してください）'
        }
        
        alert(`AI補助機能エラー: ${displayMessage}`)
        return null
      }
    } catch (error) {
      console.error('AI assist error:', error)
      
      // ブラウザ拡張機能のエラーを除外
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isExtensionError = errorMessage.includes('chrome-extension') || 
                               errorMessage.includes('hash') ||
                               errorMessage.includes('Receiving end does not exist')
      
      if (isExtensionError) {
        console.warn('ブラウザ拡張機能のエラーを検出しました。無視して続行します。', errorMessage)
        // 拡張機能のエラーは無視して、処理を続行
        loadingState(false)
        return null
      }
      
      const errorStack = error instanceof Error ? error.stack : undefined
      console.error('エラー詳細:', { errorMessage, errorStack, error })
      
      // APIキー関連のエラーの場合は、より親切なメッセージを表示
      let displayMessage = errorMessage
      if (errorMessage.includes('APIキー') || errorMessage.includes('API_KEY') || errorMessage.includes('OPENAI_API_KEY') || errorMessage.includes('ANTHROPIC_API_KEY') || errorMessage.includes('GEMINI_API_KEY')) {
        displayMessage = 'AI機能を使用するには、環境変数にAI APIキーを設定する必要があります。\n\n設定方法:\n1. OpenAI APIキー: OPENAI_API_KEY\n2. Anthropic Claude APIキー: ANTHROPIC_API_KEY\n3. Google Gemini APIキー: GEMINI_API_KEY\n\nいずれか1つを設定してください。\n\n（開発環境では .env.local ファイルに設定してください）'
      }
      
      // Gemini APIのエラーの場合は、エラーメッセージに詳細が含まれている可能性がある
      // サーバー側から返されたエラーメッセージをそのまま使用
      
      // 実際のエラーのみをユーザーに表示
      alert(`エラー: ${displayMessage}`)
      return null
    } finally {
      loadingState(false)
      console.log('AI補助機能の処理を完了しました（type:', type, ')')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">プレスリリース編集</h2>
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAISelector(!showAISelector)}
          >
            <span className="mr-2">🤖</span>
            AI: {selectedAI === 'auto' ? '自動' : selectedAI === 'openai' ? 'GPT-4' : selectedAI === 'claude' ? 'Claude' : 'Gemini'}
          </Button>
          {showAISelector && (
            <>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedAI('auto')
                      setShowAISelector(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                      selectedAI === 'auto' ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    自動選択
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAI('openai')
                      setShowAISelector(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                      selectedAI === 'openai' ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    OpenAI GPT-4
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAI('claude')
                      setShowAISelector(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                      selectedAI === 'claude' ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    Anthropic Claude
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAI('gemini')
                      setShowAISelector(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-100 ${
                      selectedAI === 'gemini' ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    Google Gemini
                  </button>
                </div>
              </div>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAISelector(false)}
              />
            </>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
        <div className="space-y-4">
          <Input
            label="会社名・組織名"
            value={currentPressRelease.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="株式会社○○"
          />
          <Input
            label="リリース日"
            type="date"
            value={
              currentPressRelease.releaseDate
                ? new Date(currentPressRelease.releaseDate).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => handleChange('releaseDate', new Date(e.target.value))}
          />
        </div>
      </div>

      {/* タイトル */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">タイトル・ヘッドライン</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTitleProposals(null)
              handleAIAssist('title')
            }}
            disabled={isGeneratingTitle}
          >
            {isGeneratingTitle ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                AI生成中...
              </>
            ) : (
              <>
                <span className="mr-2">🤖</span>
                AI補助
              </>
            )}
          </Button>
        </div>
        <div className="space-y-4">
          {/* タイトル案が生成された場合 */}
          {titleProposals && titleProposals.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">生成されたタイトル案</h4>
              <div className="space-y-3">
                {titleProposals.map((proposal, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
                    onClick={() => {
                      handleChange('title', proposal.title)
                      setTitleProposals(null)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-primary-600 mb-1">
                          {proposal.approach || `案${index + 1}`}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {proposal.title}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChange('title', proposal.title)
                          setTitleProposals(null)
                        }}
                        className="ml-3 px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        選択
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setTitleProposals(null)}
                className="mt-3 text-xs text-gray-500 hover:text-gray-700"
              >
                閉じる
              </button>
            </div>
          )}
          <Input
            label="メインタイトル"
            value={currentPressRelease.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="プレスリリースのタイトルを入力"
            required
          />
          <Input
            label="サブタイトル（任意）"
            value={currentPressRelease.subtitle || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="サブタイトルを入力"
          />
          <Input
            label="スローガン・キャッチコピー（任意）"
            value={currentPressRelease.slogan || ''}
            onChange={(e) => handleChange('slogan', e.target.value)}
            placeholder="キャッチコピーを入力"
          />
        </div>
      </div>

      {/* 導入段落 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">導入段落</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAIAssist('introduction')}
            disabled={isGeneratingIntroduction}
          >
            {isGeneratingIntroduction ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                AI生成中...
              </>
            ) : (
              <>
                <span className="mr-2">🤖</span>
                AI補助
              </>
            )}
          </Button>
        </div>
        <Textarea
          label="導入文"
          value={currentPressRelease.introduction}
          onChange={(e) => handleChange('introduction', e.target.value)}
          placeholder="プレスリリースの導入文を入力してください"
          rows={5}
          required
        />
      </div>

      {/* 画像 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">画像</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ロゴ画像</label>
            <ImageUploader
              image={currentPressRelease.logoImage}
              onImageChange={(image) => handleChange('logoImage', image)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メイン画像</label>
            <ImageUploader
              image={currentPressRelease.mainImage}
              onImageChange={(image) => handleChange('mainImage', image)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">その他画像</label>
            <ImageUploader
              image={null}
              onImageChange={(image) => {
                if (image) {
                  handleChange('additionalImages', [...currentPressRelease.additionalImages, image])
                }
              }}
            />
            {currentPressRelease.additionalImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {currentPressRelease.additionalImages.map((img) => (
                  <div key={img.id} className="relative">
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        handleChange(
                          'additionalImages',
                          currentPressRelease.additionalImages.filter((i) => i.id !== img.id)
                        )
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* セクション */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">セクション</h3>
          <button
            onClick={handleAddSection}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            + セクション追加
          </button>
        </div>
        <div className="space-y-4">
          {currentPressRelease.sections.map((section) => (
            <SectionEditor
              key={section.id}
              section={section}
              onUpdate={(updates) => handleUpdateSection(section.id, updates)}
              onDelete={() => handleDeleteSection(section.id)}
              onAIAssist={async () => {
                const result = await handleAIAssist('section', section.content)
                return result
              }}
              selectedAI={selectedAI}
            />
          ))}
          {currentPressRelease.sections.length === 0 && (
            <p className="text-gray-500 text-sm">セクションを追加してください</p>
          )}
        </div>
      </div>

      {/* 問い合わせ先 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">問い合わせ先</h3>
        <div className="space-y-4">
          <Input
            label="担当者名"
            value={currentPressRelease.contact.name}
            onChange={(e) => handleContactChange('name', e.target.value)}
            placeholder="山田 太郎"
            required
          />
          <Input
            label="電話番号"
            value={currentPressRelease.contact.phone}
            onChange={(e) => handleContactChange('phone', e.target.value)}
            placeholder="080-1234-5678"
            required
          />
          <Input
            label="メールアドレス"
            type="email"
            value={currentPressRelease.contact.email}
            onChange={(e) => handleContactChange('email', e.target.value)}
            placeholder="contact@example.com"
            required
          />
        </div>
      </div>
    </div>
  )
}

