interface ToneOptions {
  type: OscillatorType;
  // inicial
  from: number;
  // final
  to?: number;
  duration: number;
  volume: number;
  delay?: number;
}

export class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    // gesto usuario
    const init = () => {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };
    window.addEventListener('click', init);
    window.addEventListener('keydown', init);
  }

  public toggleSound(enable?: boolean): boolean {
    this.enabled = enable ?? !this.enabled;
    return this.enabled;
  }

  // suave
  public playPop(): void {
    this.tone({ type: 'sine', from: 440, to: 880, duration: 0.08, volume: 0.15 });
  }

  // tick
  public playStep(): void {
    this.tone({ type: 'triangle', from: 587.33, duration: 0.05, volume: 0.08 });
  }

  // C5 – E5 – G5 – C6
  public playSuccess(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((from, i) =>
      this.tone({ type: 'sine', from, duration: 0.3, volume: 0.12, delay: i * 0.08 })
    );
  }

  // grave
  public playDelete(): void {
    this.tone({ type: 'sawtooth', from: 300, to: 100, duration: 0.12, volume: 0.1 });
  }

  private tone(o: ToneOptions): void {
    const ctx = this.ctx;
    if (!this.enabled || !ctx) return;

    const start = ctx.currentTime + (o.delay ?? 0);
    const end = start + o.duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = o.type;
    osc.frequency.setValueAtTime(o.from, start);
    if (o.to !== undefined) osc.frequency.exponentialRampToValueAtTime(o.to, end);

    gain.gain.setValueAtTime(o.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end);
  }
}
