import * as d3 from 'd3';
import { ZOOM_EXTENT } from '../config.js';
import type { GraphRenderer } from '../render/graph-renderer.js';

/** Zoom con la rueda y desplazamiento del lienzo con Alt + arrastrar. */
export class PanZoom {
  private altPressed = false;

  constructor(renderer: GraphRenderer) {
    const svg = renderer.getSvg();

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_EXTENT)
      .filter((event: Event) => event.type === 'wheel' || this.isPanGesture(event as MouseEvent))
      .on('zoom', (event) => {
        renderer.getMainGroup().attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    this.bindAltKey(svg);
  }

  /** ¿Este evento es un gesto de "mover el lienzo"? (Alt presionado) */
  public isPanGesture(event: { altKey?: boolean }): boolean {
    return Boolean(event.altKey) || this.altPressed;
  }

  private bindAltKey(svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>): void {
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Alt') return;
      e.preventDefault(); // evita que Alt abra la barra de menús del navegador
      if (!this.altPressed) {
        this.altPressed = true;
        svg.classed('cursor-grab', true);
      }
    });

    const release = () => {
      this.altPressed = false;
      svg.classed('cursor-grab cursor-grabbing', false);
    };

    window.addEventListener('keyup', (e) => {
      if (e.key !== 'Alt') return;
      e.preventDefault();
      release();
    });
    window.addEventListener('blur', release);
  }
}
