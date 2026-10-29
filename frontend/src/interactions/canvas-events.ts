import type { GraphRenderer } from '../render/graph-renderer.js';
import type { GraphActions } from './graph-actions.js';
import type { PanZoom } from './pan-zoom.js';

/** Eventos sobre el fondo del lienzo: doble clic para crear un nodo. */
export class CanvasEvents {
  constructor(renderer: GraphRenderer, actions: GraphActions, panZoom: PanZoom) {
    const svg = renderer.getSvg();

    svg.on('dblclick', (event: MouseEvent) => {
      event.preventDefault();

      const target = event.target as Element;
      const onBackground = target === svg.node() || target.classList.contains('canvas-bg');
      if (!onBackground || event.shiftKey || panZoom.isPanGesture(event)) return;

      const [x, y] = renderer.pointerInGraph(event);
      void actions.addNodeAt(x, y);
    });
  }
}
