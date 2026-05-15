import { VRM } from '@pixiv/three-vrm';

export class ExpressionController {
  private currentVrm?: VRM;

  public setModel(vrm: VRM): void {
    this.currentVrm = vrm;
  }

  public update(): void {
    this.currentVrm?.expressionManager?.update();
  }
  public clearModel(): void {
    this.currentVrm = undefined;
  }
}
