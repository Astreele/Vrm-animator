import { type StateCreator } from 'zustand';
import { type TimelineState } from '../types';

export interface TimelineActions {
  setCurrentTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setTimelineRange: (start: number, end: number) => void;
}

export type TimelineSlice = TimelineState & TimelineActions;

export const createTimelineSlice: StateCreator<TimelineSlice> = (set) => ({
  currentTime: 0,
  playing: false,
  startFrame: 0,
  endFrame: 100,
  fps: 30,
  setCurrentTime: (time) => set({ currentTime: time }),
  setPlaying: (playing) => set({ playing }),
  setTimelineRange: (start, end) => set({ startFrame: start, endFrame: end }),
});
