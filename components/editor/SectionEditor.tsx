'use client'

import { useState } from 'react'
import { PressReleaseSection, AIType } from '@/types'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import Button from '@/components/Button'

interface SectionEditorProps {
  section: PressReleaseSection
  onUpdate: (updates: Partial<PressReleaseSection>) => void
  onDelete: () => void
  onAIAssist?: () => Promise<string | null>
  selectedAI?: AIType
}

export default function SectionEditor({ section, onUpdate, onDelete, onAIAssist, selectedAI }: SectionEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleAIAssist = async () => {
    if (!onAIAssist) return
    setIsGenerating(true)
    try {
      const result = await onAIAssist()
      if (result) {
        onUpdate({ content: result })
      }
    } finally {
      setIsGenerating(false)
    }
  }
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <select
          value={section.type}
          onChange={(e) => onUpdate({ type: e.target.value as PressReleaseSection['type'] })}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="background">背景</option>
          <option value="development">開発経緯</option>
          <option value="custom">カスタム</option>
        </select>
        <Button variant="danger" size="sm" onClick={onDelete}>
          削除
        </Button>
      </div>
      <div className="space-y-3">
        <Input
          label="セクションタイトル"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="セクションのタイトルを入力"
        />
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">内容</label>
          {onAIAssist && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIAssist}
              disabled={isGenerating}
            >
              {isGenerating ? (
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
          )}
        </div>
        <Textarea
          value={section.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="セクションの内容を入力"
          rows={6}
        />
      </div>
    </div>
  )
}

