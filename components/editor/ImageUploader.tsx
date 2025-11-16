'use client'

import { useRef, useState } from 'react'
import { ImageData } from '@/types'
import { generateId } from '@/lib/utils'
import { fileToBase64, getImageDimensions } from '@/lib/utils'
import ImageEditor from './ImageEditor'

interface ImageUploaderProps {
  image: ImageData | null | undefined
  onImageChange: (image: ImageData | null) => void
  showEditButton?: boolean
}

export default function ImageUploader({
  image,
  onImageChange,
  showEditButton = true,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイル形式チェック
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('画像ファイル（jpg, png, gif, webp）を選択してください')
      return
    }

    // ファイルサイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください')
      return
    }

    setIsUploading(true)
    try {
      const base64 = await fileToBase64(file)
      const dimensions = await getImageDimensions(base64)

      const imageData: ImageData = {
        id: generateId(),
        url: base64,
        filename: file.name,
        size: file.size,
        type: file.type,
        width: dimensions.width,
        height: dimensions.height,
      }

      onImageChange(imageData)
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('画像の処理に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onImageChange(null)
  }

  if (showEditor && image) {
    return (
      <ImageEditor
        image={image}
        onSave={(editedImage) => {
          onImageChange(editedImage)
          setShowEditor(false)
        }}
        onCancel={() => setShowEditor(false)}
      />
    )
  }

  return (
    <div className="w-full">
      {image ? (
        <div className="relative">
          <img
            src={image.url}
            alt={image.filename}
            className={`w-full h-48 object-contain border border-gray-300 rounded-lg bg-gray-50 ${
              image.position === 'left'
                ? 'object-left'
                : image.position === 'right'
                ? 'object-right'
                : 'object-center'
            }`}
            style={{
              maxWidth: image.maxWidth ? `${image.maxWidth}px` : undefined,
            }}
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {showEditButton && (
              <button
                onClick={() => setShowEditor(true)}
                className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600"
                title="画像を編集"
              >
                ✏️
              </button>
            )}
            <button
              onClick={handleRemove}
              className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              title="画像を削除"
            >
              ×
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-600">{image.filename}</p>
            {image.width && image.height && (
              <p className="text-xs text-gray-500">
                {image.width} × {image.height}px
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <div className="text-gray-500">アップロード中...</div>
          ) : (
            <>
              <div className="text-4xl mb-2">📷</div>
              <div className="text-gray-600">画像をクリックしてアップロード</div>
              <div className="text-sm text-gray-500 mt-1">
                JPG, PNG, GIF, WebP (最大10MB)
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

