/**
 * PDF生成クライアント
 * プレスリリースデータからPDFを生成し、ダウンロードします
 */

'use client'

import React from 'react'
import { PDFDocument } from '@/lib/pdf-generator'
import { PressRelease } from '@/types'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { registerJapaneseFont } from './pdf-fonts'
import { toAppError, getUserFriendlyMessage } from './error-handler'

// PDF生成のタイムアウト時間（ミリ秒）
const PDF_GENERATION_TIMEOUT = 60000

/**
 * PDFを生成してダウンロードします
 * @param pressRelease - プレスリリースデータ
 * @throws {Error} PDF生成に失敗した場合
 */
export async function generatePDF(pressRelease: PressRelease): Promise<void> {
  console.log('PDF生成を開始します', { pressRelease })
  
  // フォントを登録（確実に実行されるように）
  try {
    registerJapaneseFont()
    console.log('フォント登録完了')
  } catch (error) {
    console.warn('フォント登録でエラーが発生しましたが、続行します:', error)
  }

  try {
    console.log('PDFドキュメントを作成中...')
    // PDFドキュメントを作成
    const doc = <PDFDocument pressRelease={pressRelease} />
    console.log('PDFドキュメント作成完了')
    
    console.log('PDFを生成中...')
    // PDFを生成（タイムアウトを設定）
    const pdfBlob = await Promise.race([
      pdf(doc).toBlob(),
      new Promise<Blob>((_, reject) => 
        setTimeout(() => reject(new Error('PDF生成がタイムアウトしました（60秒）')), PDF_GENERATION_TIMEOUT)
      )
    ])
    console.log('PDF生成完了', { blobSize: pdfBlob.size })
    
    // ファイル名を生成
    const filename = generateFilename(pressRelease)
    console.log('ファイル名:', filename)
    
    // PDFをダウンロード
    console.log('PDFをダウンロード中...')
    saveAs(pdfBlob, filename)
    console.log('PDFダウンロード完了')
  } catch (error) {
    console.error('PDF generation error:', error)
    
    // エラーハンドリングを使用
    const appError = toAppError(error)
    const errorMessage = getUserFriendlyMessage(appError)
    console.error('エラーメッセージ:', errorMessage)
    throw new Error(errorMessage)
  }
}

/**
 * ファイル名を生成します
 */
function generateFilename(pressRelease: PressRelease): string {
  const timestamp = pressRelease.id || Date.now()
  const sanitizedTitle = pressRelease.title
    ? pressRelease.title.replace(/[^\w\s-]/g, '').substring(0, 30)
    : 'press-release'
  
  return `${sanitizedTitle}-${timestamp}.pdf`
}



