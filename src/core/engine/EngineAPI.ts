import type { AnimationTrackData } from '../../store/types';

export interface EngineCommands {
  loadModel: (url: string) => Promise<void>;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  selectBone: (boneName: string | null) => void;
  setTracks: () => void;
}

export interface EngineEvents {
  onTimeChanged: (callback: (time: number) => void) => () => void;
  onPlayStateChanged: (callback: (playing: boolean) => void) => () => void;
  onSelectionChanged: (callback: (boneName: string | null) => void) => void;
  onModelLoaded: (callback: () => void) => () => void;
  onModelDisposed: (callback: () => void) => () => void;
  onResize: (callback: (width: number, height: number) => void) => () => void;
}

export interface EngineStateProvider {
  get currentTime(): number;
  get playing(): boolean;
  get selectedBoneName(): string | null;
  get tracks(): Record<string, AnimationTrackData>;
  get fps(): number;
  get startFrame(): number;
  get endFrame(): number;
}

export interface EngineAPI
  extends EngineCommands, EngineEvents, EngineStateProvider {}
