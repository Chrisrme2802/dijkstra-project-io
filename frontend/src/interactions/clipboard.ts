import { PASTE_OFFSET } from '../config.js';
import type { GraphStore } from '../state/graph-store.js';
import type { SoundEffects } from '../services/sound-effects.js';
import type { Edge, GraphNode } from '../types/dijkstra-types.js';
import type { Toast } from '../ui/toast.js';

/** Copiar / pegar la selección con Ctrl/Cmd + C / V. */
export class Clipboard {
  private store: GraphStore;
  private toast: Toast;
  private sounds: SoundEffects;

  private nodes: GraphNode[] = [];
  private edges: Edge[] = [];
  private pasteCount = 0;

  constructor(store: GraphStore, toast: Toast, sounds: SoundEffects) {
    this.store = store;
    this.toast = toast;
    this.sounds = sounds;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    const tag = (document.activeElement?.tagName ?? '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!(e.ctrlKey || e.metaKey)) return;

    const key = e.key.toLowerCase();
    if (key === 'c') {
      e.preventDefault();
      this.copy();
    } else if (key === 'v') {
      e.preventDefault();
      this.paste();
    }
  }

  public copy(): void {
    const selected = this.store.getSelectedNodes();
    if (selected.length === 0) {
      this.toast.show('Selecciona nodos con la caja de arrastre para copiar', 'info');
      return;
    }

    const ids = new Set(selected.map((n) => n.id));
    this.nodes = selected.map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y }));
    // solo aristas cuyos dos extremos están seleccionados
    this.edges = this.store
      .getEdges()
      .filter((e) => ids.has(e.from) && ids.has(e.to))
      .map((e) => ({ from: e.from, to: e.to, weight: e.weight }));
    this.pasteCount = 0;

    this.sounds.playPop();
    this.toast.show(`Copiados ${selected.length} nodos`, 'success');
  }

  public paste(): void {
    if (this.nodes.length === 0) {
      this.toast.show('El portapapeles está vacío. Copia algo primero.', 'info');
      return;
    }

    this.pasteCount++;
    const offset = PASTE_OFFSET * this.pasteCount;
    const takenIds = new Set(this.store.getNodes().map((n) => n.id));
    const idMap = new Map<string, string>();

    const newNodes: GraphNode[] = this.nodes.map((old) => {
      const id = this.uniqueId(old.id, takenIds);
      takenIds.add(id);
      idMap.set(old.id, id);
      return { id, label: id, x: old.x + offset, y: old.y + offset, selected: true };
    });

    const newEdges: Edge[] = this.edges.flatMap((e) => {
      const from = idMap.get(e.from);
      const to = idMap.get(e.to);
      return from && to ? [{ from, to, weight: e.weight }] : [];
    });

    this.store.addSubgraph(newNodes, newEdges);
    this.sounds.playPop();
    this.toast.show(`Pegados ${newNodes.length} nodos`, 'success');
  }

  /** A → A_1, A_2... (si se pega algo que ya era una copia, A_1 → A_2 y no A_1_1). */
  private uniqueId(baseId: string, taken: Set<string>): string {
    const base = baseId.replace(/_\d+$/, '');
    let counter = 1;
    while (taken.has(`${base}_${counter}`)) counter++;
    return `${base}_${counter}`;
  }
}
