import * as d3 from 'd3';
import { NODE_RADIUS } from '../config.js';
import { edgeKey } from '../state/graph-store.js';
import type { GraphStore } from '../state/graph-store.js';
import type { ActiveEdge, GraphEdge, GraphNode } from '../types/dijkstra-types.js';
import { ensureArrowMarkers, MARKER_ARROW, MARKER_PATH } from './svg-markers.js';

// estado de la animacion
export interface Highlight {
  visited: readonly string[];
  current: string | null;
  activeEdge: ActiveEdge | null;
  pathEdges: ReadonlySet<string>;
}

const NO_HIGHLIGHT: Highlight = {
  visited: [],
  current: null,
  activeEdge: null,
  pathEdges: new Set(),
};

export type NodeSelection = d3.Selection<SVGGElement, GraphNode, any, any>;
export type NodeEnterHook = (entering: NodeSelection) => void;

// solamente dibuja el contenido del store
export class GraphRenderer {
  private store: GraphStore;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private mainGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  private edgesLayer: d3.Selection<SVGGElement, unknown, any, any>;
  private nodesLayer: d3.Selection<SVGGElement, unknown, any, any>;

  private highlight: Highlight = NO_HIGHLIGHT;
  private nodeEnterHooks: NodeEnterHook[] = [];
  private frameRequested = false;

  constructor(svgId: string, store: GraphStore) {
    this.store = store;

    const svg = d3.select<SVGSVGElement, unknown>(`#${svgId}`);
    if (svg.empty()) throw new Error(`No se encontró el elemento SVG #${svgId}`);
    this.svg = svg;

    ensureArrowMarkers(this.svg, NODE_RADIUS);

    this.mainGroup = this.svg.append('g').attr('class', 'main-group');
    this.edgesLayer = this.mainGroup.append('g').attr('class', 'edges-layer');
    this.nodesLayer = this.mainGroup.append('g').attr('class', 'nodes-layer');

    this.store.subscribe(() => this.requestRender());
  }

  // acceso a svg
  public getSvg() {
    return this.svg;
  }

  public getMainGroup() {
    return this.mainGroup;
  }

  public getEdgesLayer() {
    return this.edgesLayer;
  }

  // posicion puntero
  public pointerInGraph(event: unknown): [number, number] {
    return d3.pointer(event, this.mainGroup.node());
  }

  // funcion una vez por cada nodo nuevo
  public onNodeEnter(hook: NodeEnterHook): void {
    this.nodeEnterHooks.push(hook);
  }

  // ---------- estado visual de la animación ----------

  public setHighlight(highlight: Highlight): void {
    this.highlight = highlight;
    this.requestRender();
  }

  public clearHighlight(): void {
    this.setHighlight(NO_HIGHLIGHT);
  }

  // ---------- dibujo ----------

  public requestRender(): void {
    if (this.frameRequested) return;
    this.frameRequested = true;
    requestAnimationFrame(() => {
      this.frameRequested = false;
      this.render();
    });
  }

  public render(): void {
    const nodes = this.store.getNodes();
    const nodeMap = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));
    this.renderEdges(nodeMap);
    this.renderNodes(nodes);
  }

  private renderEdges(nodeMap: Map<string, GraphNode>): void {
    const edges = this.store
      .getEdges()
      .filter((e) => nodeMap.has(e.from) && nodeMap.has(e.to));

    const selection = this.edgesLayer
      .selectAll<SVGGElement, GraphEdge>('g.edge-group')
      .data(edges, (d) => d.id);

    selection.exit().remove();

    const entering = selection.enter().append('g').attr('class', 'edge-group');
    entering.append('line');
    entering.append('text').attr('class', 'edge-weight').attr('text-anchor', 'middle');

    const merged = entering.merge(selection);
    const { activeEdge, pathEdges } = this.highlight;

    const isPath = (d: GraphEdge) => pathEdges.has(edgeKey(d.from, d.to));
    const isActive = (d: GraphEdge) => activeEdge?.from === d.from && activeEdge?.to === d.to;

    merged
      .select<SVGLineElement>('line')
      .attr('class', (d) =>
        isPath(d) ? 'edge-line edge-path' : isActive(d) ? 'edge-line edge-active' : 'edge-line'
      )
      .attr('marker-end', (d) => `url(#${isPath(d) ? MARKER_PATH : MARKER_ARROW})`)
      .attr('x1', (d) => nodeMap.get(d.from)!.x)
      .attr('y1', (d) => nodeMap.get(d.from)!.y)
      .attr('x2', (d) => nodeMap.get(d.to)!.x)
      .attr('y2', (d) => nodeMap.get(d.to)!.y);

    merged
      .select<SVGTextElement>('text')
      .attr('x', (d) => (nodeMap.get(d.from)!.x + nodeMap.get(d.to)!.x) / 2)
      .attr('y', (d) => (nodeMap.get(d.from)!.y + nodeMap.get(d.to)!.y) / 2 - 6)
      .text((d) => String(d.weight));
  }

  private renderNodes(nodes: readonly GraphNode[]): void {
    const selection = this.nodesLayer
      .selectAll<SVGGElement, GraphNode>('g.node-group')
      .data(nodes, (d) => d.id);

    selection.exit().remove();

    const entering = selection.enter().append('g');
    entering.append('circle').attr('r', NODE_RADIUS);
    entering.append('text').attr('class', 'node-label').attr('text-anchor', 'middle').attr('dy', '0.35em');

    // Los eventos se enlazan solo a los nodos nuevos.
    this.nodeEnterHooks.forEach((hook) => hook(entering));

    const merged = entering.merge(selection);
    const visited = new Set(this.highlight.visited);

    merged
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('class', (d) => this.nodeClass(d, visited));

    merged.select('text').text((d) => d.id);
  }

  private nodeClass(node: GraphNode, visited: Set<string>): string {
    let state = 'node-default';
    if (node.id === this.highlight.current) state = 'node-processing';
    else if (node.id === this.store.getStartNodeId()) state = 'node-start';
    else if (node.id === this.store.getTargetNodeId()) state = 'node-target';
    else if (visited.has(node.id)) state = 'node-visited';

    return `node-group ${state}${node.selected ? ' node-selected' : ''} cursor-grab`;
  }
}
