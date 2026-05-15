import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  createSelectionSlice,
  type SelectionSlice,
} from './slices/selectionSlice';
import {
  createTimelineSlice,
  type TimelineSlice,
} from './slices/timelineSlice';
import { createProjectSlice, type ProjectSlice } from './slices/projectSlice';

export type EditorStoreState = SelectionSlice & TimelineSlice & ProjectSlice;

export const useEditorStore = create<EditorStoreState>()(
  subscribeWithSelector((...a) => ({
    ...createSelectionSlice(...a),
    ...createTimelineSlice(...a),
    ...createProjectSlice(...a),
  })),
);
