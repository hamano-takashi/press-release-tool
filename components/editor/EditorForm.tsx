'use client'

import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import Input from '@/components/Input'
import Textarea from '@/components/Textarea'
import ImageUploader from '@/components/editor/ImageUploader'
import SectionEditor from '@/components/editor/SectionEditor'
import { PressReleaseSection } from '@/types'
import { generateId } from '@/lib/utils'

export default function EditorForm() {
  const { currentPressRelease, updatePressRelease } = usePressReleaseStore()

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">プレスリリース編集</h2>

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">タイトル・ヘッドライン</h3>
        <div className="space-y-4">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">導入段落</h3>
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

