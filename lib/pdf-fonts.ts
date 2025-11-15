/**
 * PDF用日本語フォントの登録
 * react-pdf/rendererで使用するフォントを登録します
 * 
 * 注意: 現在はフォント登録をスキップし、デフォルトフォントを使用します
 * 日本語フォントが必要な場合は、フォントファイルをプロジェクトに含める必要があります
 */

import { Font } from '@react-pdf/renderer'

// フォント登録の状態を追跡
let fontRegistered = false

/**
 * 日本語フォントを登録します
 * この関数は複数回呼び出されても、一度だけフォントを登録します
 * 
 * 現在はフォント登録をスキップしています（URLが404エラーになるため）
 */
export function registerJapaneseFont(): void {
  if (fontRegistered) {
    return
  }

  // 一時的にフォント登録をスキップ
  // フォントファイルをプロジェクトに含めるか、正しいURLを取得する必要があります
  console.log('フォント登録をスキップします（デフォルトフォントを使用）')
  fontRegistered = false
  return

  // 以下のコードは、正しいフォントURLが取得できた場合に使用します
  /*
  try {
    Font.register({
      family: 'NotoSansJP',
      fonts: [
        {
          src: '正しいフォントURL',
          fontWeight: 400,
        },
        {
          src: '正しいフォントURL',
          fontWeight: 700,
        },
      ],
    })
    fontRegistered = true
    console.log('Japanese font registered successfully')
  } catch (error) {
    console.warn('Failed to register Japanese font:', error)
  }
  */
}

/**
 * フォントファミリー名を取得します
 */
export function getFontFamily(): string {
  // デフォルトのHelveticaを使用
  // 注意: Helveticaは日本語を正しく表示できませんが、PDFは生成されます
  return 'Helvetica'
}
