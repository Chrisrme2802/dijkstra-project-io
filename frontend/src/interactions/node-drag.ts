import * as d3 from 'd3';
import type { GraphRenderer, NodeSelection } from '../render/graph-renderer.js';
import type { GraphStore } from '../state/graph-store.js';
import type { GraphNode } from '../types/dijkstra-types.js';
import type { EdgeCreation } from './edge-creation.js';
import type { GraphActions } from './graph-actions.js';
import type { PanZoom } from './pan-zoom.js';
import type { TrashZone } from './trash-zone.js';

type NodeDragEvent = d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>;

export class NodeDrag {
  private store: GraphStore;
  private actions: GraphActions;
  private trash: TrashZone;
  private edgeCreation: EdgeCreation;
  private panZoom: PanZoom;

  constructor(
    _renderer: GraphRenderer,
    store: GraphStore,
    actions: GraphActions,
    trash: TrashZone,
    edgeCreation: EdgeCreation,
    panZoom: PanZoom
  ) {
    this.store = store;
    this.actions = actions;
    this.trash = trash;
    this.edgeCreation = edgeCreation;
    this.panZoom = panZoom;
  }

  public attach(selection: NodeSelection): void {
    const behavior = d3
      .drag<SVGGElement, GraphNode>()
      .filter((event: MouseEvent) => event.button === 0 && !this.panZoom.isPanGesture(event))
      .on('start', (event: NodeDragEvent, node) => this.onStart(event, node))
      .on('drag', (event: NodeDragEvent) => this.onDrag(event))
      .on('end', (event: NodeDragEvent, node) => this.onEnd(event, node));

    selection.call(behavior);
  }

  private onStart(event: NodeDragEvent, node: GraphNode): void {
    if ((event.sourceEvent as MouseEvent).shiftKey) {
      this.edgeCreation.begin(node);
      return;
    }
    if (!node.selected) this.store.selectOnly(node.id);
    this.trash.show();
  }

  private onDrag(event: NodeDragEvent): void {
    if (this.edgeCreation.isActive()) {
      this.edgeCreation.update(event);
      return;
    }
    this.store.moveSelected(event.dx, event.dy);

    const source = event.sourceEvent as MouseEvent;
    this.trash.setActive(this.trash.isOver(source.clientX, source.clientY));
  }

  private async onEnd(event: NodeDragEvent, node: GraphNode): Promise<void> {
    if (this.edgeCreation.isActive()) {
      await this.edgeCreation.finish(event);
      return;
    }

    const source = event.sourceEvent as MouseEvent;
    const droppedInTrash = this.trash.isOver(source.clientX, source.clientY);
    this.trash.hide();

    if (droppedInTrash) {
      const selected = this.store.getSelectedNodes();
      const ids = selected.length > 0 ? selected.map((n) => n.id) : [node.id];
      this.actions.deleteNodes(ids);
    }
  }
}
