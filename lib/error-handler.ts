/**
 * エラーハンドリングユーティリティ
 * ユーザーフレンドリーなエラーメッセージを生成
 */

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_GENERATION_ERROR = 'AI_GENERATION_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  FILE_ERROR = 'FILE_ERROR',
}

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
  details?: Record<string, any>
}

/**
 * エラーをAppErrorに変換
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof Error) {
    // ネットワークエラーの検出
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        originalError: error,
      }
    }

    // APIエラーの検出
    if (error.message.includes('API') || error.message.includes('500') || error.message.includes('400')) {
      return {
        type: ErrorType.API_ERROR,
        message: 'サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。',
        originalError: error,
      }
    }

    // AI生成エラーの検出
    if (error.message.includes('AI') || error.message.includes('OpenAI') || error.message.includes('Claude')) {
      return {
        type: ErrorType.AI_GENERATION_ERROR,
        message: 'AI生成に失敗しました。APIキーが正しく設定されているか確認してください。',
        originalError: error,
      }
    }

    // エクスポートエラーの検出
    if (error.message.includes('PDF') || error.message.includes('Word') || error.message.includes('export')) {
      return {
        type: ErrorType.EXPORT_ERROR,
        message: 'ファイルの出力に失敗しました。ブラウザのコンソールを確認してください。',
        originalError: error,
      }
    }

    // ファイルエラーの検出
    if (error.message.includes('file') || error.message.includes('image') || error.message.includes('upload')) {
      return {
        type: ErrorType.FILE_ERROR,
        message: 'ファイルの処理に失敗しました。ファイル形式とサイズを確認してください。',
        originalError: error,
      }
    }

    // その他のエラー
    return {
      type: ErrorType.API_ERROR,
      message: error.message || '予期しないエラーが発生しました。',
      originalError: error,
    }
  }

  // 不明なエラー
  return {
    type: ErrorType.API_ERROR,
    message: '予期しないエラーが発生しました。',
  }
}

/**
 * ユーザーフレンドリーなエラーメッセージを取得
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.VALIDATION_ERROR:
      return error.message || '入力内容に誤りがあります。確認してください。'
    case ErrorType.NETWORK_ERROR:
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    case ErrorType.API_ERROR:
      return error.message || 'サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。'
    case ErrorType.AI_GENERATION_ERROR:
      return error.message || 'AI生成に失敗しました。APIキーが正しく設定されているか確認してください。'
    case ErrorType.EXPORT_ERROR:
      return error.message || 'ファイルの出力に失敗しました。ブラウザのコンソールを確認してください。'
    case ErrorType.FILE_ERROR:
      return error.message || 'ファイルの処理に失敗しました。ファイル形式とサイズを確認してください。'
    default:
      return error.message || '予期しないエラーが発生しました。'
  }
}

/**
 * エラーログを記録（開発環境のみ）
 */
export function logError(error: AppError): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      type: error.type,
      message: error.message,
      originalError: error.originalError,
      details: error.details,
    })
  }
}


