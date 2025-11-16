'use client'

import { useRouter } from 'next/navigation'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import { getDrafts } from '@/lib/storage'
import { useEffect, useState } from 'react'
import { PressRelease } from '@/types'
import TemplateSelector from '@/components/editor/TemplateSelector'

export default function HomePage() {
  const router = useRouter()
  const { createNewPressRelease, loadDraft } = usePressReleaseStore()
  const [drafts, setDrafts] = useState<PressRelease[]>([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  useEffect(() => {
    setDrafts(getDrafts())
  }, [])

  const handleNewPressRelease = () => {
    createNewPressRelease()
    router.push('/editor')
  }

  const handleContinueDraft = (id: string) => {
    loadDraft(id)
    router.push('/editor')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              プレスリリース原稿作成ツール
            </h1>
            <p className="text-xl text-gray-600">
              簡単にプレスリリース原稿を作成し、PDF・Word形式で出力できます
            </p>
          </div>

          {/* アクションボタン */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <button
              onClick={handleNewPressRelease}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              <div className="text-3xl mb-2">✨</div>
              <div className="text-lg">新規作成</div>
              <div className="text-sm opacity-90 mt-1">新しいプレスリリースを作成</div>
            </button>

            <button
              onClick={() => setShowTemplateSelector(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="text-lg">テンプレートから作成</div>
              <div className="text-sm opacity-90 mt-1">テンプレートを選択</div>
            </button>

            <button
              onClick={() => router.push('/editor?mode=guided')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-lg">ガイド付き作成</div>
              <div className="text-sm opacity-90 mt-1">質問に答えて自動生成</div>
            </button>

            <button
              onClick={() => router.push('/editor?mode=ai-generate')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-6 px-8 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-lg">AI自動生成</div>
              <div className="text-sm opacity-90 mt-1">トレンド分析で提案</div>
            </button>
          </div>

          {/* 下書き一覧 */}
          {drafts.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">続きから作成</h2>
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => handleContinueDraft(draft.id)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition"
                  >
                    <div className="font-semibold text-gray-900">
                      {draft.title || '無題のプレスリリース'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      最終更新: {new Date(draft.updatedAt).toLocaleString('ja-JP')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* テンプレート選択モーダル */}
          {showTemplateSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <TemplateSelector
                  onSelect={() => {
                    setShowTemplateSelector(false)
                    router.push('/editor')
                  }}
                  onClose={() => setShowTemplateSelector(false)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

