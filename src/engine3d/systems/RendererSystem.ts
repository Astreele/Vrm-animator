import * as THREE from 'three/webgpu';
import { EventBus } from '../../core/engine/EventBus';

export class RendererSystem {
  public readonly renderer: THREE.WebGPURenderer;
  private events: EventBus;

  constructor(container: HTMLDivElement, events: EventBus) {
    this.events = events;
    this.renderer = new THREE.WebGPURenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.resize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);
    this.events.on('resize', ({ width, height }) => this.resize(width, height));
  }

  public async init(): Promise<void> {
    await this.renderer.init();
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  public dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
