import { byId } from '../utils/dom.js';

/** Papelera visual: aparece al arrastrar nodos y detecta si se sueltan sobre ella. */
export class TrashZone {
  private element = byId('trash-zone');

  public show(): void {
    this.element?.classList.add('trash-visible');
  }

  public hide(): void {
    this.element?.classList.remove('trash-visible', 'trash-active');
  }

  public setActive(active: boolean): void {
    this.element?.classList.toggle('trash-active', active);
  }

  public isOver(clientX: number, clientY: number): boolean {
    if (!this.element) return false;
    const r = this.element.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }
}
