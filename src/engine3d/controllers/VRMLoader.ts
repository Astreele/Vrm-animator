import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  VRMLoaderPlugin,
  MToonMaterialLoaderPlugin,
  VRM,
} from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';

export class VRMLoader {
  private loader: GLTFLoader;

  constructor() {
    this.loader = new GLTFLoader();

    // Register WebGPU compatible VRM plugins
    this.loader.register((parser) => {
      const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {
        materialType: MToonNodeMaterial,
      });
      return new VRMLoaderPlugin(parser, { mtoonMaterialPlugin });
    });
  }

  public async load(url: string): Promise<VRM> {
    try {
      const gltf = await this.loader.loadAsync(url, (progress) => {
        const percentage = (100.0 * (progress.loaded / progress.total)).toFixed(
          2,
        );
        console.log(`Loading model... ${percentage}%`);
      });

      return gltf.userData.vrm as VRM;
    } catch (error) {
      console.error(`Failed to load VRM model from ${url}:`, error);
      throw error;
    }
  }
}
