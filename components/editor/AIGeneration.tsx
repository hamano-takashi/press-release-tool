'use client'

import { useState } from 'react'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import { AIAnalysisInput, AIGeneratedProposal, AIType } from '@/types'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import EditorToolbar from '@/components/editor/EditorToolbar'

export default function AIGeneration() {
  const { setAIGeneration, aiGeneration, updatePressRelease, setMode } = usePressReleaseStore()
  const [input, setInput] = useState<AIAnalysisInput>({
    productServiceName: '',
    description: '',
    industry: '',
    targetCustomers: '',
    features: [],
    priceRange: '',
    releaseDate: new Date(),
    selectedAI: 'auto',
  })
  const [featureInput, setFeatureInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleInputChange = (field: keyof AIAnalysisInput, value: any) => {
    setInput({
      ...input,
      [field]: value,
    })
  }

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      handleInputChange('features', [...input.features, featureInput.trim()])
      setFeatureInput('')
    }
  }

  const handleGenerate = async () => {
    // 必須項目のチェック
    if (!input.productServiceName || !input.description) {
      alert('商品・サービス名と詳細説明を入力してください')
      return
    }

    setIsGenerating(true)
    setAIGeneration({ isGenerating: true })

    try {
      const response = await fetch('/api/ai/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      })

      const data = await response.json()
      console.log('API Response:', data)

      if (!response.ok) {
        const errorMessage = data.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(`プレスリリース案の生成に失敗しました: ${errorMessage}`)
      }
      
      if (data.success) {
        if (data.proposals && data.proposals.length > 0) {
          setAIGeneration({
            isGenerating: false,
            proposals: data.proposals,
            selectedProposal: null,
          })
        } else {
          // 提案が生成されなかった場合
          const message = data.compatibleCount === 0 && data.totalGenerated > 0
            ? `提案は${data.totalGenerated}件生成されましたが、適合性チェックで全て除外されました。商品情報やトレンドを調整して再度お試しください。`
            : 'プレスリリース案が生成されませんでした。商品情報を確認して再度お試しください。'
          alert(message)
          setAIGeneration({
            isGenerating: false,
            proposals: [],
            selectedProposal: null,
          })
        }
      } else {
        throw new Error(data.error || 'プレスリリース案の生成に失敗しました')
      }
    } catch (error) {
      console.error('Generation error:', error)
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      console.error('Full error details:', error)
      alert(
        `プレスリリース案の生成に失敗しました: ${errorMessage}\n\nブラウザのコンソールを確認してください。`
      )
    } finally {
      setIsGenerating(false)
      setAIGeneration({ isGenerating: false })
    }
  }

  const handleSelectProposal = (proposal: AIGeneratedProposal) => {
    // 選択した案をプレスリリースに適用
    updatePressRelease(proposal.preview)
    // 通常モードに切り替え
    setMode('normal')
    alert('選択した案を編集画面に適用しました！')
  }

  const angleLabels: Record<AIGeneratedProposal['angle'], string> = {
    'social-issue': '社会課題解決型',
    'trend-aligned': 'トレンド連動型',
    'seasonal': '季節性活用型',
    'unique-story': 'ユニークストーリー型',
    'industry-innovative': '業界革新型',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EditorToolbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI自動プレスリリース案生成</h1>
            <p className="text-gray-600">
              商品・サービスの情報を入力すると、最新のトレンドを分析してメディアに取り上げられやすい複数のプレスリリース案を自動生成します
            </p>
          </div>

          {/* 入力フォーム */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">商品・サービス情報</h2>
            <div className="space-y-4">
              <Input
                label="商品・サービス名"
                value={input.productServiceName}
                onChange={(e) => handleInputChange('productServiceName', e.target.value)}
                placeholder="例：AI翻訳アプリ"
                required
              />
              <Textarea
                label="商品・サービスの詳細説明"
                value={input.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="商品・サービスの詳細な説明を入力してください"
                rows={5}
                required
              />
              <Input
                label="業界・カテゴリ"
                value={input.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="例：IT、ヘルスケア、教育"
              />
              <Input
                label="ターゲット顧客"
                value={input.targetCustomers}
                onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
                placeholder="例：20代〜30代のビジネスパーソン"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主な特徴・強み
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    label=""
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="特徴を入力"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddFeature()
                      }
                    }}
                  />
                  <Button onClick={handleAddFeature} size="sm">
                    追加
                  </Button>
                </div>
                {input.features.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {input.features.map((feature, index) => (
                      <li key={index}>
                        {feature}
                        <button
                          onClick={() => {
                            handleInputChange(
                              'features',
                              input.features.filter((_, i) => i !== index)
                            )
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          削除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Input
                label="価格帯"
                value={input.priceRange}
                onChange={(e) => handleInputChange('priceRange', e.target.value)}
                placeholder="例：月額980円、無料"
              />
              <Input
                label="リリース予定日"
                type="date"
                value={
                  input.releaseDate
                    ? typeof input.releaseDate === 'string'
                      ? new Date(input.releaseDate).toISOString().split('T')[0]
                      : input.releaseDate.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleInputChange('releaseDate', new Date(e.target.value))}
              />
              
              {/* AI選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AIを選択
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleInputChange('selectedAI', 'auto')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      input.selectedAI === 'auto'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    自動選択
                  </button>
                  <button
                    onClick={() => handleInputChange('selectedAI', 'openai')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      input.selectedAI === 'openai'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    OpenAI GPT-4
                  </button>
                  <button
                    onClick={() => handleInputChange('selectedAI', 'claude')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      input.selectedAI === 'claude'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Claude (Anthropic)
                  </button>
                  <button
                    onClick={() => handleInputChange('selectedAI', 'gemini')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      input.selectedAI === 'gemini'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Gemini (Google)
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SCALE PR Competency Modelの5つの力を憑依させた提案を行います
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !input.productServiceName || !input.description}
                className="w-full"
              >
                {isGenerating ? '生成中...' : 'プレスリリース案を生成'}
              </Button>
            </div>
          </div>

          {/* 生成された案の一覧 */}
          {aiGeneration.proposals.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  生成されたプレスリリース案 ({aiGeneration.proposals.length}件)
                </h2>
                <p className="text-sm text-gray-500">
                  気に入った案を選択して編集画面に適用できます
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {aiGeneration.proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium mb-2">
                          {angleLabels[proposal.angle]}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{proposal.title}</h3>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">💡</span>推奨理由
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{proposal.recommendation}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">📰</span>想定されるメディア反応
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{proposal.expectedMediaReaction}</p>
                    </div>

                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">プレビュー</h4>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p className="font-medium line-clamp-3">{proposal.introduction}</p>
                        {proposal.background && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {proposal.background}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleSelectProposal(proposal)} 
                      className="w-full"
                      variant="primary"
                    >
                      この案を選択して編集
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">最新のトレンドを分析してプレスリリース案を生成中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

