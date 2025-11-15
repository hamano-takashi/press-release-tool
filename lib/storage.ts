import { PressRelease } from '@/types'

const STORAGE_KEY = 'press-release-drafts'

// ローカルストレージから下書き一覧を取得
export function getDrafts(): PressRelease[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load drafts:', error)
    return []
  }
}

// 下書きを保存
export function saveDraft(pressRelease: PressRelease): void {
  if (typeof window === 'undefined') return
  
  try {
    const drafts = getDrafts()
    const existingIndex = drafts.findIndex(d => d.id === pressRelease.id)
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = pressRelease
    } else {
      drafts.push(pressRelease)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch (error) {
    console.error('Failed to save draft:', error)
  }
}

// 下書きを削除
export function deleteDraft(id: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const drafts = getDrafts()
    const filtered = drafts.filter(d => d.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete draft:', error)
  }
}

// IDで下書きを取得
export function getDraftById(id: string): PressRelease | null {
  const drafts = getDrafts()
  return drafts.find(d => d.id === id) || null
}

