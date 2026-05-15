import { type StateCreator } from 'zustand';
import type { SelectionState } from '../types';

export interface SelectionActions {
  selectEntity: (id: string | null) => void;
  selectBone: (boneName: string | null) => void;
}

export type SelectionSlice = SelectionState & SelectionActions;

export const createSelectionSlice: StateCreator<SelectionSlice> = (set) => ({
  selectedEntityId: null,
  selectedBoneName: null,
  selectEntity: (id) => set({ selectedEntityId: id, selectedBoneName: null }),
  selectBone: (boneName) => set({ selectedBoneName: boneName }),
});
