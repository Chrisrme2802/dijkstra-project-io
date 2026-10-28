import sinaloaPreset from '../assets/sinaloa-graph.json';
import type { GraphNode, GraphEdge } from '../types/dijkstra-types.js';

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphLoaderService {
  
  public static normalizeGraph(rawNodes: any[], rawEdges: any[]): GraphData {
    const nodes: GraphNode[] = rawNodes.map((n, index) => ({
      id: String(n.id || `node-${index}`),
      label: String(n.label || n.id || `Nodo ${index}`),
      x: typeof n.x === 'number' ? n.x : Math.random() * 500 + 50,
      y: typeof n.y === 'number' ? n.y : Math.random() * 500 + 50,
      selected: false,
    }));

    const edges: GraphEdge[] = rawEdges.map((e, index) => ({
      id: String(e.id || `edge-${e.from}-${e.to}-${index}`), // Si la arista no trae id, se le asigna uno automático
      from: String(e.from),
      to: String(e.to),
      weight: Number(e.weight) || 1,
    }));

    return { nodes, edges };
  }

  public static getSinaloaPreset(): GraphData {
    return this.normalizeGraph(sinaloaPreset.nodes, sinaloaPreset.edges);
  }

  public static async parseJsonFile(file: File): Promise<GraphData> {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('El archivo JSON debe contener las propiedades "nodes" y "edges" como arreglos.');
    }

    return this.normalizeGraph(parsed.nodes, parsed.edges);
  }
}