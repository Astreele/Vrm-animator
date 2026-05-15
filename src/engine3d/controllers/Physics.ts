import * as THREE from 'three/webgpu';
import { VRM, VRMSpringBoneJoint } from '@pixiv/three-vrm';

interface OriginalGravityState {
  joint: VRMSpringBoneJoint;
  dir: THREE.Vector3;
  power: number;
}

export class Physics {
  private currentVrm?: VRM;

  public isEnabled: boolean = true;
  public timeScale: number = 1.0;

  public windVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private originalGravityCache: OriginalGravityState[] = [];

  public setModel(vrm: VRM): void {
    this.currentVrm = vrm;
    this.cacheOriginalGravity();
  }

  public update(delta: number): void {
    if (!this.currentVrm || !this.isEnabled) return;

    const scaledDelta = delta * this.timeScale;
    this.applyWind();
    this.currentVrm.springBoneManager?.update(scaledDelta);
  }

  public reset(): void {
    if (!this.currentVrm) return;
    this.currentVrm.springBoneManager?.reset();
  }

  public setWind(direction: THREE.Vector3, power: number): void {
    this.windVelocity.copy(direction).normalize().multiplyScalar(power);
  }

  public clearWind(): void {
    this.windVelocity.set(0, 0, 0);
  }

  public clearModel(): void {
    this.restoreOriginalGravity();
    this.currentVrm = undefined;
    this.originalGravityCache = [];
    this.clearWind();
  }

  public dispose(): void {
    this.clearModel();
  }

  private cacheOriginalGravity(): void {
    this.originalGravityCache = [];
    if (!this.currentVrm?.springBoneManager) return;

    const manager = this.currentVrm.springBoneManager;
    const joints =
      'joints' in manager
        ? Array.from((manager as { joints: Set<VRMSpringBoneJoint> }).joints)
        : [];

    for (const joint of joints) {
      this.originalGravityCache.push({
        joint,
        dir: joint.settings.gravityDir?.clone() ?? new THREE.Vector3(0, -1, 0),
        power: joint.settings.gravityPower ?? 0,
      });
    }
  }

  private applyWind(): void {
    if (!this.currentVrm || this.originalGravityCache.length === 0) return;

    const hasWind = this.windVelocity.lengthSq() > 0;

    for (const state of this.originalGravityCache) {
      if (!state.joint.settings.gravityDir) {
        state.joint.settings.gravityDir = new THREE.Vector3();
      }

      if (!hasWind) {
        state.joint.settings.gravityDir.copy(state.dir);
        state.joint.settings.gravityPower = state.power;
        continue;
      }

      const baseGravity = state.dir.clone().multiplyScalar(state.power);
      const combinedForce = baseGravity.add(this.windVelocity);
      const newPower = combinedForce.length();

      if (newPower > 0) {
        state.joint.settings.gravityDir.copy(combinedForce).normalize();
        state.joint.settings.gravityPower = newPower;
      }
    }
  }

  private restoreOriginalGravity(): void {
    for (const state of this.originalGravityCache) {
      state.joint.settings.gravityDir = state.dir;
      state.joint.settings.gravityPower = state.power;
    }
  }
}
