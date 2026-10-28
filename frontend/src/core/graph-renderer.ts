import * as d3 from 'd3';
import type { GraphNode, GraphEdge, Step } from '../types/dijkstra-types.js';

export class GraphRenderer {
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];

  private startNodeId: string | null = null;
  private targetNodeId: string | null = null;

  private currentVisitedNodes: string[] = [];
  private currentNodeProcessing: string | null = null;
  private activeEdge: { from: string; to: string } | null = null;
  private finalPathEdges: Set<string> = new Set();

  public nodeRadius = 24;

  constructor(svgId: string) {
    this.svg = d3.select<SVGSVGElement, unknown>(`#${svgId}`);
  }

  public getSvg() { return this.svg; }
  public getNodes(): GraphNode[] { return this.nodes; }
  public getEdges(): GraphEdge[] { return this.edges; }
  public getStartNodeId(): string | null { return this.startNodeId; }
  public getTargetNodeId(): string | null { return this.targetNodeId; }

  public loadGraph(nodes: Partial<GraphNode>[], edges: GraphEdge[]): void {
    // reset
    this.startNodeId = null;
    this.targetNodeId = null;
    this.resetVisualStates();

    // nodos
    this.nodes = nodes.map((node, index) => {
      let x = node.x;
      let y = node.y;

      return {
        id: node.id || `node-${index}`,
        label: node.label || node.id,
        x,
        y,
        selected: false,
      } as GraphNode;
    });

    // aristas
    this.edges = edges.map((edge, index) => ({
      id: edge.id || `edge-${edge.from}-${edge.to}-${index}`,
      from: edge.from,
      to: edge.to,
      weight: edge.weight,
    }));

    this.render();
  }

  public addNode(node: GraphNode): void {
    this.nodes.push(node);
    this.render();
  }

  public removeNode(id: string): void {
    this.nodes = this.nodes.filter((n) => n.id !== id);
    this.edges = this.edges.filter((e) => e.from !== id && e.to !== id);

    if (this.startNodeId === id) this.startNodeId = null;
    if (this.targetNodeId === id) this.targetNodeId = null;

    this.render();
  }

  public setStartNode(id: string | null): void {
    this.startNodeId = id;
    this.render();
  }

  public setTargetNode(id: string | null): void {
    this.targetNodeId = id;
    this.render();
  }

  public renderStepState(step: Step): void {
    this.currentVisitedNodes = step.visited || [];
    this.currentNodeProcessing = step.currentNode;
    this.activeEdge = step.activeEdge || null;
    this.finalPathEdges.clear();
    this.render();
  }

  public renderFinalPath(path: string[]): void {
    this.finalPathEdges.clear();
    for (let i = 0; i < path.length - 1; i++) {
      this.finalPathEdges.add(`${path[i]}-${path[i + 1]}`);
    }
    this.currentNodeProcessing = null;
    this.activeEdge = null;
    this.render();
  }

  public resetVisualStates(): void {
    this.currentVisitedNodes = [];
    this.currentNodeProcessing = null;
    this.activeEdge = null;
    this.finalPathEdges.clear();
    this.render();
  }

  public render(): void {
    let mainGroup = this.svg.select<SVGGElement>('g.main-group');

    if (mainGroup.empty()) {
      mainGroup = this.svg.append('g').attr('class', 'main-group');
      mainGroup.append('g').attr('class', 'edges-layer');
      mainGroup.append('g').attr('class', 'nodes-layer');
    }

    // defs para los marcadores de flecha
    if (this.svg.select('defs#marker-defs').empty()) {
      const defs = this.svg.append('defs').attr('id', 'marker-defs');

      const createMarker = (id: string, markerClass: string) => {
        defs
          .append('marker')
          .attr('id', id)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', id === 'temp-arrowhead' ? 8 : this.nodeRadius + 10)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('class', markerClass);
      };

      createMarker('arrowhead', 'edge-marker');
      createMarker('temp-arrowhead', 'temp-edge-marker');
      createMarker('path-arrowhead', 'path-edge-marker');
    }

    // hash map para busqueda de nodos
    const nodeMap = new Map<string, GraphNode>();
    for (const node of this.nodes) {
      nodeMap.set(node.id, node);
    }

    // edges
    const edgesLayer = mainGroup.select<SVGGElement>('g.edges-layer');

    const edgeSelection = edgesLayer
      .selectAll<SVGGElement, GraphEdge>('g.edge-group')
      .data(this.edges, (d) => d.id);

    edgeSelection.exit().remove();

    const edgeEnter = edgeSelection
      .enter()
      .append('g')
      .attr('class', 'edge-group');

    edgeEnter
      .append('line')
      .attr('class', 'edge-line')
      .attr('marker-end', 'url(#arrowhead)');

    edgeEnter
      .append('text')
      .attr('class', 'edge-weight')
      .attr('text-anchor', 'middle');

    const edgeUpdate = edgeEnter.merge(edgeSelection);

    edgeUpdate.each((d, i, nodes) => {
      const group = d3.select(nodes[i]);
    
      const sourceNode = nodeMap.get(d.from);
      const targetNode = nodeMap.get(d.to);

      if (!sourceNode || !targetNode) return;

      const line = group.select('line');

      const isPath = this.finalPathEdges.has(`${d.from}-${d.to}`);
      const isActive = this.activeEdge?.from === d.from && this.activeEdge?.to === d.to;

      if (isPath) {
        line.attr('class', 'edge-line edge-path').attr('marker-end', 'url(#path-arrowhead)');
      } else if (isActive) {
        line.attr('class', 'edge-line edge-active').attr('marker-end', 'url(#arrowhead)');
      } else {
        line.attr('class', 'edge-line').attr('marker-end', 'url(#arrowhead)');
      }

      line
        .attr('x1', sourceNode.x)
        .attr('y1', sourceNode.y)
        .attr('x2', targetNode.x)
        .attr('y2', targetNode.y);

      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;

      group
        .select('text')
        .attr('x', midX)
        .attr('y', midY - 6)
        .text(d.weight);
    });

    // nodos
    const nodesLayer = mainGroup.select<SVGGElement>('g.nodes-layer');

    const nodeSelection = nodesLayer
      .selectAll<SVGGElement, GraphNode>('g.node-group')
      .data(this.nodes, (d) => d.id);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-grab')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`);

    nodeEnter.append('circle').attr('r', this.nodeRadius);

    nodeEnter
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('class', 'fill-slate-200 text-xs font-bold pointer-events-none');

    const nodeUpdate = nodeEnter.merge(nodeSelection);

    nodeUpdate.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    
    // actualizar texto
    nodeUpdate.select('text').text((d) => d.id);

    nodeUpdate.attr('class', (d) => {
      let baseClass = 'node-default';

      if (d.id === this.currentNodeProcessing) {
        baseClass = 'node-processing';
      } else if (d.id === this.startNodeId) {
        baseClass = 'node-start';
      } else if (d.id === this.targetNodeId) {
        baseClass = 'node-target';
      } else if (this.currentVisitedNodes.includes(d.id)) {
        baseClass = 'node-visited';
      }

      const selectedClass = d.selected ? ' node-selected' : '';
      return `node-group ${baseClass}${selectedClass} cursor-grab`;
    });
  }
}