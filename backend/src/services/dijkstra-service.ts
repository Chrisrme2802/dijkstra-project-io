import type { ActiveEdge, DijkstraRequest, DijkstraResponse, Node, Edge, Step } from '../types/dijkstra-types.js';
import { MinHeap } from '../utils/min-heap.js';

type AdjacencyList = Record<string, { node: string; weight: number }[]>;

const fmt = (distance: number): string => (Number.isFinite(distance) ? String(distance) : '∞');

export class DijkstraService {
  public static solve(data: DijkstraRequest): DijkstraResponse {
    const { nodes, edges, startNode, targetNode } = data;
    const adjacency = this.buildAdjacencyList(nodes, edges);

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    nodes.forEach((n) => {
      distances[n.id] = Infinity;
      previous[n.id] = null;
    });
    distances[startNode] = 0;

    const visitedSet = new Set<string>();
    const visitedOrder: string[] = [];
    const steps: Step[] = [];

    const record = (currentNode: string, description: string, activeEdge?: ActiveEdge): void => {
      steps.push({
        stepNumber: steps.length + 1,
        currentNode,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visitedOrder],
        description,
        ...(activeEdge && { activeEdge }),
      });
    };

    const queue = new MinHeap();
    queue.push({ node: startNode, priority: 0 });

    while (!queue.isEmpty()) {
      const item = queue.pop();
      if (!item) break;

      const current = item.node;
      if (visitedSet.has(current)) continue;

      visitedSet.add(current);
      visitedOrder.push(current);
      const currentDist = distances[current] ?? Infinity;

      record(current, `Se selecciona el nodo '${current}' con distancia acumulada de ${fmt(currentDist)}.`);

      if (current === targetNode) break;

      for (const neighbor of adjacency[current] ?? []) {
        if (visitedSet.has(neighbor.node)) continue;

        const candidate = currentDist + neighbor.weight;
        const known = distances[neighbor.node] ?? Infinity;
        const improves = candidate < known;

        if (improves) {
          distances[neighbor.node] = candidate;
          previous[neighbor.node] = current;
          queue.push({ node: neighbor.node, priority: candidate });
        }

        const edge = `${current} ➔ ${neighbor.node}`;
        const calc = `${fmt(currentDist)} + ${neighbor.weight} = ${fmt(candidate)}`;
        record(
          current,
          improves
            ? `Arista ${edge}: ${calc} es menor que ${fmt(known)}. Se actualiza '${neighbor.node}'.`
            : `Arista ${edge}: ${calc} no mejora la distancia actual (${fmt(known)}).`,
          { from: current, to: neighbor.node }
        );
      }
    }

    return {
      path: this.reconstructPath(targetNode, distances, previous),
      totalDistance: distances[targetNode] ?? Infinity,
      steps,
    };
  }

  private static buildAdjacencyList(nodes: Node[], edges: Edge[]): AdjacencyList {
    const adjacency: AdjacencyList = {};
    nodes.forEach((n) => (adjacency[n.id] = []));
    edges.forEach((e) => adjacency[e.from]?.push({ node: e.to, weight: e.weight }));
    return adjacency;
  }

  // backtracking
  private static reconstructPath(
    target: string,
    distances: Record<string, number>,
    previous: Record<string, string | null>
  ): string[] {
    if (!Number.isFinite(distances[target] ?? Infinity)) return [];

    const path: string[] = [];
    let current: string | null = target;
    while (current !== null) {
      path.unshift(current);
      current = previous[current] ?? null;
    }
    return path;
  }
}
