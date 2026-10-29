import type { NodeSelection } from '../render/graph-renderer.js';
import type { GraphStore } from '../state/graph-store.js';
import type { GraphActions } from './graph-actions.js';
import type { NodeDrag } from './node-drag.js';
import type { PanZoom } from './pan-zoom.js';

/**
 * Eventos de cada nodo. Se enlazan UNA vez, cuando el renderer crea el nodo
 * (ver renderer.onNodeEnter), por lo que no hay que "re-enlazar" nunca.
 *
 *  - clic: selecciona (Ctrl/Cmd suma) y, sin Shift, abre el diálogo de renombrar
 *  - clic derecho: eliminar (con confirmación)
 *  - arrastrar: ver NodeDrag
 */
export class NodeEvents {
  private store: GraphStore;
  private actions: GraphActions;
  private drag: NodeDrag;
  private panZoom: PanZoom;

  constructor(store: GraphStore, actions: GraphActions, drag: NodeDrag, panZoom: PanZoom) {
    this.store = store;
    this.actions = actions;
    this.drag = drag;
    this.panZoom = panZoom;
  }

  public attach(selection: NodeSelection): void {
    selection.on('contextmenu', async (event: MouseEvent, node) => {
      event.preventDefault();
      event.stopPropagation();
      await this.actions.confirmDeleteNode(node);
    });

    selection.on('click', async (event: MouseEvent, node) => {
      event.stopPropagation();
      if (this.panZoom.isPanGesture(event)) return;

      if (event.ctrlKey || event.metaKey) this.store.addToSelection(node.id);
      else this.store.selectOnly(node.id);

      if (!event.shiftKey) await this.actions.renameNode(node);
    });

    this.drag.attach(selection);
  }
}
