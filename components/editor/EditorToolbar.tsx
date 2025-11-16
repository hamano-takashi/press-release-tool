'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import Button from '@/components/Button'
import TemplateSelector from '@/components/editor/TemplateSelector'

export default function EditorToolbar() {
  const router = useRouter()
  const { currentPressRelease, saveCurrentDraft: saveDraft, setMode, mode } = usePressReleaseStore()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  const handleSave = () => {
    if (currentPressRelease) {
      saveDraft()
      alert('下書きを保存しました')
    }
  }

  const handleExportPDF = async () => {
    if (!currentPressRelease) {
      alert('プレスリリースが作成されていません')
      return
    }

    // 必須項目のチェック
    if (!currentPressRelease.title || !currentPressRelease.introduction) {
      alert('タイトルと導入段落を入力してください')
      return
    }

    setIsGeneratingPDF(true)

    try {
      console.log('PDF生成を開始します...')
      const { generatePDF } = await import('@/lib/pdf-client')
      console.log('PDF生成関数をインポートしました')
      
      await generatePDF(currentPressRelease)
      console.log('PDF生成が完了しました')
      alert('PDFの出力が完了しました')
    } catch (error) {
      console.error('PDF export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'PDF出力中にエラーが発生しました'
      alert(`PDF出力エラー: ${errorMessage}\n\n詳細はブラウザのコンソールを確認してください。`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleExportWord = async () => {
    if (!currentPressRelease) {
      alert('プレスリリースが作成されていません')
      return
    }

    // 必須項目のチェック
    if (!currentPressRelease.title || !currentPressRelease.introduction) {
      alert('タイトルと導入段落を入力してください')
      return
    }

    try {
      const { generateWord } = await import('@/lib/word-generator')
      await generateWord(currentPressRelease)
      alert('Wordの出力が完了しました')
    } catch (error) {
      console.error('Word export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Word出力中にエラーが発生しました'
      alert(`Word出力エラー: ${errorMessage}\n\n詳細はブラウザのコンソールを確認してください。`)
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="text-gray-600 hover:text-gray-900 font-semibold"
        >
          ← ホーム
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'normal' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('normal')}
          >
            通常モード
          </Button>
          <Button
            variant={mode === 'guided' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('guided')}
          >
            ガイドモード
          </Button>
          <Button
            variant={mode === 'ai-generate' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setMode('ai-generate')}
          >
            AI生成
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(true)}>
          テンプレート
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          保存
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleExportPDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              PDF生成中...
            </>
          ) : (
            'PDF出力'
          )}
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExportWord}>
          Word出力
        </Button>
      </div>

      {/* テンプレート選択モーダル */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TemplateSelector
              onSelect={() => setShowTemplateSelector(false)}
              onClose={() => setShowTemplateSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
