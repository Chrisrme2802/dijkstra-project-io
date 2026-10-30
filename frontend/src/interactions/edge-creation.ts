import * as d3 from 'd3';
import type { GraphRenderer } from '../render/graph-renderer.js';
import { MARKER_TEMP } from '../render/svg-markers.js';
import type { GraphStore } from '../state/graph-store.js';
import type { GraphNode } from '../types/dijkstra-types.js';
import type { GraphActions } from './graph-actions.js';

export class EdgeCreation {
  private renderer: GraphRenderer;
  private store: GraphStore;
  private actions: GraphActions;

  private source: GraphNode | null = null;
  private line: d3.Selection<SVGLineElement, unknown, any, any> | null = null;

  constructor(renderer: GraphRenderer, store: GraphStore, actions: GraphActions) {
    this.renderer = renderer;
    this.store = store;
    this.actions = actions;
  }

  public isActive(): boolean {
    return this.line !== null;
  }

  public begin(source: GraphNode): void {
    this.source = source;
    this.line = this.renderer
      .getEdgesLayer()
      .append('line')
      .attr('class', 'temp-edge-line')
      .attr('marker-end', `url(#${MARKER_TEMP})`)
      .attr('x1', source.x)
      .attr('y1', source.y)
      .attr('x2', source.x)
      .attr('y2', source.y);
  }

  public update(event: unknown): void {
    if (!this.line) return;
    const [x, y] = this.renderer.pointerInGraph(event);
    this.line.attr('x2', x).attr('y2', y);
  }

  public async finish(event: unknown): Promise<void> {
    const source = this.source;
    this.line?.remove();
    this.line = null;
    this.source = null;
    if (!source) return;

    const [x, y] = this.renderer.pointerInGraph(event);
    const target = this.store.findNodeAt(x, y);
    if (target && target.id !== source.id) {
      await this.actions.promptEdgeWeight(source.id, target.id);
    }
  }
}
