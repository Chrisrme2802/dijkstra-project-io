import type { PlaybackController } from '../playback/playback-controller.js';
import { DijkstraApi } from '../services/dijkstra-api.js';
import type { GraphStore } from '../state/graph-store.js';
import type { DijkstraRequest } from '../types/dijkstra-types.js';
import { byId } from '../utils/dom.js';
import type { Toast } from './toast.js';

export class ExecuteButton {
  private store: GraphStore;
  private playback: PlaybackController;
  private toast: Toast;
  private button = byId<HTMLButtonElement>('btn-execute');

  constructor(store: GraphStore, playback: PlaybackController, toast: Toast) {
    this.store = store;
    this.playback = playback;
    this.toast = toast;
    this.button?.addEventListener('click', () => void this.run());
  }

  private buildRequest(): DijkstraRequest | null {
    const startNode = this.store.getStartNodeId();
    const targetNode = this.store.getTargetNodeId();
    if (!startNode || !targetNode) return null;

    return {
      nodes: this.store.getNodes().map((n) => ({ id: n.id, label: n.label })),
      edges: this.store.getEdges().map((e) => ({ from: e.from, to: e.to, weight: e.weight })),
      startNode,
      targetNode,
    };
  }

  private async run(): Promise<void> {
    const request = this.buildRequest();
    if (!request) {
      this.toast.show('Define los nodos de Inicio y Meta arrastrando las insignias del panel.', 'error');
      return;
    }

    this.setBusy(true);
    try {
      const response = await DijkstraApi.solve(request);
      this.toast.show('Ruta calculada con éxito', 'success');
      this.playback.load(response);
      this.playback.play();
    } catch (error) {
      this.toast.show(error instanceof Error ? error.message : 'Error al conectar con el servidor', 'error');
    } finally {
      this.setBusy(false);
    }
  }

  private setBusy(busy: boolean): void {
    if (!this.button) return;
    this.button.disabled = busy;
    this.button.textContent = busy ? 'Calculando...' : 'Calcular Ruta';
    this.button.classList.toggle('opacity-50', busy);
    this.button.classList.toggle('cursor-not-allowed', busy);
  }
}
