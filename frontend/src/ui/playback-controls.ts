import { SPEED_BASE_MS } from '../config.js';
import type { PlaybackController, PlaybackState } from '../playback/playback-controller.js';
import { byId } from '../utils/dom.js';

const STATUS: Record<PlaybackState, { text: string; cssClass: string }> = {
  idle: { text: 'Modo Edición', cssClass: 'status-editing' },
  ready: { text: 'Listo', cssClass: 'status-paused' },
  playing: { text: 'Ejecutando...', cssClass: 'status-running' },
  paused: { text: 'Pausado', cssClass: 'status-paused' },
  completed: { text: 'Ruta Calculada', cssClass: 'status-completed' },
};

export class PlaybackControls {
  private playback: PlaybackController;
  private btnPlay = byId<HTMLButtonElement>('btn-play');
  private btnPrev = byId<HTMLButtonElement>('btn-prev');
  private btnNext = byId<HTMLButtonElement>('btn-next');
  private speed = byId<HTMLInputElement>('speed-range');
  private status = byId('status-indicator');

  constructor(playback: PlaybackController) {
    this.playback = playback;

    this.btnPlay?.addEventListener('click', () => playback.toggle());
    this.btnPrev?.addEventListener('click', () => playback.stepBackward());
    this.btnNext?.addEventListener('click', () => playback.stepForward());
    this.speed?.addEventListener('input', () => {
      playback.setSpeed(SPEED_BASE_MS - parseInt(this.speed!.value, 10));
    });
    if (this.speed) playback.setSpeed(SPEED_BASE_MS - parseInt(this.speed.value, 10));

    playback.on('stateChanged', () => this.refresh());
    playback.on('stepChanged', () => this.refresh());
    playback.on('cleared', () => this.refresh());
    this.refresh();
  }

  private refresh(): void {
    const { playback } = this;
    const state = playback.getState();
    const hasSteps = playback.hasSteps();

    if (this.btnPlay) {
      this.btnPlay.disabled = !hasSteps;
      this.btnPlay.textContent = state === 'playing' ? 'Pausar' : 'Reproducir';
    }
    if (this.btnPrev) this.btnPrev.disabled = !hasSteps || playback.getIndex() <= 0;
    if (this.btnNext) this.btnNext.disabled = !hasSteps || playback.getIndex() >= playback.getTotal() - 1;

    if (this.status) {
      this.status.textContent = STATUS[state].text;
      this.status.className = STATUS[state].cssClass;
    }
  }
}
