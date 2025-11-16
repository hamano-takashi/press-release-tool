'use client'

import { useState, useRef, useEffect } from 'react'
import { ImageData } from '@/types'
import { resizeImage, cropImage, getImageSize } from '@/lib/image-utils'
import Button from '@/components/Button'

interface ImageEditorProps {
  image: ImageData
  onSave: (editedImage: ImageData) => void
  onCancel: () => void
}

type EditMode = 'resize' | 'crop' | 'position'

export default function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
  const [editMode, setEditMode] = useState<EditMode>('resize')
  const [maxWidth, setMaxWidth] = useState(image.maxWidth || image.width || 800)
  const [maxHeight, setMaxHeight] = useState(image.height || 600)
  const [position, setPosition] = useState<ImageData['position']>(image.position || 'center')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imageRef.current && editMode === 'crop') {
      const img = imageRef.current
      const rect = img.getBoundingClientRect()
      setCropArea({
        x: rect.width * 0.1,
        y: rect.height * 0.1,
        width: rect.width * 0.8,
        height: rect.height * 0.8,
      })
    }
  }, [editMode, image.url])

  const handleResize = async () => {
    setIsProcessing(true)
    try {
      const resizedBase64 = await resizeImage(image.url, maxWidth, maxHeight)
      const dimensions = await getImageSize(resizedBase64)

      onSave({
        ...image,
        url: resizedBase64,
        width: dimensions.width,
        height: dimensions.height,
        maxWidth,
      })
    } catch (error) {
      console.error('Failed to resize image:', error)
      alert('画像のリサイズに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCrop = async () => {
    if (!imageRef.current) return

    setIsProcessing(true)
    try {
      const img = imageRef.current
      const rect = img.getBoundingClientRect()
      const scaleX = img.naturalWidth / rect.width
      const scaleY = img.naturalHeight / rect.height

      const x = cropArea.x * scaleX
      const y = cropArea.y * scaleY
      const width = cropArea.width * scaleX
      const height = cropArea.height * scaleY

      const croppedBase64 = await cropImage(image.url, x, y, width, height)
      const dimensions = await getImageSize(croppedBase64)

      onSave({
        ...image,
        url: croppedBase64,
        width: dimensions.width,
        height: dimensions.height,
      })
    } catch (error) {
      console.error('Failed to crop image:', error)
      alert('画像のトリミングに失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSavePosition = () => {
    onSave({
      ...image,
      position,
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editMode !== 'crop') return
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left - cropArea.x,
      y: e.clientY - rect.top - cropArea.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || editMode !== 'crop') return
    const rect = e.currentTarget.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragStart.x
    const newY = e.clientY - rect.top - dragStart.y

    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(newX, rect.width - prev.width)),
      y: Math.max(0, Math.min(newY, rect.height - prev.height)),
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">画像を編集</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* 編集モード選択 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setEditMode('resize')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editMode === 'resize'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          リサイズ
        </button>
        <button
          onClick={() => setEditMode('crop')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editMode === 'crop'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          トリミング
        </button>
        <button
          onClick={() => setEditMode('position')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editMode === 'position'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          配置
        </button>
      </div>

      {/* 画像プレビュー */}
      <div className="mb-6">
        <div
          className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={image.url}
            alt={image.filename}
            className="w-full h-auto max-h-96 object-contain"
          />
          {editMode === 'crop' && (
            <div
              className="absolute border-2 border-primary-500 bg-primary-500 bg-opacity-20 cursor-move"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`,
              }}
            >
              <div className="absolute top-0 left-0 w-3 h-3 border-2 border-primary-500 bg-white -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-2 border-primary-500 bg-white translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-2 border-primary-500 bg-white -translate-x-1/2 translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-primary-500 bg-white translate-x-1/2 translate-y-1/2"></div>
            </div>
          )}
        </div>
      </div>

      {/* 編集コントロール */}
      {editMode === 'resize' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大幅 (px)
            </label>
            <input
              type="number"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              min={100}
              max={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              最大高さ (px)
            </label>
            <input
              type="number"
              value={maxHeight}
              onChange={(e) => setMaxHeight(Number(e.target.value))}
              min={100}
              max={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <Button onClick={handleResize} disabled={isProcessing}>
            {isProcessing ? '処理中...' : 'リサイズを適用'}
          </Button>
        </div>
      )}

      {editMode === 'crop' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            トリミング領域をドラッグして移動できます
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={Math.round(cropArea.width)}
              onChange={(e) =>
                setCropArea((prev) => ({ ...prev, width: Number(e.target.value) }))
              }
              placeholder="幅"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              value={Math.round(cropArea.height)}
              onChange={(e) =>
                setCropArea((prev) => ({ ...prev, height: Number(e.target.value) }))
              }
              placeholder="高さ"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <Button onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? '処理中...' : 'トリミングを適用'}
          </Button>
        </div>
      )}

      {editMode === 'position' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              配置位置
            </label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    position === pos
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pos === 'left' ? '左' : pos === 'center' ? '中央' : '右'}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSavePosition}>配置を適用</Button>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </div>
  )
}

