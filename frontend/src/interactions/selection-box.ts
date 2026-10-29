import * as d3 from 'd3';
import type { GraphRenderer } from '../render/graph-renderer.js';
import type { GraphStore } from '../state/graph-store.js';
import type { PanZoom } from './pan-zoom.js';

/** Selección múltiple arrastrando un rectángulo sobre el fondo. Ctrl/Cmd suma a la selección. */
export class SelectionBox {
  private renderer: GraphRenderer;
  private store: GraphStore;
  private panZoom: PanZoom;

  private box: d3.Selection<SVGRectElement, unknown, any, any> | null = null;
  private origin: [number, number] | null = null;
  private baseSelection = new Set<string>();

  constructor(renderer: GraphRenderer, store: GraphStore, panZoom: PanZoom) {
    this.renderer = renderer;
    this.store = store;
    this.panZoom = panZoom;

    const svg = renderer.getSvg();
    svg.on('mousedown', (event: MouseEvent) => this.begin(event));
    svg.on('mousemove', (event: MouseEvent) => this.update(event));
    window.addEventListener('mouseup', () => this.finish());
  }

  private isBackground(event: MouseEvent): boolean {
    const target = event.target as Element;
    return target === this.renderer.getSvg().node() || target.classList.contains('canvas-bg');
  }

  private begin(event: MouseEvent): void {
    if (!this.isBackground(event) || event.button !== 0 || this.panZoom.isPanGesture(event)) return;

    const additive = event.ctrlKey || event.metaKey;
    this.baseSelection = new Set(additive ? this.store.getSelectedNodes().map((n) => n.id) : []);
    if (!additive) this.store.clearSelection();

    this.origin = this.renderer.pointerInGraph(event);
    this.box = this.renderer
      .getMainGroup()
      .append('rect')
      .attr('class', 'selection-box')
      .attr('x', this.origin[0])
      .attr('y', this.origin[1])
      .attr('width', 0)
      .attr('height', 0);
  }

  private update(event: MouseEvent): void {
    if (!this.origin || !this.box) return;

    const [cx, cy] = this.renderer.pointerInGraph(event);
    const [ox, oy] = this.origin;
    const x = Math.min(ox, cx);
    const y = Math.min(oy, cy);
    const width = Math.abs(cx - ox);
    const height = Math.abs(cy - oy);

    this.box.attr('x', x).attr('y', y).attr('width', width).attr('height', height);

    const inside = this.store
      .getNodes()
      .filter((n) => n.x >= x && n.x <= x + width && n.y >= y && n.y <= y + height)
      .map((n) => n.id);

    this.store.setSelection([...this.baseSelection, ...inside]);
  }

  private finish(): void {
    this.box?.remove();
    this.box = null;
    this.origin = null;
  }
}
