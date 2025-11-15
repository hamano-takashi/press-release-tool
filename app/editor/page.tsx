'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import EditorForm from '@/components/editor/EditorForm'
import PreviewPanel from '@/components/editor/PreviewPanel'
import EditorToolbar from '@/components/editor/EditorToolbar'
import GuidedCreation from '@/components/editor/GuidedCreation'
import AIGeneration from '@/components/editor/AIGeneration'

function EditorContent() {
  const searchParams = useSearchParams()
  const { currentPressRelease, setMode, createNewPressRelease, mode } = usePressReleaseStore()
  const modeParam = searchParams.get('mode')
  const [isInitializing, setIsInitializing] = useState(true)

  // URLパラメータからモードを設定
  useEffect(() => {
    if (modeParam === 'guided' || modeParam === 'ai-generate') {
      setMode(modeParam)
    } else {
      setMode('normal')
    }
  }, [modeParam, setMode])

  // プレスリリースが存在しない場合は新規作成（初回のみ）
  useEffect(() => {
    if (!currentPressRelease) {
      createNewPressRelease()
    }
  }, []) // 初回マウント時のみ実行

  // 初期化完了を確認
  useEffect(() => {
    if (currentPressRelease) {
      setIsInitializing(false)
    }
  }, [currentPressRelease])

  // ローディング表示（初期化中またはcurrentPressReleaseがnullの場合）
  if (isInitializing || !currentPressRelease) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // モードに応じてコンポーネントを切り替え
  if (mode === 'guided') {
    return <GuidedCreation />
  }

  if (mode === 'ai-generate') {
    return <AIGeneration />
  }

  // 通常モード
  return (
    <div className="min-h-screen bg-gray-50">
      <EditorToolbar />
      <div className="flex h-[calc(100vh-64px)]">
        {/* 左側: 入力フォーム */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <EditorForm />
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

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}

