import { useEditorStore } from '../../store/useEditorStore';
import type { EngineAPI } from './EngineAPI';
import type { AnimationTrackData } from '../../store/types';

export class StoreBridge implements EngineAPI {
  private readonly timeCallbacks = new Set<(time: number) => void>();
  private readonly playCallbacks = new Set<(playing: boolean) => void>();
  private readonly selectionCallbacks = new Set<
    (boneName: string | null) => void
  >();
  private readonly modelLoadedCallbacks = new Set<() => void>();
  private readonly modelDisposedCallbacks = new Set<() => void>();
  private readonly resizeCallbacks = new Set<
    (width: number, height: number) => void
  >();

  private unsubscribes: (() => void)[] = [];

  constructor() {
    this.setupStoreSubscriptions();
  }

  private setupStoreSubscriptions(): void {
    const unsubTime = useEditorStore.subscribe(
      (state) => state.currentTime,
      (time) => this.timeCallbacks.forEach((cb) => cb(time)),
    );

    const unsubPlay = useEditorStore.subscribe(
      (state) => state.playing,
      (playing) => this.playCallbacks.forEach((cb) => cb(playing)),
    );

    const unsubSelection = useEditorStore.subscribe(
      (state) => state.selectedBoneName,
      (boneName) => this.selectionCallbacks.forEach((cb) => cb(boneName)),
    );

    this.unsubscribes.push(unsubTime, unsubPlay, unsubSelection);
  }

  public get currentTime(): number {
    return useEditorStore.getState().currentTime;
  }

  public get playing(): boolean {
    return useEditorStore.getState().playing;
  }

  public get selectedBoneName(): string | null {
    return useEditorStore.getState().selectedBoneName;
  }

  public get tracks(): Record<string, AnimationTrackData> {
    return useEditorStore.getState().tracks;
  }

  public get fps(): number {
    return useEditorStore.getState().fps;
  }

  public get startFrame(): number {
    return useEditorStore.getState().startFrame;
  }

  public get endFrame(): number {
    return useEditorStore.getState().endFrame;
  }

  public async loadModel(url: string): Promise<void> {
    const store = useEditorStore.getState();
    store.addEntity({
      id: 'vrm-main',
      name: 'VRM Model',
      type: 'vrm',
      assetUrl: url,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
  }

  public setTime(time: number): void {
    useEditorStore.getState().setCurrentTime(time);
  }

  public setPlaying(playing: boolean): void {
    useEditorStore.getState().setPlaying(playing);
  }

  public selectBone(boneName: string | null): void {
    useEditorStore.getState().selectBone(boneName);
  }

  public setTracks(): void {
    // Tracks are read directly from store state in tick()
    // This method reserved for future track mutation commands
  }

  public onTimeChanged(callback: (time: number) => void): () => void {
    this.timeCallbacks.add(callback);
    return () => this.timeCallbacks.delete(callback);
  }

  public onPlayStateChanged(callback: (playing: boolean) => void): () => void {
    this.playCallbacks.add(callback);
    return () => this.playCallbacks.delete(callback);
  }

  public onSelectionChanged(callback: (boneName: string | null) => void): void {
    this.selectionCallbacks.add(callback);
  }

  public onModelLoaded(callback: () => void): () => void {
    this.modelLoadedCallbacks.add(callback);
    return () => this.modelLoadedCallbacks.delete(callback);
  }

  public onModelDisposed(callback: () => void): () => void {
    this.modelDisposedCallbacks.add(callback);
    return () => this.modelDisposedCallbacks.delete(callback);
  }

  public onResize(
    callback: (width: number, height: number) => void,
  ): () => void {
    this.resizeCallbacks.add(callback);
    return () => this.resizeCallbacks.delete(callback);
  }

  public emitModelLoaded(): void {
    this.modelLoadedCallbacks.forEach((cb) => cb());
  }

  public emitModelDisposed(): void {
    this.modelDisposedCallbacks.forEach((cb) => cb());
  }

  public emitResize(width: number, height: number): void {
    this.resizeCallbacks.forEach((cb) => cb(width, height));
  }

  public dispose(): void {
    this.unsubscribes.forEach((unsub) => unsub());
    this.unsubscribes = [];
    this.timeCallbacks.clear();
    this.playCallbacks.clear();
    this.selectionCallbacks.clear();
    this.modelLoadedCallbacks.clear();
    this.modelDisposedCallbacks.clear();
    this.resizeCallbacks.clear();
  }
}
