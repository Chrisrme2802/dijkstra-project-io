import type { PlaybackController } from '../playback/playback-controller.js';
import type { DijkstraResponse } from '../types/dijkstra-types.js';
import { byId } from '../utils/dom.js';

const IDLE_DESCRIPTION = 'Crea un grafo y presiona "Calcular Ruta" para iniciar la simulación.';

/** Panel derecho: contador de pasos, descripción y resumen de la ruta final. */
export class StepPanel {
  private counter = byId('step-counter');
  private description = byId('step-description');
  private summary = byId('path-summary');
  private summaryPath = byId('summary-path-text');
  private summaryDistance = byId('summary-distance-text');

  constructor(playback: PlaybackController) {
    playback.on('stepChanged', ({ step, index, total }) => {
      this.summary?.classList.add('hidden');
      this.setText(this.counter, `Paso ${index + 1} / ${total}`);
      this.setText(this.description, step.description);
    });

    playback.on('finished', (result) => this.showSummary(result));

    playback.on('cleared', () => {
      this.summary?.classList.add('hidden');
      this.setText(this.counter, 'Paso 0 / 0');
      this.setText(this.description, IDLE_DESCRIPTION);
    });
  }

  private showSummary({ path, totalDistance }: DijkstraResponse): void {
    const reachable = path.length > 0;
    this.setText(this.summaryPath, reachable ? path.join(' ➔ ') : 'No existe ruta alcanzable');
    this.setText(this.summaryDistance, reachable ? `Costo Total: ${totalDistance}` : 'Distancia: ∞');
    this.summary?.classList.remove('hidden');
  }

  private setText(element: HTMLElement | null, text: string): void {
    if (element) element.textContent = text;
  }
}
