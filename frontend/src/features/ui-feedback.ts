export class UIFeedback {
  private modalContainer: HTMLElement | null;
  private modalTitle: HTMLElement | null;
  private modalSubtitle: HTMLElement | null;
  private modalInputContainer: HTMLElement | null;
  private modalInput: HTMLInputElement | null;
  private modalError: HTMLElement | null;
  private btnCancel: HTMLButtonElement | null;
  private btnConfirm: HTMLButtonElement | null;
  private toastContainer: HTMLElement | null;

  constructor() {
    this.modalContainer = document.getElementById('custom-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalSubtitle = document.getElementById('modal-subtitle');
    this.modalInputContainer = document.getElementById('modal-input-container');
    this.modalInput = document.getElementById('modal-input') as HTMLInputElement | null;
    this.modalError = document.getElementById('modal-error');
    this.btnCancel = document.getElementById('modal-btn-cancel') as HTMLButtonElement | null;
    this.btnConfirm = document.getElementById('modal-btn-confirm') as HTMLButtonElement | null;
    this.toastContainer = document.getElementById('toast-container');
  }

  public showInput(options: {
    title: string;
    subtitle: string;
    defaultValue?: string;
    placeholder?: string;
    validate?: (value: string) => string | null;
  }): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.modalContainer || !this.modalInput) return resolve(null);

      if (this.modalTitle) this.modalTitle.textContent = options.title;
      if (this.modalSubtitle) this.modalSubtitle.textContent = options.subtitle;
      if (this.modalInputContainer) this.modalInputContainer.classList.remove('hidden');

      this.modalInput.value = options.defaultValue || '';
      this.modalInput.placeholder = options.placeholder || '';
      this.hideError();

      this.openModal();

      setTimeout(() => {
        this.modalInput?.focus();
        this.modalInput?.select();
      }, 50);

      const cleanup = () => {
        this.closeModal();
        this.btnConfirm?.removeEventListener('click', onConfirm);
        this.btnCancel?.removeEventListener('click', onCancel);
        this.modalInput?.removeEventListener('keydown', onKeyDown);
      };

      const onConfirm = () => {
        const value = this.modalInput?.value.trim() || '';
        if (options.validate) {
          const err = options.validate(value);
          if (err) return this.showError(err);
        }
        cleanup();
        resolve(value);
      };

      const onCancel = () => {
        cleanup();
        resolve(null);
      };

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
      this.modalInput?.addEventListener('keydown', onKeyDown);
    });
  }

  public showConfirm(options: { title: string; subtitle: string }): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.modalContainer) return resolve(false);

      if (this.modalTitle) this.modalTitle.textContent = options.title;
      if (this.modalSubtitle) this.modalSubtitle.textContent = options.subtitle;
      
      if (this.modalInputContainer) this.modalInputContainer.classList.add('hidden');

      this.openModal();

      setTimeout(() => {
        this.btnConfirm?.focus();
      }, 50);

      const cleanup = () => {
        this.closeModal();
        this.btnConfirm?.removeEventListener('click', onConfirm);
        this.btnCancel?.removeEventListener('click', onCancel);

        document.removeEventListener('keydown', onKeyDown);
      };

      const onConfirm = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };

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

  public showToast(message: string, type: 'info' | 'error' | 'success' = 'info'): void {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    this.toastContainer.appendChild(toast);

    // requestAnimationFrame registra la pos y luego animacion
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300); // 300ms lo que dura la transicion
    }, 3500);
  }

  private openModal(): void {
    this.modalContainer?.classList.add('modal-visible');
  }

  private closeModal(): void {
    this.modalContainer?.classList.remove('modal-visible');
  }

  private showError(msg: string): void {
    if (this.modalError) {
      this.modalError.textContent = msg;
      this.modalError.classList.remove('hidden');
    }
  }

  private hideError(): void {
    if (this.modalError) {
      this.modalError.classList.add('hidden');
      this.modalError.textContent = '';
    }
  }
}