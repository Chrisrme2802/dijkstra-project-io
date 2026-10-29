import type { GraphStore } from '../state/graph-store.js';
import type { SoundEffects } from '../services/sound-effects.js';
import type { GraphNode } from '../types/dijkstra-types.js';
import type { Modal } from '../ui/modal.js';
import type { Toast } from '../ui/toast.js';

/**
 * Casos de uso del editor: cada método combina "preguntar al usuario" +
 * "modificar el store" + "sonido y aviso". Los eventos de bajo nivel
 * (drag, click...) solo llaman a estos métodos.
 */
export class GraphActions {
  private store: GraphStore;
  private modal: Modal;
  private toast: Toast;
  private sounds: SoundEffects;

  constructor(store: GraphStore, modal: Modal, toast: Toast, sounds: SoundEffects) {
    this.store = store;
    this.modal = modal;
    this.toast = toast;
    this.sounds = sounds;
  }

  public async addNodeAt(x: number, y: number): Promise<void> {
    const input = await this.modal.showInput({
      title: 'Crear Nuevo Nodo',
      subtitle: 'Ingresa el nombre o identificador.',
      defaultValue: this.nextFreeName(),
      validate: (value) => {
        if (!value) return 'El identificador no puede estar vacío.';
        const id = value.toUpperCase();
        return this.store.hasNode(id) ? `Ya existe el nodo "${id}".` : null;
      },
    });
    if (!input) return;

    this.store.addNode(input.toUpperCase(), x, y);
    this.sounds.playPop();
  }

  public async renameNode(node: GraphNode): Promise<void> {
    const input = await this.modal.showInput({
      title: 'Renombrar Nodo',
      subtitle: `Ingresa un nuevo nombre para "${node.id}".`,
      defaultValue: node.id,
      validate: (value) => {
        if (!value) return 'El identificador no puede estar vacío.';
        const id = value.toUpperCase();
        if (id !== node.id && this.store.hasNode(id)) return `Ya existe un nodo con el nombre "${id}".`;
        return null;
      },
    });
    if (!input) return;

    const newId = input.toUpperCase();
    if (this.store.renameNode(node.id, newId)) {
      this.sounds.playPop();
      this.toast.show(`Nodo renombrado a "${newId}"`, 'success');
    }
  }

  public async confirmDeleteNode(node: GraphNode): Promise<void> {
    const confirmed = await this.modal.showConfirm({
      title: 'Eliminar Nodo',
      subtitle: `¿Deseas eliminar el nodo "${node.id}"?`,
    });
    if (confirmed) this.deleteNodes([node.id]);
  }

  public deleteNodes(ids: readonly string[]): void {
    if (ids.length === 0) return;
    this.store.removeNodes(ids);
    this.sounds.playDelete();
    this.toast.show(
      ids.length === 1 ? `Nodo "${ids[0]}" eliminado` : `${ids.length} nodos eliminados`,
      'info'
    );
  }

  public async promptEdgeWeight(from: string, to: string): Promise<void> {
    const input = await this.modal.showInput({
      title: 'Peso de la Arista',
      subtitle: `Asigna la distancia para (${from} ➔ ${to}).`,
      defaultValue: '1',
      validate: (value) => {
        const n = parseFloat(value);
        return Number.isNaN(n) || n <= 0 ? 'Ingresa un número mayor a 0.' : null;
      },
    });
    if (!input) return;

    this.store.setEdge(from, to, parseFloat(input));
    this.sounds.playPop();
  }

  /** Primer nombre libre con el formato N1, N2, N3... */
  private nextFreeName(): string {
    let n = this.store.getNodes().length + 1;
    while (this.store.hasNode(`N${n}`)) n++;
    return `N${n}`;
  }
}
