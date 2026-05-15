import { EventBus } from '../../core/engine/EventBus';

export class InputSystem {
  private container: HTMLDivElement;
  private events: EventBus;

  constructor(container: HTMLDivElement, events: EventBus) {
    this.container = container;
    this.events = events;
    window.addEventListener('pointerdown', this.onPointerDown, {
      capture: true,
    });
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary) return;

    if (!this.container.contains(event.target as Node)) {
      return;
    }

    const canvas = this.container.querySelector('canvas') || this.container;
    const rect = canvas.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.events.emit('input:down', { x, y, button: event.button });
  };

  public dispose(): void {
    window.removeEventListener('pointerdown', this.onPointerDown, {
      capture: true,
    });
  }
}
