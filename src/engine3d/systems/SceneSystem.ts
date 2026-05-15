import * as THREE from 'three/webgpu';
import { VRM } from '@pixiv/three-vrm';
import type { EngineConfig } from '../Engine';

export class SceneSystem {
  public readonly scene: THREE.Scene;
  private gridHelper?: THREE.GridHelper;
  private axesHelper?: THREE.AxesHelper;

  constructor(config: EngineConfig) {
    this.scene = new THREE.Scene();
    this.setupEnvironment(config);
    this.setupLighting();
  }

  private setupEnvironment(config: EngineConfig): void {
    const bgColor = config.backgroundColor ?? '#333333';
    const backgroundColor = new THREE.Color(bgColor);

    this.scene.background = backgroundColor;
    this.scene.fog = new THREE.Fog(
      backgroundColor,
      config.fogNear ?? 50,
      config.fogFar ?? 100,
    );

    this.gridHelper = new THREE.GridHelper(200, 200, 0x888888, 0x444444);
    this.axesHelper = new THREE.AxesHelper(200);
    this.scene.add(this.gridHelper, this.axesHelper);
  }

  private setupLighting(): void {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(3, 5, 2);
    this.scene.add(dirLight);
  }

  public addVRM(vrm: VRM): void {
    this.scene.add(vrm.scene);
  }

  public removeVRM(vrm: VRM): void {
    this.scene.remove(vrm.scene);
    this.disposeObject(vrm.scene);
  }

  public updateGrid(cameraPosition: THREE.Vector3): void {
    if (!this.gridHelper) return;
    this.gridHelper.position.x = Math.floor(cameraPosition.x);
    this.gridHelper.position.z = Math.floor(cameraPosition.z);
  }

  private disposeObject(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry?.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          for (const mat of materials) {
            for (const key of Object.keys(mat)) {
              const val = (mat as Record<string, unknown>)[key];
              if (val instanceof THREE.Texture) val.dispose();
            }
            mat.dispose();
          }
        }
      }
    });
  }

  public dispose(): void {
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      this.gridHelper.dispose();
    }
    if (this.axesHelper) {
      this.scene.remove(this.axesHelper);
      this.axesHelper.dispose();
    }
  }
}
