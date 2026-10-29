import * as d3 from 'd3';

export const MARKER_ARROW = 'arrowhead';
export const MARKER_TEMP = 'temp-arrowhead';
export const MARKER_PATH = 'path-arrowhead';

/** Crea (una sola vez) las puntas de flecha que usan las aristas. */
export function ensureArrowMarkers(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
  nodeRadius: number
): void {
  if (!svg.select('defs#marker-defs').empty()) return;

  const defs = svg.append('defs').attr('id', 'marker-defs');

  const create = (id: string, cssClass: string) => {
    defs
      .append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', id === MARKER_TEMP ? 8 : nodeRadius + 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('class', cssClass);
  };

  create(MARKER_ARROW, 'edge-marker');
  create(MARKER_TEMP, 'temp-edge-marker');
  create(MARKER_PATH, 'path-edge-marker');
}
