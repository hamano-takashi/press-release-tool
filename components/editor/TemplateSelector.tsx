'use client'

import { useState, useEffect } from 'react'
import { Template } from '@/types'
import { getAllTemplates, getTemplatesByCategory, saveTemplate, deleteTemplate, createPressReleaseFromTemplate } from '@/lib/templates'
import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'

interface TemplateSelectorProps {
  onSelect?: (template: Template) => void
  onClose?: () => void
}

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const { updatePressRelease } = usePressReleaseStore()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Template['category'] | 'all'>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    const allTemplates = getAllTemplates()
    setTemplates(allTemplates)
  }

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : getTemplatesByCategory(selectedCategory)

  const handleSelectTemplate = (template: Template) => {
    const pressRelease = createPressReleaseFromTemplate(template)
    updatePressRelease(pressRelease)
    onSelect?.(template)
    onClose?.()
  }

  const { currentPressRelease: currentPR } = usePressReleaseStore()

  const handleSaveAsTemplate = () => {
    if (!currentPR) {
      alert('プレスリリースが作成されていません')
      return
    }

    if (!newTemplateName.trim()) {
      alert('テンプレート名を入力してください')
      return
    }

    const template: Template = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription,
      category: 'custom',
      pressRelease: {
        releaseDate: currentPR.releaseDate,
        companyName: currentPR.companyName,
        title: currentPR.title,
        subtitle: currentPR.subtitle,
        slogan: currentPR.slogan,
        introduction: currentPR.introduction,
        sections: currentPR.sections,
        logoImage: currentPR.logoImage,
        mainImage: currentPR.mainImage,
        additionalImages: currentPR.additionalImages,
        contact: currentPR.contact,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    saveTemplate(template)
    loadTemplates()
    setIsCreating(false)
    setNewTemplateName('')
    setNewTemplateDescription('')
    alert('テンプレートを保存しました')
  }

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('このテンプレートを削除しますか？')) {
      deleteTemplate(id)
      loadTemplates()
    }
  }

  const categories: Array<{ value: Template['category'] | 'all'; label: string }> = [
    { value: 'all', label: 'すべて' },
    { value: 'standard', label: '標準' },
    { value: 'product', label: '商品' },
    { value: 'service', label: 'サービス' },
    { value: 'event', label: 'イベント' },
    { value: 'custom', label: 'カスタム' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">テンプレートを選択</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? 'キャンセル' : '現在の原稿をテンプレートとして保存'}
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              閉じる
            </Button>
          )}
        </div>
      </div>

      {isCreating && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            テンプレートとして保存
          </h3>
          <div className="space-y-4">
            <Input
              label="テンプレート名"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="例: 新商品リリース用"
              required
            />
            <Textarea
              label="説明"
              value={newTemplateDescription}
              onChange={(e) => setNewTemplateDescription(e.target.value)}
              placeholder="テンプレートの説明を入力してください"
              rows={3}
            />
            <Button onClick={handleSaveAsTemplate}>保存</Button>
          </div>
        </div>
      )}

      {/* カテゴリフィルター */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* テンプレート一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {template.name}
                </h3>
                {template.isDefault && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                    デフォルト
                  </span>
                )}
              </div>
              {!template.isDefault && (
                <button
                  onClick={(e) => handleDeleteTemplate(template.id, e)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  削除
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            <div className="text-xs text-gray-500">
              セクション数: {template.pressRelease.sections.length}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          テンプレートが見つかりませんでした
        </div>
      )}
    </div>
  )
}

