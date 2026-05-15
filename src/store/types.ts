export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface QuaternionData {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type InterpolationType = 'linear' | 'bezier' | 'step';

export interface KeyframeData {
  time: number;
  value: QuaternionData | Vector3Data | number;
  interpolation: InterpolationType;
}

export interface AnimationTrackData {
  id: string;
  targetPath: string; // e.g., "hips.quaternion", "blendShapes.happy"
  keyframes: KeyframeData[];
}

export interface EntityData {
  id: string;
  name: string;
  type: 'vrm' | 'light' | 'camera';
  assetUrl?: string;
  position: Vector3Data;
  rotation: QuaternionData;
}

export interface TimelineState {
  currentTime: number;
  playing: boolean;
  startFrame: number;
  endFrame: number;
  fps: number;
}

export interface SelectionState {
  selectedEntityId: string | null;
  selectedBoneName: string | null;
}
