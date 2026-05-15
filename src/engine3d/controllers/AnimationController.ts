import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import type { AnimationTrackData, KeyframeData } from '../types';
import * as THREE from 'three/webgpu';

type TrackValue = number | THREE.Vector3 | THREE.Quaternion;

function isQuaternionData(
  val: KeyframeData['value'],
): val is { x: number; y: number; z: number; w: number } {
  return typeof val === 'object' && val !== null && 'w' in val;
}

function isVector3Data(
  val: KeyframeData['value'],
): val is { x: number; y: number; z: number } {
  return (
    typeof val === 'object' &&
    val !== null &&
    'x' in val &&
    'y' in val &&
    'z' in val &&
    !('w' in val)
  );
}

function isNumberValue(val: KeyframeData['value']): val is number {
  return typeof val === 'number';
}

export class AnimationController {
  private currentVrm?: VRM;

  public setModel(vrm: VRM): void {
    this.currentVrm = vrm;
  }

  public update(
    _delta: number,
    time: number,
    tracks: Record<string, AnimationTrackData> = {},
  ): void {
    if (!this.currentVrm) return;
    for (const track of Object.values(tracks)) {
      if (!track.keyframes || track.keyframes.length === 0) continue;

      const interpolatedValue = this.evaluateTrack(track, time);
      this.applyValueToVRM(track.targetPath, interpolatedValue);
    }
    this.currentVrm?.lookAt?.update(_delta);
    this.currentVrm.humanoid.update();
  }

  private evaluateTrack(track: AnimationTrackData, time: number): TrackValue {
    const kfs = track.keyframes;
    if (time <= kfs[0].time) return this.parseValue(kfs[0].value);
    if (time >= kfs[kfs.length - 1].time)
      return this.parseValue(kfs[kfs.length - 1].value);

    const idx = this.findKeyframeIndex(kfs, time);

    const kfA = kfs[idx];
    const kfB = kfs[idx + 1];
    const t = (time - kfA.time) / (kfB.time - kfA.time);

    let alpha = t;
    if (kfA.interpolation === 'step') return this.parseValue(kfA.value);
    if (kfA.interpolation === 'bezier') {
      alpha = t * t * (3 - 2 * t);
    }

    return this.interpolateValues(
      this.parseValue(kfA.value),
      this.parseValue(kfB.value),
      alpha,
    );
  }

  private findKeyframeIndex(kfs: KeyframeData[], time: number): number {
    let lo = 0;
    let hi = kfs.length - 2;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (kfs[mid + 1].time <= time) {
        lo = mid + 1;
      } else if (kfs[mid].time > time) {
        hi = mid - 1;
      } else {
        return mid;
      }
    }
    return lo;
  }

  private parseValue(val: KeyframeData['value']): TrackValue {
    if (isNumberValue(val)) return val;
    if (isQuaternionData(val))
      return new THREE.Quaternion(val.x, val.y, val.z, val.w);
    if (isVector3Data(val)) return new THREE.Vector3(val.x, val.y, val.z);
    return val as TrackValue;
  }

  private interpolateValues(
    valA: TrackValue,
    valB: TrackValue,
    t: number,
  ): TrackValue {
    if (typeof valA === 'number' && typeof valB === 'number') {
      return valA + (valB - valA) * t;
    }

    if (valA instanceof THREE.Quaternion && valB instanceof THREE.Quaternion) {
      return new THREE.Quaternion().copy(valA).slerp(valB, t);
    }

    if (valA instanceof THREE.Vector3 && valB instanceof THREE.Vector3) {
      return new THREE.Vector3().copy(valA).lerp(valB, t);
    }

    return valA;
  }

  private applyValueToVRM(targetPath: string, value: TrackValue): void {
    const [targetType, targetName] = targetPath.split('.');

    if (targetType === 'blendShapes') {
      this.currentVrm?.expressionManager?.setValue(targetName, value as number);
    } else {
      const boneNode = this.currentVrm?.humanoid?.getNormalizedBoneNode(
        targetType as VRMHumanBoneName,
      );
      if (!boneNode) return;

      if (targetName === 'quaternion' && value instanceof THREE.Quaternion) {
        boneNode.quaternion.copy(value);
      } else if (targetName === 'position' && value instanceof THREE.Vector3) {
        boneNode.position.copy(value);
      }
    }
  }

  public clearModel(): void {
    this.currentVrm = undefined;
  }
}
