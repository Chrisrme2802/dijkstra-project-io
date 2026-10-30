import { TOAST_DURATION_MS } from '../config.js';
import { byId } from '../utils/dom.js';

export type ToastType = 'info' | 'error' | 'success';

export class Toast {
  private container = byId('toast-container');

  public show(message: string, type: ToastType = 'info'): void {
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    this.container.appendChild(toast);

    // un frame despues
    requestAnimationFrame(() => toast.classList.add('toast-show'));

    window.setTimeout(() => {
      toast.classList.remove('toast-show');
      window.setTimeout(() => toast.remove(), 300);
    }, TOAST_DURATION_MS);
  }
}
