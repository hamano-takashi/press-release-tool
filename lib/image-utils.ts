/**
 * 画像処理ユーティリティ関数
 * リサイズ、トリミング、変換などの機能を提供
 */

/**
 * 画像をリサイズします
 * @param base64 - Base64エンコードされた画像
 * @param maxWidth - 最大幅（px）
 * @param maxHeight - 最大高さ（px）
 * @param quality - JPEG品質（0-1、デフォルト: 0.9）
 */
export async function resizeImage(
  base64: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // アスペクト比を維持しながらリサイズ
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const resizedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(resizedBase64)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = base64
  })
}

/**
 * 画像をトリミングします
 * @param base64 - Base64エンコードされた画像
 * @param x - 開始X座標
 * @param y - 開始Y座標
 * @param width - トリミング幅
 * @param height - トリミング高さ
 */
export async function cropImage(
  base64: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      ctx.drawImage(img, x, y, width, height, 0, 0, width, height)
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9)
      resolve(croppedBase64)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = base64
  })
}

/**
 * 画像のアスペクト比を計算します
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height
}

/**
 * Base64画像のサイズを取得します
 */
export async function getImageSize(base64: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = base64
  })
}

/**
 * Base64画像のファイルサイズを計算します（概算）
 */
export function estimateBase64Size(base64: string): number {
  // Base64は元のファイルサイズの約1.33倍
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  return Math.round((base64Data.length * 3) / 4)
}

