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
    if (error.message.includes('AI') || error.message.includes('OpenAI') || error.message.includes('Claude') || error.message.includes('Gemini')) {
      // Gemini APIのエラーの場合、より詳細な情報を提供
      if (error.message.includes('Gemini')) {
        // APIキー関連のエラー
        if (error.message.includes('API_KEY') || error.message.includes('401') || error.message.includes('403')) {
          return {
            type: ErrorType.AI_GENERATION_ERROR,
            message: 'Gemini APIキーが無効です。APIキーが正しく設定されているか確認してください。',
            originalError: error,
            details: { api: 'gemini' },
          }
        }
        // モデル関連のエラー
        if (error.message.includes('404') || error.message.includes('model')) {
          return {
            type: ErrorType.AI_GENERATION_ERROR,
            message: 'Gemini APIのモデルが見つかりません。モデル名を確認してください。',
            originalError: error,
            details: { api: 'gemini' },
          }
        }
        // レート制限
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
          return {
            type: ErrorType.AI_GENERATION_ERROR,
            message: 'Gemini APIのレート制限に達しました。しばらく時間をおいてから再度お試しください。',
            originalError: error,
            details: { api: 'gemini' },
          }
        }
        // その他のGeminiエラー
        return {
          type: ErrorType.AI_GENERATION_ERROR,
          message: `Gemini APIエラー: ${error.message}`,
          originalError: error,
          details: { api: 'gemini' },
        }
      }
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


