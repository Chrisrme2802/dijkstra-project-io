import * as d3 from 'd3';
import type { GraphRenderer } from '../core/graph-renderer.js';
import type { GraphNode } from '../types/dijkstra-types.js';

const PREVIEW_BASE = 'fixed pointer-events-none z-50 rounded-full px-3 py-1 text-xs font-bold shadow-lg border -translate-x-1/2 -translate-y-1/2';
const PREVIEW_START = `${PREVIEW_BASE} bg-amber-500/90 border-amber-400 text-amber-950`;
const PREVIEW_TARGET = `${PREVIEW_BASE} bg-emerald-500/90 border-emerald-400 text-emerald-950`;

export class MarkerDrag {
  private renderer: GraphRenderer;
  private dragPreview: HTMLDivElement | null = null;

  constructor(renderer: GraphRenderer) {
    this.renderer = renderer;
    this.initMarkerEvents('drag-start', 'start');
    this.initMarkerEvents('drag-target', 'target');
  }

  private initMarkerEvents(elementId: string, type: 'start' | 'target'): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const svg = this.renderer.getSvg();
    const svgNode = svg.node();
    if (!svgNode) return;

    d3.select(element).call(
      d3
        .drag<HTMLElement, unknown>()
        .on('start', (event) => {
          this.dragPreview = document.createElement('div');
          
          // Asignamos la constante correspondiente
          this.dragPreview.className = type === 'start' ? PREVIEW_START : PREVIEW_TARGET;
          this.dragPreview.innerText = type === 'start' ? 'INICIO' : 'META';

          const srcEvent = event.sourceEvent as MouseEvent;
          this.dragPreview.style.left = `${srcEvent.clientX}px`;
          this.dragPreview.style.top = `${srcEvent.clientY}px`;
          document.body.appendChild(this.dragPreview);

          element.style.opacity = '0.4';
        })
        .on('drag', (event) => {
          if (!this.dragPreview) return;
          const srcEvent = event.sourceEvent as MouseEvent;
          this.dragPreview.style.left = `${srcEvent.clientX}px`;
          this.dragPreview.style.top = `${srcEvent.clientY}px`;
        })
        .on('end', (event) => {
          if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
          }
          element.style.opacity = '1';

          // Usar el contenedor transformado 'g.main-group' en lugar del SVG raíz
          const mainGroupNode = svg.select<SVGGElement>('g.main-group').node() || svgNode;
          const [x, y] = d3.pointer(event.sourceEvent, mainGroupNode);
          const node = this.findNodeAtPosition(x, y);

          if (node) {
            if (type === 'start') {
              this.renderer.setStartNode(node.id);
            } else {
              this.renderer.setTargetNode(node.id);
            }
          }
        })
    );
  }

  private findNodeAtPosition(x: number, y: number): GraphNode | undefined {
    const radius = this.renderer.nodeRadius + 15;
    return this.renderer.getNodes().find((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.hypot(dx, dy) <= radius;
    });
  }
}