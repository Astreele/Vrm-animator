import * as THREE from 'three/webgpu';
import { VRM } from '@pixiv/three-vrm';
import { VRMLoader } from '../controllers/VRMLoader';
import { Physics } from '../controllers/Physics';
import { AnimationController } from '../controllers/AnimationController';
import { ExpressionController } from '../controllers/ExpressionController';
import { EventBus } from '../../core/engine/EventBus';
import type { AnimationTrackData } from '../types';

export class VRMSystem {
  private readonly loader: VRMLoader;
  private readonly physics: Physics;
  private readonly animation: AnimationController;
  private readonly expressions: ExpressionController;
  private events: EventBus;
  public currentVrm?: VRM;

  constructor(events: EventBus) {
    this.events = events;
    this.loader = new VRMLoader();
    this.physics = new Physics();
    this.animation = new AnimationController();
    this.expressions = new ExpressionController();
  }

  public async load(url: string): Promise<VRM> {
    const vrm = await this.loader.load(url);

    if (this.currentVrm) {
      this.events.emit('vrm:disposed', undefined);
      this.physics.clearModel();
      this.animation.clearModel();
      this.expressions.clearModel();
    }

    this.currentVrm = vrm;
    this.physics.setModel(vrm);
    this.animation.setModel(vrm);
    this.expressions.setModel(vrm);

    this.events.emit('vrm:loaded', { vrm });
    return vrm;
  }

  public update(
    delta: number,
    time: number,
    tracks?: Record<string, AnimationTrackData>,
  ): void {
    if (!this.currentVrm) return;

    const wind = this.calculateWind(time);
    this.physics.setWind(wind.direction, wind.power);

    if (tracks) {
      this.animation.update(delta, time, tracks);
    }

    this.expressions.update();
    this.physics.update(delta);
  }

  public dispose(): void {
    this.physics.dispose();
    this.animation.clearModel();
    this.expressions.clearModel();
    this.currentVrm = undefined;
  }

  private calculateWind(time: number): {
    direction: THREE.Vector3;
    power: number;
  } {
    const windDir = new THREE.Vector3(1, 0, -0.5);
    windDir.y += Math.cos(time * 5.0) * 0.2;
    windDir.z += Math.sin(time * 3.0) * 0.2;
    windDir.normalize();

    const basePower = 2.0;
    const gustPower = Math.sin(time * 2.0) * 1.5;
    const finalPower = Math.max(0, basePower + gustPower);

    return { direction: windDir, power: finalPower };
  }
}
