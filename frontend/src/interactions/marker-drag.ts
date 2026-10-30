import * as d3 from 'd3';
import { MARKER_DROP_TOLERANCE } from '../config.js';
import type { GraphRenderer } from '../render/graph-renderer.js';
import type { GraphStore } from '../state/graph-store.js';
import { byId } from '../utils/dom.js';

const PREVIEW_BASE = 'fixed pointer-events-none z-50 rounded-full px-3 py-1 text-xs font-bold shadow-lg border -translate-x-1/2 -translate-y-1/2';
const PREVIEW_START = `${PREVIEW_BASE} bg-amber-500/90 border-amber-400 text-amber-950`;
const PREVIEW_TARGET = `${PREVIEW_BASE} bg-emerald-500/90 border-emerald-400 text-emerald-950`;

type MarkerType = 'start' | 'target';

export class MarkerDrag {
  private renderer: GraphRenderer;
  private store: GraphStore;
  private preview: HTMLDivElement | null = null;

  constructor(renderer: GraphRenderer, store: GraphStore) {
    this.renderer = renderer;
    this.store = store;
    this.bind('drag-start', 'start');
    this.bind('drag-target', 'target');
  }

  private bind(elementId: string, type: MarkerType): void {
    const element = byId(elementId);
    if (!element) return;

    d3.select(element).call(
      d3
        .drag<HTMLElement, unknown>()
        .on('start', (event) => {
          this.preview = document.createElement('div');
          this.preview.className = type === 'start' ? PREVIEW_START : PREVIEW_TARGET;
          this.preview.textContent = type === 'start' ? 'INICIO' : 'META';
          this.movePreview(event.sourceEvent);
          document.body.appendChild(this.preview);
          element.style.opacity = '0.4';
        })
        .on('drag', (event) => this.movePreview(event.sourceEvent))
        .on('end', (event) => {
          this.preview?.remove();
          this.preview = null;
          element.style.opacity = '1';

          const [x, y] = this.renderer.pointerInGraph(event.sourceEvent);
          const node = this.store.findNodeAt(x, y, MARKER_DROP_TOLERANCE);
          if (!node) return;

          if (type === 'start') this.store.setStartNode(node.id);
          else this.store.setTargetNode(node.id);
        })
    );
  }

  private movePreview(event: MouseEvent): void {
    if (!this.preview) return;
    this.preview.style.left = `${event.clientX}px`;
    this.preview.style.top = `${event.clientY}px`;
  }
}