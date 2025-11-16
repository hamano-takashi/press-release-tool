'use client'

import { usePressReleaseStore } from '@/store/usePressReleaseStore'
import { formatDate } from '@/lib/utils'

export default function PreviewPanel() {
  const { currentPressRelease } = usePressReleaseStore()

  if (!currentPressRelease) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        プレビューを表示するには、左側のフォームに入力してください
      </div>
    )
  }

  const releaseDate = currentPressRelease.releaseDate
    ? typeof currentPressRelease.releaseDate === 'string'
      ? new Date(currentPressRelease.releaseDate)
      : currentPressRelease.releaseDate
    : new Date()

  return (
    <div className="p-8 bg-white min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー - 横並びレイアウト */}
        <div className="flex justify-between items-start mb-8 pb-4">
          {/* 左側: 報道関係各位 */}
          <div className="flex-1">
            <div className="inline-block border-2 border-gray-400 rounded-lg px-4 py-2 bg-gray-50">
              <div className="text-sm font-semibold text-gray-800">報道関係各位</div>
            </div>
          </div>

          {/* 中央: ロゴ画像 */}
          <div className="flex-1 flex justify-center items-center">
            {currentPressRelease.logoImage && (
              <img
                src={currentPressRelease.logoImage.url}
                alt={currentPressRelease.logoImage.filename}
                className="max-h-20 h-auto object-contain"
              />
            )}
          </div>

          {/* 右側: 日付と企業名 */}
          <div className="flex-1 text-right">
            <div className="text-sm text-gray-700">
              {releaseDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            {currentPressRelease.companyName && (
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {currentPressRelease.companyName}
              </div>
            )}
          </div>
        </div>

        {/* タイトル - 中央配置 */}
        {currentPressRelease.title && (
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
              {currentPressRelease.title}
            </h1>
            {currentPressRelease.subtitle && (
              <h2 className="text-xl text-gray-700 mb-3 leading-tight">
                {currentPressRelease.subtitle}
              </h2>
            )}
          </div>
        )}

        {/* 導入段落 - 中央配置 */}
        {currentPressRelease.introduction && (
          <div className="mb-8 text-center">
            <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap max-w-3xl mx-auto">
              {currentPressRelease.introduction}
            </p>
          </div>
        )}

        {/* メイン画像 - 配置設定を反映 */}
        {currentPressRelease.mainImage && (
          <div
            className={`mb-8 ${
              currentPressRelease.mainImage.position === 'left'
                ? 'text-left'
                : currentPressRelease.mainImage.position === 'right'
                ? 'text-right'
                : 'text-center'
            }`}
          >
            {currentPressRelease.slogan && (
              <p className="text-lg font-semibold text-gray-800 mb-4">
                {currentPressRelease.slogan}
              </p>
            )}
            <img
              src={currentPressRelease.mainImage.url}
              alt={currentPressRelease.mainImage.filename}
              className={`h-auto rounded-lg shadow-md ${
                currentPressRelease.mainImage.position === 'left'
                  ? 'ml-0'
                  : currentPressRelease.mainImage.position === 'right'
                  ? 'mr-0'
                  : 'mx-auto'
              }`}
              style={{
                maxWidth: currentPressRelease.mainImage.maxWidth
                  ? `${currentPressRelease.mainImage.maxWidth}px`
                  : '100%',
              }}
            />
          </div>
        )}

        {/* セクション - 中央配置 */}
        {currentPressRelease.sections.map((section) => (
          <div key={section.id} className="mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ■{section.title || 'セクションタイトル'}
            </h3>
            <div className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap max-w-3xl mx-auto text-left">
              {section.content}
            </div>
          </div>
        ))}

        {/* その他画像 - 配置設定を反映 */}
        {currentPressRelease.additionalImages.length > 0 && (
          <div
            className={`mb-8 flex flex-wrap gap-4 ${
              currentPressRelease.additionalImages[0]?.position === 'left'
                ? 'justify-start'
                : currentPressRelease.additionalImages[0]?.position === 'right'
                ? 'justify-end'
                : 'justify-center'
            }`}
          >
            {currentPressRelease.additionalImages.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={img.filename}
                className="max-w-md w-full h-auto rounded-lg shadow-md"
                style={{
                  maxWidth: img.maxWidth ? `${img.maxWidth}px` : undefined,
                }}
              />
            ))}
          </div>
        )}

        {/* 問い合わせ先 - 中央配置 */}
        <div className="mt-12 pt-6 border-t border-gray-300 text-center">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            ＜この件に関するマスコミ、素材・データなどの問い合わせ＞
          </div>
          <div className="text-sm text-gray-800 space-y-1">
            {currentPressRelease.contact.name && (
              <div>{currentPressRelease.companyName || ''} 広報担当: {currentPressRelease.contact.name}</div>
            )}
            {currentPressRelease.contact.phone && (
              <div>電話番号: {currentPressRelease.contact.phone}</div>
            )}
            {currentPressRelease.contact.email && (
              <div>mail: {currentPressRelease.contact.email}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
