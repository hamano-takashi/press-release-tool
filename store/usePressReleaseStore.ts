import { create } from 'zustand'
import { PressRelease, EditorMode, GuidedCreationState, AIGenerationState, UIState, AIType } from '@/types'
import { generateId } from '@/lib/utils'
import { saveDraft, getDraftById } from '@/lib/storage'

interface PressReleaseStore {
  // 状態
  currentPressRelease: PressRelease | null
  mode: EditorMode
  guidedCreation: GuidedCreationState
  aiGeneration: AIGenerationState
  ui: UIState
  selectedAI: AIType // 選択されたAIタイプ

  // アクション
  setCurrentPressRelease: (pressRelease: PressRelease | null) => void
  updatePressRelease: (updates: Partial<PressRelease>) => void
  setMode: (mode: EditorMode) => void
  setGuidedCreation: (state: Partial<GuidedCreationState>) => void
  setAIGeneration: (state: Partial<AIGenerationState>) => void
  setUI: (state: Partial<UIState>) => void
  setSelectedAI: (ai: AIType) => void
  
  // 下書き操作
  saveCurrentDraft: () => void
  loadDraft: (id: string) => void
  createNewPressRelease: () => void
}

const initialPressRelease: PressRelease = {
  id: generateId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  releaseDate: new Date(),
  title: '',
  introduction: '',
  sections: [],
  additionalImages: [],
  contact: {
    name: '',
    phone: '',
    email: '',
  },
}

export const usePressReleaseStore = create<PressReleaseStore>((set, get) => ({
  // 初期状態
  currentPressRelease: null,
  mode: 'normal',
  guidedCreation: {
    currentStep: 0,
    answers: {},
    isGenerating: false,
  },
  aiGeneration: {
    isGenerating: false,
    proposals: [],
    selectedProposal: null,
  },
  ui: {
    sidebarOpen: true,
    previewMode: 'desktop',
  },
  selectedAI: 'auto',

  // アクション
  setCurrentPressRelease: (pressRelease) => {
    set({ currentPressRelease: pressRelease })
  },

  updatePressRelease: (updates) => {
    const current = get().currentPressRelease
    if (!current) return

    const updated: PressRelease = {
      ...current,
      ...updates,
      updatedAt: new Date(),
    }
    set({ currentPressRelease: updated })
  },

  setMode: (mode) => {
    set({ mode })
  },

  setGuidedCreation: (state) => {
    set((prev) => ({
      guidedCreation: { ...prev.guidedCreation, ...state },
    }))
  },

  setAIGeneration: (state) => {
    set((prev) => ({
      aiGeneration: { ...prev.aiGeneration, ...state },
    }))
  },

  setUI: (state) => {
    set((prev) => ({
      ui: { ...prev.ui, ...state },
    }))
  },

  setSelectedAI: (ai) => {
    set({ selectedAI: ai })
  },

  saveCurrentDraft: () => {
    const current = get().currentPressRelease
    if (!current) return
    saveDraft(current)
  },

  loadDraft: (id) => {
    const draft = getDraftById(id)
    if (draft) {
      set({ currentPressRelease: draft })
    }
  },

  createNewPressRelease: () => {
    const newPressRelease: PressRelease = {
      ...initialPressRelease,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set({ currentPressRelease: newPressRelease, mode: 'normal' })
  },
}))

