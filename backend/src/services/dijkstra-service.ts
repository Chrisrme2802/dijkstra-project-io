import type { DijkstraRequest, DijkstraResponse, Step } from '../types/dijkstra-types.js';
import { MinHeap } from '../utils/min-heap.js';

export class DijkstraService {
  public static solve(data: DijkstraRequest): DijkstraResponse {
    const { nodes, edges, startNode, targetNode } = data;

    // lista de adyacencia
    const adjacencyList: Record<string, { node: string; weight: number }[]> = {};
    
    nodes.forEach(node => {
      adjacencyList[node.id] = [];
    });

    edges.forEach(edge => {
      adjacencyList[edge.from]?.push({ node: edge.to, weight: edge.weight });
    });

    // inicializar HashMaps y conjuntos
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const visitedSet = new Set<string>();
    const visitedOrder: string[] = [];
    const steps: Step[] = [];

    nodes.forEach(node => {
      distances[node.id] = Infinity;
      previous[node.id] = null;
    });

    // distancia al nodo origen siempre es 0
    distances[startNode] = 0;

    const pq = new MinHeap();
    pq.push({ node: startNode, priority: 0 });

    let stepCount = 1;

    // bucle principal de Dijkstra
    while (!pq.isEmpty()) {
      const currentItem = pq.pop();
      if (!currentItem) break;

      // buscar el nodo no visitado con la menor distancia acumulada
      const current = currentItem.node;

      // si ya es definitivo se ignora
      if (visitedSet.has(current)) continue;

      // marcar como visitado
      visitedSet.add(current);
      visitedOrder.push(current);

      const currentDist = distances[current] ?? Infinity;

      // Guardar el estado actual en la bitácora de pasos (para el frontend)
      steps.push({
        stepNumber: stepCount++,
        currentNode: current,
        distances: { ...distances },
        previous: { ...previous },
        visited: [...visitedOrder],
        description: `Se selecciona el nodo '${current}' con distancia acumulada de ${currentDist}.`
      });

      // terminar si alcanzamos al objetivo
      if (current === targetNode) break;

      // vecinos del nodo actual
      const neighbors = adjacencyList[current] || [];
      for (const neighbor of neighbors) {
        if (visitedSet.has(neighbor.node)) continue; // ignorar permanentes

        const newDist = currentDist + neighbor.weight;
        const neighborDist = distances[neighbor.node] ?? Infinity;

        // actualizar si encontramos un camino más corto
        if (newDist < neighborDist) {
          distances[neighbor.node] = newDist;
          previous[neighbor.node] = current;
          // actualizar cola de prioridad
          pq.push({ node: neighbor.node, priority: newDist });
        }
      }
    }

    // backtracking para el camino optimo
    const path: string[] = [];
    let curr: string | null = targetNode;

    if (distances[targetNode] !== Infinity && distances[targetNode] !== undefined) {
      while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr] ?? null;
      }
    }

    return {
      path,
      totalDistance: distances[targetNode] ?? Infinity,
      steps
    };
  }
}