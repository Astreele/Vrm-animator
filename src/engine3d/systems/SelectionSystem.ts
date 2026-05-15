import * as THREE from 'three/webgpu';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import { EventBus } from '../../core/engine/EventBus';

interface BoneCache {
  name: VRMHumanBoneName;
  node: THREE.Object3D;
  size: number;
}

export class SelectionSystem {
  private raycaster = new THREE.Raycaster();
  private currentVrm?: VRM;
  private worldPosCache = new THREE.Vector3();
  private activeBones: BoneCache[] = [];
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  public setModel(vrm: VRM): void {
    this.currentVrm = vrm;
    this.activeBones = [];

    const boneNames = Object.values(VRMHumanBoneName) as VRMHumanBoneName[];

    for (let i = 0; i < boneNames.length; i++) {
      const boneName = boneNames[i];
      const node = vrm.humanoid?.getNormalizedBoneNode(boneName);

      if (!node) continue;

      let calculatedSize = 0.03;

      if (node.children.length > 0) {
        let maxChildDistance = 0;

        for (let c = 0; c < node.children.length; c++) {
          const distanceToChild = node.children[c].position.length();
          if (distanceToChild > maxChildDistance) {
            maxChildDistance = distanceToChild;
          }
        }

        if (maxChildDistance > 0) {
          calculatedSize = THREE.MathUtils.clamp(
            maxChildDistance * 0.5,
            0.01,
            0.15,
          );
        }
      }

      this.activeBones.push({
        name: boneName,
        node,
        size: calculatedSize,
      });
    }
  }

  public pick(mouse: { x: number; y: number }, camera: THREE.Camera): void {
    if (!this.currentVrm?.humanoid) return;

    this.raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);

    let closestBone: VRMHumanBoneName | null = null;
    let bestScore = Infinity;

    for (let i = 0; i < this.activeBones.length; i++) {
      const { name, node, size } = this.activeBones[i];

      node.getWorldPosition(this.worldPosCache);

      const distanceToRay = this.raycaster.ray.distanceToPoint(
        this.worldPosCache,
      );

      const hitRadius = size + 0.04;

      if (distanceToRay <= hitRadius) {
        const accuracy = distanceToRay / hitRadius;

        const distanceToCamera = camera.position.distanceTo(this.worldPosCache);

        const score = accuracy * distanceToCamera;

        if (score < bestScore) {
          bestScore = score;
          closestBone = name;
        }
      }
    }

    this.events.emit('engine:boneSelected', { boneName: closestBone });
  }

  public dispose(): void {
    this.activeBones = [];
    this.currentVrm = undefined;
  }
}
