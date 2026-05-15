import { CameraController } from '../controllers/CameraController';
import { EventBus } from '../../core/engine/EventBus';

export class CameraSystem {
  public readonly controller: CameraController;
  private events: EventBus;

  constructor(
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    events: EventBus,
  ) {
    this.events = events;
    this.controller = new CameraController(container, canvas);
    this.events.on('resize', ({ width, height }) =>
      this.controller.handleResize(width, height),
    );
  }

  public update(): void {
    this.controller.update();
  }

  public dispose(): void {
    this.controller.dispose();
  }
}
