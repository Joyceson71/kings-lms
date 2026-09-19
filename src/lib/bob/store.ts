import { create } from 'zustand';
import type { BobMode } from './types';

interface BobState {
  mode: BobMode;
  setMode: (mode: BobMode) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
}

export const useBobStore = create<BobState>((set) => ({
  mode: 'ask',
  setMode: (mode) => set({ mode }),
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
