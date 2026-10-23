import { create } from 'zustand';
import type { AssistantMode } from './types';

interface AssistantState {
  mode: AssistantMode;
  setMode: (mode: AssistantMode) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  mode: 'ask',
  setMode: (mode) => set({ mode }),
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
