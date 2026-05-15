import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraController {
  public readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;

  constructor(container: HTMLDivElement, rendererDom: HTMLCanvasElement) {
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 1, 4);

    this.controls = new OrbitControls(this.camera, rendererDom);
    this.controls.target.set(0, 1, 0);
  }

  public update(): void {
    this.controls.update();
  }

  public handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  public dispose(): void {
    this.controls.dispose();
  }
}
