'use client'

import { useEffect } from 'react'
import Button from '@/components/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">エラーが発生しました</h2>
        <p className="text-gray-600 mb-6">
          {error.message || '予期しないエラーが発生しました。ページを再読み込みしてください。'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => reset()}>再試行</Button>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  )
}


