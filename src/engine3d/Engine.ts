import * as THREE from 'three/webgpu';
import { VRMHumanBoneName } from '@pixiv/three-vrm';
import { EventBus } from '../core/engine/EventBus';
import { shallow } from 'zustand/shallow';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { SelectionSystem } from './systems/SelectionSystem';
import { RendererSystem } from './systems/RendererSystem';
import { SceneSystem } from './systems/SceneSystem';
import { CameraSystem } from './systems/CameraSystem';
import { InputSystem } from './systems/InputSystem';
import { VRMSystem } from './systems/VRMSystem';
import { useEditorStore } from '../store/useEditorStore';

export interface EngineConfig {
  backgroundColor?: string | number;
  fogNear?: number;
  fogFar?: number;
}

export class Engine {
  private readonly clock: THREE.Clock;
  private readonly events: EventBus;

  private readonly rendererSystem: RendererSystem;
  private readonly sceneSystem: SceneSystem;
  private readonly cameraSystem: CameraSystem;
  private readonly inputSystem: InputSystem;
  private readonly vrmSystem: VRMSystem;
  private readonly selectionSystem: SelectionSystem;
  private transformGizmo?: TransformControls;
  private storeUnsubscribes: (() => void)[] = [];
  private resizeObserver?: ResizeObserver;
  private isDisposed: boolean = false;
  private gizmoDragging = false;

  constructor(container: HTMLDivElement, config: EngineConfig = {}) {
    this.clock = new THREE.Clock();
    this.events = new EventBus();

    this.rendererSystem = new RendererSystem(container, this.events);
    this.sceneSystem = new SceneSystem(config);
    this.cameraSystem = new CameraSystem(
      container,
      this.rendererSystem.renderer.domElement,
      this.events,
    );
    this.inputSystem = new InputSystem(container, this.events);
    this.vrmSystem = new VRMSystem(this.events);
    this.selectionSystem = new SelectionSystem(this.events);
    this.setupGizmo();
    this.setupResizeObserver(container);
    this.bindEvents();
    this.bindStoreSubscriptions();
  }

  private setupResizeObserver(container: HTMLDivElement): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.events.emit('resize', { width, height });
      }
    });
    this.resizeObserver.observe(container);
  }

  private bindEvents(): void {
    this.events.on('vrm:loaded', ({ vrm }) => {
      this.sceneSystem.addVRM(vrm);
      this.selectionSystem.setModel(vrm);
    });

    this.events.on('input:down', ({ x, y }) => {
      if (!this.transformGizmo?.object) {
        this.selectionSystem.pick(
          { x, y },
          this.cameraSystem.controller.camera,
        );
        return;
      }

      if (this.gizmoDragging) {
        return;
      }

      requestAnimationFrame(() => {
        if (this.gizmoDragging) return;
        this.selectionSystem.pick(
          { x, y },
          this.cameraSystem.controller.camera,
        );
      });
    });

    this.events.on('engine:boneSelected', ({ boneName }) => {
      const store = useEditorStore.getState();
      store.selectBone(boneName);

      if (boneName) {
        const vrm = this.vrmSystem.currentVrm;
        const boneNode = vrm?.humanoid?.getNormalizedBoneNode(
          boneName as VRMHumanBoneName,
        );
        if (boneNode) {
          this.transformGizmo?.attach(boneNode);
        }
      } else {
        this.transformGizmo?.detach();
      }
    });

    this.events.on('vrm:disposed', () => {
      if (this.vrmSystem.currentVrm) {
        this.sceneSystem.removeVRM(this.vrmSystem.currentVrm);
      }
    });
  }

  public async start(): Promise<void> {
    await this.rendererSystem.init();
    if (this.isDisposed) return;
    this.rendererSystem.renderer.setAnimationLoop(() => this.tick());
  }

  public async loadModel(url: string): Promise<void> {
    await this.vrmSystem.load(url);
  }

  private setupGizmo(): void {
    const camera = this.cameraSystem.controller.camera;
    const domElement = this.rendererSystem.renderer.domElement;

    this.transformGizmo = new TransformControls(camera, domElement);
    this.transformGizmo.setMode('rotate');

    this.transformGizmo.getRaycaster().params.Line.threshold = 4;
    this.transformGizmo.addEventListener('dragging-changed', (event) => {
      const value = (event as { value: boolean }).value;
      this.gizmoDragging = value;
      this.cameraSystem.controller.setEnabled(!value);
    });

    this.sceneSystem.scene.add(this.transformGizmo.getHelper());
  }

  private bindStoreSubscriptions(): void {
    const unsubTime = useEditorStore.subscribe(
      (state) => state.currentTime,
      (time) => this.events.emit('engine:timeChanged', { time }),
    );
    const unsubPlay = useEditorStore.subscribe(
      (state) => state.playing,
      (playing) => this.events.emit('engine:playStateChanged', { playing }),
    );
    const unsubSelection = useEditorStore.subscribe(
      (state) => ({
        id: state.selectedEntityId,
        bone: state.selectedBoneName,
      }),
      (selection) =>
        this.events.emit('engine:selectionChanged', {
          entityId: selection.id,
          boneName: selection.bone,
        }),
      { equalityFn: shallow },
    );
    this.storeUnsubscribes.push(unsubTime, unsubPlay, unsubSelection);
  }

  private tick(): void {
    const delta = this.clock.getDelta();
    const store = useEditorStore.getState();
    const { playing, currentTime, fps, tracks } = store;
    let targetTime = currentTime;

    if (playing) {
      targetTime += delta;

      const { endFrame, startFrame } = store;
      const maxTime = endFrame / fps;
      const minTime = startFrame / fps;
      if (targetTime > maxTime) targetTime = minTime;

      store.setCurrentTime(targetTime);
    }

    this.cameraSystem.update();
    this.vrmSystem.update(delta, targetTime, tracks);
    this.sceneSystem.updateGrid(this.cameraSystem.controller.camera.position);

    this.rendererSystem.render(
      this.sceneSystem.scene,
      this.cameraSystem.controller.camera,
    );
  }

  public dispose(): void {
    this.isDisposed = true;
    this.storeUnsubscribes.forEach((unsub) => unsub());
    this.resizeObserver?.disconnect();

    if (this.transformGizmo) {
      this.sceneSystem.scene.remove(this.transformGizmo.getHelper());
      this.transformGizmo.dispose();
    }

    this.events.emit('vrm:disposed', undefined);
    this.selectionSystem.dispose();
    this.vrmSystem.dispose();
    this.inputSystem.dispose();
    this.cameraSystem.dispose();
    this.sceneSystem.dispose();
    this.rendererSystem.dispose();
    this.events.clear();
  }
}
