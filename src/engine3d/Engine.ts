import * as THREE from 'three/webgpu';
import { VRMHumanBoneName } from '@pixiv/three-vrm';
import { EventBus } from '../core/engine/EventBus';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { SelectionSystem } from './systems/SelectionSystem';
import { RendererSystem } from './systems/RendererSystem';
import { SceneSystem } from './systems/SceneSystem';
import { CameraSystem } from './systems/CameraSystem';
import { InputSystem } from './systems/InputSystem';
import { VRMSystem } from './systems/VRMSystem';
import type { EngineAPI } from '../core/engine/EngineAPI';

export interface EngineConfig {
  backgroundColor?: string | number;
  fogNear?: number;
  fogFar?: number;
}

export class Engine {
  private readonly clock: THREE.Clock;
  private readonly events: EventBus;
  private readonly api: EngineAPI;

  private readonly rendererSystem: RendererSystem;
  private readonly sceneSystem: SceneSystem;
  private readonly cameraSystem: CameraSystem;
  private readonly inputSystem: InputSystem;
  private readonly vrmSystem: VRMSystem;
  private readonly selectionSystem: SelectionSystem;
  private transformGizmo?: TransformControls;
  private apiUnsubscribes: (() => void)[] = [];
  private resizeObserver?: ResizeObserver;
  private isDisposed: boolean = false;
  private gizmoDragging: boolean = false;

  constructor(
    container: HTMLDivElement,
    api: EngineAPI,
    config: EngineConfig = {},
  ) {
    this.clock = new THREE.Clock();
    this.events = new EventBus();
    this.api = api;

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
    this.bindAPISubscriptions();
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
      this.api.selectBone(boneName);

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
    await this.api.loadModel(url);
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

  private bindAPISubscriptions(): void {
    const unsubTime = this.api.onTimeChanged((time) =>
      this.events.emit('engine:timeChanged', { time }),
    );
    const unsubPlay = this.api.onPlayStateChanged((playing) =>
      this.events.emit('engine:playStateChanged', { playing }),
    );
    this.api.onSelectionChanged((boneName) =>
      this.events.emit('engine:selectionChanged', {
        entityId: null,
        boneName,
      }),
    );
    this.apiUnsubscribes.push(unsubTime, unsubPlay);
  }

  private tick(): void {
    const delta = this.clock.getDelta();
    const playing = this.api.playing;
    let targetTime = this.api.currentTime;

    if (playing) {
      targetTime += delta;

      const fps = this.api.fps;
      const startFrame = this.api.startFrame;
      const endFrame = this.api.endFrame;
      const maxTime = endFrame / fps;
      const minTime = startFrame / fps;
      if (targetTime > maxTime) targetTime = minTime;

      this.api.setTime(targetTime);
    }

    this.cameraSystem.update();
    this.vrmSystem.update(delta, targetTime, this.api.tracks);
    this.sceneSystem.updateGrid(this.cameraSystem.controller.camera.position);

    this.rendererSystem.render(
      this.sceneSystem.scene,
      this.cameraSystem.controller.camera,
    );
  }

  public dispose(): void {
    this.isDisposed = true;
    this.apiUnsubscribes.forEach((unsub) => unsub());
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
