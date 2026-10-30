import sinaloaPreset from '../assets/sinaloa-graph.json';
import type { Edge, GraphNode } from '../types/dijkstra-types.js';

export interface GraphData {
  nodes: GraphNode[];
  edges: Edge[];
}

interface RawNode {
  id?: unknown;
  label?: unknown;
  x?: unknown;
  y?: unknown;
}

interface RawEdge {
  from?: unknown;
  to?: unknown;
  weight?: unknown;
}

interface RawGraph {
  nodes: RawNode[];
  edges: RawEdge[];
}

export class GraphLoaderService {
  public static normalizeGraph(rawNodes: RawNode[], rawEdges: RawEdge[]): GraphData {
    const nodes: GraphNode[] = rawNodes.map((n, index) => {
      const id = String(n.id ?? `node-${index}`);
      return {
        id,
        label: String(n.label ?? id),
        x: typeof n.x === 'number' ? n.x : Math.random() * 500 + 50,
        y: typeof n.y === 'number' ? n.y : Math.random() * 500 + 50,
        selected: false,
      };
    });

    const ids = new Set(nodes.map((n) => n.id));
    const edges: Edge[] = [];
    for (const e of rawEdges) {
      const from = String(e.from);
      const to = String(e.to);
      if (!ids.has(from) || !ids.has(to)) {
        console.warn(`Arista ignorada: ${from} → ${to} referencia un nodo que no existe.`);
        continue;
      }
      edges.push({ from, to, weight: Number(e.weight) || 1 });
    }

    return { nodes, edges };
  }

  public static getSinaloaPreset(): GraphData {
    const preset: RawGraph = sinaloaPreset;
    return this.normalizeGraph(preset.nodes, preset.edges);
  }

  public static async parseJsonFile(file: File): Promise<GraphData> {
    const parsed = JSON.parse(await file.text());

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('El archivo JSON debe contener las propiedades "nodes" y "edges" como arreglos.');
    }
    return this.normalizeGraph(parsed.nodes, parsed.edges);
  }
}