'use client'

import { useState, useEffect } from 'react'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import { GuidedCreationAnswers } from '@/types'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'
import ImageUploader from '@/components/editor/ImageUploader'
import PreviewPanel from '@/components/editor/PreviewPanel'
import EditorToolbar from '@/components/editor/EditorToolbar'
import { fileToBase64, generateId } from '@/lib/utils'
import { ImageData } from '@/types'

// 質問の定義
interface Question {
  id: string
  category: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'image' | 'multi-text'
  field: keyof GuidedCreationAnswers
  required?: boolean
  placeholder?: string
  helpText?: string
}

const QUESTIONS: Question[] = [
  // カテゴリ1: 基本情報
  {
    id: 'q1',
    category: '基本情報',
    label: '会社名・組織名を教えてください',
    type: 'text',
    field: 'companyName',
    placeholder: '株式会社○○',
  },
  {
    id: 'q2',
    category: '基本情報',
    label: '商品・サービス名を教えてください',
    type: 'text',
    field: 'productServiceName',
    placeholder: '商品・サービスの名前',
    required: true,
  },
  {
    id: 'q3',
    category: '基本情報',
    label: 'リリース日を選択してください',
    type: 'date',
    field: 'releaseDate',
    required: true,
  },
  // カテゴリ2: 商品・サービス詳細
  {
    id: 'q4',
    category: '商品・サービス詳細',
    label: 'この商品・サービスの主な特徴を3つ教えてください（1つずつ入力してください）',
    type: 'multi-text',
    field: 'features',
    placeholder: '特徴を入力',
    helpText: '特徴を1つ入力したら「追加」ボタンを押して次の特徴を入力してください',
  },
  {
    id: 'q5',
    category: '商品・サービス詳細',
    label: '主なターゲット顧客は誰ですか？',
    type: 'textarea',
    field: 'targetCustomers',
    placeholder: '例：20代〜30代のビジネスパーソン',
  },
  {
    id: 'q6',
    category: '商品・サービス詳細',
    label: '価格はいくらですか？（無料の場合は「無料」と入力）',
    type: 'text',
    field: 'price',
    placeholder: '例：月額980円、無料',
  },
  {
    id: 'q7',
    category: '商品・サービス詳細',
    label: 'どこで購入・利用できますか？',
    type: 'textarea',
    field: 'availability',
    placeholder: '例：Webサイト、App Store、Google Play',
  },
  // カテゴリ3: 背景・ストーリー
  {
    id: 'q8',
    category: '背景・ストーリー',
    label: 'なぜこの商品・サービスを作ったのですか？',
    type: 'textarea',
    field: 'purpose',
    placeholder: '商品・サービスを作った理由を教えてください',
  },
  {
    id: 'q9',
    category: '背景・ストーリー',
    label: '開発のきっかけや背景を教えてください',
    type: 'textarea',
    field: 'background',
    placeholder: '開発のきっかけや背景を詳しく教えてください',
  },
  {
    id: 'q10',
    category: '背景・ストーリー',
    label: '現在の社会課題や市場状況との関連はありますか？',
    type: 'textarea',
    field: 'socialRelevance',
    placeholder: '社会課題や市場状況との関連を教えてください',
  },
  // カテゴリ4: 画像・ビジュアル
  {
    id: 'q11',
    category: '画像・ビジュアル',
    label: 'ロゴ画像をアップロードしてください',
    type: 'image',
    field: 'logoImage',
  },
  {
    id: 'q12',
    category: '画像・ビジュアル',
    label: 'メイン画像（商品写真など）をアップロードしてください',
    type: 'image',
    field: 'mainImage',
  },
  {
    id: 'q13',
    category: '画像・ビジュアル',
    label: 'その他の画像があれば追加してください（任意）',
    type: 'image',
    field: 'additionalImages',
  },
  // カテゴリ5: 問い合わせ先
  {
    id: 'q14',
    category: '問い合わせ先',
    label: '担当者名を教えてください',
    type: 'text',
    field: 'contactName',
    placeholder: '山田 太郎',
    required: true,
  },
  {
    id: 'q15',
    category: '問い合わせ先',
    label: '電話番号を教えてください',
    type: 'text',
    field: 'contactPhone',
    placeholder: '080-1234-5678',
    required: true,
  },
  {
    id: 'q16',
    category: '問い合わせ先',
    label: 'メールアドレスを教えてください',
    type: 'text',
    field: 'contactEmail',
    placeholder: 'contact@example.com',
    required: true,
  },
]

export default function GuidedCreation() {
  const {
    guidedCreation,
    setGuidedCreation,
    currentPressRelease,
    updatePressRelease,
    setMode,
  } = usePressReleaseStore()

  const [currentStep, setCurrentStep] = useState(guidedCreation.currentStep)
  const [answers, setAnswers] = useState<GuidedCreationAnswers>(guidedCreation.answers)
  const [featureInputs, setFeatureInputs] = useState<string[]>([''])
  const [isGenerating, setIsGenerating] = useState(false)

  const currentQuestion = QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100

  // ステップ変更時にストアを更新
  useEffect(() => {
    setGuidedCreation({ currentStep, answers })
  }, [currentStep, answers, setGuidedCreation])

  const handleAnswerChange = async (value: any) => {
    if (currentQuestion.type === 'image') {
      if (value instanceof File) {
        try {
          const base64 = await fileToBase64(value)
          const imageData: ImageData = {
            id: generateId(),
            url: base64,
            filename: value.name,
            size: value.size,
            type: value.type,
          }

          if (currentQuestion.field === 'additionalImages') {
            const currentImages = (answers.additionalImages || []) as ImageData[]
            setAnswers({
              ...answers,
              additionalImages: [...currentImages, imageData],
            })
          } else {
            setAnswers({
              ...answers,
              [currentQuestion.field]: imageData,
            })
          }
        } catch (error) {
          console.error('画像の処理に失敗しました:', error)
          alert('画像の処理に失敗しました')
        }
      }
    } else {
      setAnswers({
        ...answers,
        [currentQuestion.field]: value,
      })
    }
  }

  const handleNext = async () => {
    // 必須項目のチェック
    if (currentQuestion.required && !answers[currentQuestion.field]) {
      alert(`${currentQuestion.label}は必須項目です`)
      return
    }

    // 最後の質問の場合は生成を実行
    if (currentStep === QUESTIONS.length - 1) {
      await generatePressRelease()
      return
    }

    setCurrentStep(currentStep + 1)
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleAddFeature = () => {
    const currentFeatures = (answers.features || []) as string[]
    const newFeature = featureInputs[featureInputs.length - 1]?.trim()
    if (newFeature) {
      setAnswers({
        ...answers,
        features: [...currentFeatures, newFeature],
      })
      setFeatureInputs([''])
    }
  }

  const generatePressRelease = async () => {
    setIsGenerating(true)
    setGuidedCreation({ isGenerating: true })

    try {
      // APIを呼び出してプレスリリースを生成
      const response = await fetch('/api/ai/guided-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          currentStep,
        }),
      })

      if (!response.ok) {
        throw new Error('プレスリリースの生成に失敗しました')
      }

      const data = await response.json()
      if (data.success && data.pressRelease) {
        // 生成されたプレスリリースをストアに設定
        updatePressRelease(data.pressRelease)
        // 通常モードに切り替え
        setMode('normal')
        alert('プレスリリースが生成されました！通常モードで編集できます。')
      } else {
        throw new Error(data.error || 'プレスリリースの生成に失敗しました')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert(
        `プレスリリースの生成に失敗しました: ${
          error instanceof Error ? error.message : '不明なエラー'
        }`
      )
    } finally {
      setIsGenerating(false)
      setGuidedCreation({ isGenerating: false })
    }
  }

  const renderQuestionInput = () => {
    const currentValue = answers[currentQuestion.field]

    switch (currentQuestion.type) {
      case 'text':
        return (
          <Input
            label=""
            value={(currentValue as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion.placeholder}
            required={currentQuestion.required}
          />
        )

      case 'textarea':
        return (
          <Textarea
            label=""
            value={(currentValue as string) || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion.placeholder}
            rows={5}
            required={currentQuestion.required}
          />
        )

      case 'date':
        return (
          <Input
            label=""
            type="date"
            value={
              currentValue
                ? typeof currentValue === 'string'
                  ? new Date(currentValue).toISOString().split('T')[0]
                  : (currentValue as Date).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => handleAnswerChange(new Date(e.target.value))}
            required={currentQuestion.required}
          />
        )

      case 'image':
        if (currentQuestion.field === 'additionalImages') {
          const images = (currentValue || []) as ImageData[]
          return (
            <div className="space-y-4">
              <ImageUploader
                image={null}
                onImageChange={handleAnswerChange}
              />
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {images.map((img) => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setAnswers({
                            ...answers,
                            additionalImages: images.filter((i) => i.id !== img.id),
                          })
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
          )
        }
        return (
          <ImageUploader
            image={(currentValue as ImageData) || null}
            onImageChange={handleAnswerChange}
          />
        )

      case 'multi-text':
        const features = (currentValue || []) as string[]
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                label=""
                value={featureInputs[featureInputs.length - 1] || ''}
                onChange={(e) => {
                  const newInputs = [...featureInputs]
                  newInputs[newInputs.length - 1] = e.target.value
                  setFeatureInputs(newInputs)
                }}
                placeholder={currentQuestion.placeholder}
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
            {features.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">追加された特徴:</p>
                <ul className="list-disc list-inside space-y-1">
                  {features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {feature}
                      <button
                        onClick={() => {
                          setAnswers({
                            ...answers,
                            features: features.filter((_, i) => i !== index),
                          })
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentQuestion.helpText && (
              <p className="text-xs text-gray-500">{currentQuestion.helpText}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EditorToolbar />
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左側: 質問エリア */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto bg-white">
          <div className="p-6">
            {/* 進捗バー */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  質問 {currentStep + 1} / {QUESTIONS.length}
                </span>
                <span className="text-sm text-gray-500">{currentQuestion.category}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 質問 */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {currentQuestion.label}
              </h2>
              {renderQuestionInput()}
            </div>

            {/* ナビゲーションボタン */}
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handlePrevious}>
                    ← 前へ
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {!currentQuestion.required && currentStep < QUESTIONS.length - 1 && (
                  <Button variant="outline" onClick={handleSkip}>
                    スキップ
                  </Button>
                )}
                {currentStep < QUESTIONS.length - 1 ? (
                  <Button onClick={handleNext}>次へ →</Button>
                ) : (
                  <Button onClick={handleNext} disabled={isGenerating}>
                    {isGenerating ? '生成中...' : 'プレスリリースを生成'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右側: プレビュー */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <PreviewPanel />
        </div>
      </div>
    </div>
  )
}

