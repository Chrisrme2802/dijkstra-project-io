import type { GraphRenderer } from './graph-renderer.js';
import type { Step, DijkstraResponse } from '../types/dijkstra-types.js';
import type { SoundEffects } from '../services/sound-effects.js';

export class AnimationController {
  private renderer: GraphRenderer;
  private sounds: SoundEffects;
  private steps: Step[] = [];
  private finalPath: string[] = [];
  private totalDistance: number = 0;
  private currentStepIndex: number = -1;
  
  private isRunning: boolean = false;
  private speedMs: number = 500;

  private btnPlay: HTMLButtonElement | null;
  private btnPrev: HTMLButtonElement | null;
  private btnNext: HTMLButtonElement | null;
  private speedInput: HTMLInputElement | null;
  private statusIndicator: HTMLElement | null;

  private stepCounter: HTMLElement | null;
  private stepDescription: HTMLElement | null;
  private pathSummary: HTMLElement | null;
  private summaryPathText: HTMLElement | null;
  private summaryDistanceText: HTMLElement | null;
  private tableBody: HTMLElement | null;

  constructor(renderer: GraphRenderer, sounds: SoundEffects) {
    this.renderer = renderer;
    this.sounds = sounds;

    this.btnPlay = document.getElementById('btn-play') as HTMLButtonElement | null;
    this.btnPrev = document.getElementById('btn-prev') as HTMLButtonElement | null;
    this.btnNext = document.getElementById('btn-next') as HTMLButtonElement | null;
    this.speedInput = document.getElementById('speed-range') as HTMLInputElement | null;
    this.statusIndicator = document.getElementById('status-indicator');

    this.stepCounter = document.getElementById('step-counter');
    this.stepDescription = document.getElementById('step-description');
    this.pathSummary = document.getElementById('path-summary');
    this.summaryPathText = document.getElementById('summary-path-text');
    this.summaryDistanceText = document.getElementById('summary-distance-text');
    this.tableBody = document.getElementById('node-distance-table-body');

    this.initEvents();
  }

  private initEvents(): void {
    this.btnPlay?.addEventListener('click', () => this.togglePlay());
    this.btnPrev?.addEventListener('click', () => this.stepBackward());
    this.btnNext?.addEventListener('click', () => this.stepForward());

    this.speedInput?.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.speedMs = 1600 - parseInt(target.value, 10);
    });
  }

  public loadExecution(response: DijkstraResponse): void {
    this.reset();
    this.steps = response.steps;
    this.finalPath = response.path;
    this.totalDistance = response.totalDistance;

    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
      this.renderCurrentStep();
    }
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  public togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play(): void {
    if (this.steps.length === 0) return;
    
    // reiniciar desde cero si ya había terminado
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = -1;
    }

    this.isRunning = true;
    
    if (this.btnPlay) this.btnPlay.textContent = 'Pausar';
    if (this.statusIndicator) {
      this.statusIndicator.textContent = 'Ejecutando...';
      this.statusIndicator.className = 'status-running';
    }

    // iniciar bucle
    this.playLoop();
  }

  public pause(): void {
    this.isRunning = false;
    
    if (this.btnPlay) this.btnPlay.textContent = 'Reproducir';
    if (this.statusIndicator) {
      this.statusIndicator.textContent = 'Pausado';
      this.statusIndicator.className = 'status-paused';
    }
  }

  // bucle con requestAnimationFrame
  private async playLoop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.currentStepIndex < this.steps.length - 1) {
      this.stepForward();
      
      // velocidad
      await new Promise(resolve => setTimeout(resolve, this.speedMs));
      
      // Sincronizar el siguiente paso con el pintado de la pantalla
      requestAnimationFrame(() => this.playLoop());
    } else {
      this.pause();
      this.highlightFinalPath();
    }
  }

  public stepForward(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.sounds.playStep();
      this.renderCurrentStep();
    } else {
      this.highlightFinalPath();
    }
  }

  public stepBackward(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.sounds.playStep();
      this.renderCurrentStep();
    }
  }

  private renderDistanceTable(step: Step): void {
    if (!this.tableBody) return;

    const nodes = this.renderer.getNodes();
    if (nodes.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="table-empty-cell">No hay nodos en el lienzo.</td>
        </tr>`;
      return;
    }

    this.tableBody.innerHTML = nodes
      .map((node) => {
        const dist = step.distances[node.id];
        const isInfinity = dist === Infinity || dist === undefined;
        const distText = isInfinity ? '∞' : dist;
        const prevText = step.previous[node.id] || '-';

        const isCurrent = step.currentNode === node.id;
        const isVisited = step.visited?.includes(node.id);

        let rowClass = 'table-row-base';
        if (isCurrent) rowClass += ' table-row-current';
        else if (isVisited) rowClass += ' table-row-visited';

        const distClass = isInfinity ? 'table-dist-infinity' : 'table-dist-value';
        const pulseIndicator = isCurrent ? '<span class="pulse-dot"></span>' : '';

        return `
          <tr class="${rowClass}">
            <td class="table-cell-node">
              <span>${node.id}</span>
              ${pulseIndicator}
            </td>
            <td class="table-cell-dist ${distClass}">${distText}</td>
            <td class="table-cell-prev">${prevText}</td>
          </tr>
        `;
      })
      .join('');
  }

  private renderCurrentStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step) return;

    if (this.pathSummary) this.pathSummary.classList.add('hidden');

    if (this.stepCounter) {
      this.stepCounter.textContent = `Paso ${this.currentStepIndex + 1} / ${this.steps.length}`;
    }
    if (this.stepDescription) {
      this.stepDescription.textContent = step.description;
    }

    this.renderer.renderStepState(step);
    this.renderDistanceTable(step);
    this.updateControlsState();
  }

  private highlightFinalPath(): void {
    if (this.statusIndicator) {
      this.statusIndicator.textContent = 'Ruta Calculada';
      this.statusIndicator.className = 'status-completed';
    }

    if (this.pathSummary && this.summaryPathText && this.summaryDistanceText) {
      if (this.finalPath.length > 0) {
        this.summaryPathText.textContent = this.finalPath.join(' ➔ ');
        this.summaryDistanceText.textContent = `Costo Total: ${this.totalDistance}`;
        this.sounds.playSuccess();
      } else {
        this.summaryPathText.textContent = 'No existe ruta alcanzable';
        this.summaryDistanceText.textContent = 'Distancia: ∞';
      }
      this.pathSummary.classList.remove('hidden');
    }

    this.renderer.renderFinalPath(this.finalPath);
    this.updateControlsState();
  }

  private updateControlsState(): void {
    const hasSteps = this.steps.length > 0;
    if (this.btnPlay) {
      this.btnPlay.disabled = !hasSteps;
    }
    if (this.btnPrev) {
      this.btnPrev.disabled = !hasSteps || this.currentStepIndex <= 0;
    }
    if (this.btnNext) {
      this.btnNext.disabled = !hasSteps || this.currentStepIndex >= this.steps.length - 1;
    }
  }

  public reset(): void {
    this.pause();
    this.steps = [];
    this.finalPath = [];
    this.totalDistance = 0;
    this.currentStepIndex = -1;

    if (this.tableBody) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="table-empty-cell">Sin datos de ejecución.</td>
        </tr>`;
    }

    if (this.pathSummary) this.pathSummary.classList.add('hidden');
    if (this.stepCounter) this.stepCounter.textContent = 'Paso 0 / 0';
    if (this.stepDescription) {
      this.stepDescription.textContent = 'Crea un grafo y presiona "Calcular Ruta" para iniciar la simulación.';
    }

    this.updateControlsState();
    this.renderer.resetVisualStates();
  }
}