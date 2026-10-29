import { byId } from '../utils/dom.js';

export interface InputOptions {
  title: string;
  subtitle: string;
  defaultValue?: string;
  placeholder?: string;
  /** Devuelve un mensaje de error, o null si el valor es válido. */
  validate?: (value: string) => string | null;
}

export interface ConfirmOptions {
  title: string;
  subtitle: string;
}

type Outcome<T> = { ok: true; value: T } | { ok: false };

/** Diálogo modal reutilizable: pedir un texto o pedir confirmación. */
export class Modal {
  private overlay = byId('custom-modal');
  private title = byId('modal-title');
  private subtitle = byId('modal-subtitle');
  private inputBox = byId('modal-input-container');
  private input = byId<HTMLInputElement>('modal-input');
  private error = byId('modal-error');
  private btnCancel = byId<HTMLButtonElement>('modal-btn-cancel');
  private btnConfirm = byId<HTMLButtonElement>('modal-btn-confirm');

  /** Pide un texto. Devuelve null si el usuario cancela. */
  public showInput(options: InputOptions): Promise<string | null> {
    const input = this.input;
    if (!input) return Promise.resolve(null);

    input.value = options.defaultValue ?? '';
    input.placeholder = options.placeholder ?? '';

    return this.present<string | null>({
      title: options.title,
      subtitle: options.subtitle,
      withInput: true,
      cancelValue: null,
      confirm: () => {
        const value = input.value.trim();
        const message = options.validate?.(value) ?? null;
        if (message) {
          this.showError(message);
          return { ok: false };
        }
        return { ok: true, value };
      },
    });
  }

  /** Pide confirmación. Devuelve false si el usuario cancela. */
  public showConfirm(options: ConfirmOptions): Promise<boolean> {
    return this.present<boolean>({
      title: options.title,
      subtitle: options.subtitle,
      withInput: false,
      cancelValue: false,
      confirm: () => ({ ok: true, value: true }),
    });
  }

  private present<T>(config: {
    title: string;
    subtitle: string;
    withInput: boolean;
    cancelValue: T;
    confirm: () => Outcome<T>;
  }): Promise<T> {
    return new Promise<T>((resolve) => {
      if (!this.overlay) return resolve(config.cancelValue);

      if (this.title) this.title.textContent = config.title;
      if (this.subtitle) this.subtitle.textContent = config.subtitle;
      this.inputBox?.classList.toggle('hidden', !config.withInput);
      this.hideError();
      this.overlay.classList.add('modal-visible');

      window.setTimeout(() => {
        if (config.withInput) {
          this.input?.focus();
          this.input?.select();
        } else {
          this.btnConfirm?.focus();
        }
      }, 50);

      const close = (value: T) => {
        this.overlay?.classList.remove('modal-visible');
        this.btnConfirm?.removeEventListener('click', onConfirm);
        this.btnCancel?.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKeyDown);
        resolve(value);
      };

      const onConfirm = () => {
        const outcome = config.confirm();
        if (outcome.ok) close(outcome.value);
      };
      const onCancel = () => close(config.cancelValue);
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      };

      this.btnConfirm?.addEventListener('click', onConfirm);
      this.btnCancel?.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKeyDown);
    });
  }

  private showError(message: string): void {
    if (!this.error) return;
    this.error.textContent = message;
    this.error.classList.remove('hidden');
  }

  private hideError(): void {
    if (!this.error) return;
    this.error.textContent = '';
    this.error.classList.add('hidden');
  }
}
