/**
 * テンプレート管理機能
 * プレスリリースのテンプレートを管理するための関数
 */

import { Template, PressRelease } from '@/types'
import { generateId } from './utils'

const TEMPLATES_STORAGE_KEY = 'press-release-templates'

/**
 * デフォルトテンプレートを取得
 */
export function getDefaultTemplates(): Template[] {
  return [
    {
      id: 'standard',
      name: '標準テンプレート',
      description: '一般的なプレスリリース用の標準的なテンプレートです',
      category: 'standard',
      isDefault: true,
      pressRelease: {
        releaseDate: new Date(),
        title: '',
        introduction: '',
        sections: [
          {
            id: generateId(),
            type: 'background',
            title: '背景',
            content: '',
            order: 0,
          },
          {
            id: generateId(),
            type: 'development',
            title: '開発経緯',
            content: '',
            order: 1,
          },
        ],
        additionalImages: [],
        contact: {
          name: '',
          phone: '',
          email: '',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'product',
      name: '商品リリース用テンプレート',
      description: '新商品のリリースに適したテンプレートです',
      category: 'product',
      isDefault: true,
      pressRelease: {
        releaseDate: new Date(),
        title: '',
        introduction: '',
        sections: [
          {
            id: generateId(),
            type: 'background',
            title: '商品概要',
            content: '',
            order: 0,
          },
          {
            id: generateId(),
            type: 'custom',
            title: '主な特徴',
            content: '',
            order: 1,
          },
          {
            id: generateId(),
            type: 'development',
            title: '開発の背景',
            content: '',
            order: 2,
          },
        ],
        additionalImages: [],
        contact: {
          name: '',
          phone: '',
          email: '',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'service',
      name: 'サービスリリース用テンプレート',
      description: '新サービスのリリースに適したテンプレートです',
      category: 'service',
      isDefault: true,
      pressRelease: {
        releaseDate: new Date(),
        title: '',
        introduction: '',
        sections: [
          {
            id: generateId(),
            type: 'background',
            title: 'サービス概要',
            content: '',
            order: 0,
          },
          {
            id: generateId(),
            type: 'custom',
            title: '主な機能',
            content: '',
            order: 1,
          },
          {
            id: generateId(),
            type: 'custom',
            title: '利用方法',
            content: '',
            order: 2,
          },
          {
            id: generateId(),
            type: 'development',
            title: '開発の背景',
            content: '',
            order: 3,
          },
        ],
        additionalImages: [],
        contact: {
          name: '',
          phone: '',
          email: '',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'event',
      name: 'イベント告知用テンプレート',
      description: 'イベントの告知に適したテンプレートです',
      category: 'event',
      isDefault: true,
      pressRelease: {
        releaseDate: new Date(),
        title: '',
        introduction: '',
        sections: [
          {
            id: generateId(),
            type: 'background',
            title: 'イベント概要',
            content: '',
            order: 0,
          },
          {
            id: generateId(),
            type: 'custom',
            title: '開催日時・場所',
            content: '',
            order: 1,
          },
          {
            id: generateId(),
            type: 'custom',
            title: '参加方法',
            content: '',
            order: 2,
          },
          {
            id: generateId(),
            type: 'development',
            title: '開催の背景',
            content: '',
            order: 3,
          },
        ],
        additionalImages: [],
        contact: {
          name: '',
          phone: '',
          email: '',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
}

/**
 * ローカルストレージからカスタムテンプレートを取得
 */
export function getCustomTemplates(): Template[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load templates:', error)
    return []
  }
}

/**
 * すべてのテンプレートを取得（デフォルト + カスタム）
 */
export function getAllTemplates(): Template[] {
  const defaultTemplates = getDefaultTemplates()
  const customTemplates = getCustomTemplates()
  return [...defaultTemplates, ...customTemplates]
}

/**
 * IDでテンプレートを取得
 */
export function getTemplateById(id: string): Template | null {
  const allTemplates = getAllTemplates()
  return allTemplates.find((t) => t.id === id) || null
}

/**
 * カテゴリでテンプレートを取得
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return getAllTemplates().filter((t) => t.category === category)
}

/**
 * カスタムテンプレートを保存
 */
export function saveTemplate(template: Template): void {
  if (typeof window === 'undefined') return

  try {
    const templates = getCustomTemplates()
    const existingIndex = templates.findIndex((t) => t.id === template.id)

    if (existingIndex >= 0) {
      templates[existingIndex] = {
        ...template,
        updatedAt: new Date(),
      }
    } else {
      templates.push({
        ...template,
        id: template.id || generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error('Failed to save template:', error)
  }
}

/**
 * テンプレートを削除
 */
export function deleteTemplate(id: string): void {
  if (typeof window === 'undefined') return

  try {
    const templates = getCustomTemplates().filter((t) => t.id !== id)
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error('Failed to delete template:', error)
  }
}

/**
 * テンプレートからプレスリリースを作成
 */
export function createPressReleaseFromTemplate(template: Template): PressRelease {
  const now = new Date()
  return {
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    templateId: template.id,
    ...template.pressRelease,
  }
}

