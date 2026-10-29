import type { DijkstraResponse, Step } from '../types/dijkstra-types.js';
import { Emitter } from '../utils/emitter.js';
import { DEFAULT_SPEED_MS } from '../config.js';

/**
 * idle      → no hay ejecución cargada
 * ready     → ejecución cargada, aún sin reproducir
 * playing   → avanzando automáticamente
 * paused    → detenida a mitad
 * completed → llegó al final y se mostró la ruta
 */
export type PlaybackState = 'idle' | 'ready' | 'playing' | 'paused' | 'completed';

export type PlaybackEvents = {
  /** Se mostró un paso. `initial` es true solo al cargar la ejecución. */
  stepChanged: { step: Step; index: number; total: number; initial: boolean };
  stateChanged: PlaybackState;
  /** La reproducción terminó: es el momento de mostrar la ruta final. */
  finished: DijkstraResponse;
  /** Se descartó la ejecución actual. */
  cleared: void;
};

/**
 * Lógica de reproducción paso a paso. NO toca el DOM ni el renderer:
 * solo mantiene el índice y el temporizador, y emite eventos que
 * los paneles de ui/ y playback/graph-highlight escuchan.
 */
export class PlaybackController extends Emitter<PlaybackEvents> {
  private execution: DijkstraResponse | null = null;
  private index = -1;
  private state: PlaybackState = 'idle';
  private speedMs = DEFAULT_SPEED_MS;
  private timer: number | null = null;

  // ---------- consulta ----------

  public getState(): PlaybackState {
    return this.state;
  }

  public getIndex(): number {
    return this.index;
  }

  public getTotal(): number {
    return this.execution?.steps.length ?? 0;
  }

  public hasSteps(): boolean {
    return this.getTotal() > 0;
  }

  // ---------- control ----------

  public load(execution: DijkstraResponse): void {
    this.clear();
    this.execution = execution;
    if (!this.hasSteps()) return;

    this.index = 0;
    this.setState('ready');
    this.emitStep(true);
  }

  public play(): void {
    if (!this.hasSteps()) return;
    if (this.index >= this.getTotal() - 1) this.goTo(0, false); // reinicia si ya había terminado

    this.setState('playing');
    this.scheduleTick();
  }

  public pause(): void {
    if (this.state !== 'playing') return;
    this.cancelTimer();
    this.setState('paused');
  }

  public toggle(): void {
    if (this.state === 'playing') this.pause();
    else this.play();
  }

  public stepForward(): void {
    if (!this.hasSteps()) return;
    this.pause();
    if (this.index < this.getTotal() - 1) this.goTo(this.index + 1, false);
    if (this.index >= this.getTotal() - 1) this.finish();
  }

  public stepBackward(): void {
    if (!this.hasSteps() || this.index <= 0) return;
    this.pause();
    this.goTo(this.index - 1, false);
    this.setState('paused');
  }

  /** Cambia la espera entre pasos (ms). Aplica desde el siguiente paso. */
  public setSpeed(ms: number): void {
    this.speedMs = ms;
  }

  public clear(): void {
    this.cancelTimer();
    this.execution = null;
    this.index = -1;
    this.setState('idle');
    this.emit('cleared', undefined);
  }

  // ---------- internos ----------

  private scheduleTick(): void {
    this.cancelTimer();
    this.timer = window.setTimeout(() => this.tick(), this.speedMs);
  }

  private tick(): void {
    if (this.state !== 'playing') return;

    if (this.index < this.getTotal() - 1) {
      this.goTo(this.index + 1, false);
      this.scheduleTick();
    } else {
      this.finish();
    }
  }

  private finish(): void {
    this.cancelTimer();
    this.setState('completed');
    if (this.execution) this.emit('finished', this.execution);
  }

  private goTo(index: number, initial: boolean): void {
    this.index = index;
    this.emitStep(initial);
  }

  private emitStep(initial: boolean): void {
    const step = this.execution?.steps[this.index];
    if (!step) return;
    this.emit('stepChanged', { step, index: this.index, total: this.getTotal(), initial });
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private setState(state: PlaybackState): void {
    if (this.state === state) return;
    this.state = state;
    this.emit('stateChanged', state);
  }
}
