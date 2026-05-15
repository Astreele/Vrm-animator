import { VRM } from '@pixiv/three-vrm';

export type EngineEventMap = {
  'vrm:loaded': { vrm: VRM };
  'vrm:disposed': undefined;
  resize: { width: number; height: number };
  'engine:timeChanged': { time: number };
  'engine:playStateChanged': { playing: boolean };
  'engine:selectionChanged': {
    entityId: string | null;
    boneName: string | null;
  };
  'input:down': { x: number; y: number; button: number };
  'engine:boneSelected': { boneName: string | null };
};

type Listener<T> = (data: T) => void;

export class EventBus {
  private listeners: Map<keyof EngineEventMap, Set<Listener<unknown>>> =
    new Map();

  public on<K extends keyof EngineEventMap>(
    event: K,
    callback: Listener<EngineEventMap[K]>,
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Listener<unknown>);
  }

  public off<K extends keyof EngineEventMap>(
    event: K,
    callback: Listener<EngineEventMap[K]>,
  ): void {
    this.listeners.get(event)?.delete(callback as Listener<unknown>);
  }

  public emit<K extends keyof EngineEventMap>(
    event: K,
    data: EngineEventMap[K],
  ): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  public clear(): void {
    this.listeners.clear();
  }
}
