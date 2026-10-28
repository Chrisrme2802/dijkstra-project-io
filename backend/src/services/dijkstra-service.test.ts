import { describe, it, expect } from 'vitest';
import { DijkstraService } from './dijkstra-service.js';
import type { DijkstraRequest } from '../types/dijkstra-types.js';

describe('DijkstraService', () => {
  it('Debe calcular correctamente la ruta óptima y la distancia para el ejercicio', () => {
    const requestData: DijkstraRequest = {
      startNode: 'A',
      targetNode: 'J',
      nodes: [
        { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }, { id: 'E' },
        { id: 'F' }, { id: 'G' }, { id: 'H' }, { id: 'I' }, { id: 'J' }
      ],
      edges: [
        { from: 'A', to: 'B', weight: 6 },
        { from: 'A', to: 'C', weight: 7 },
        { from: 'A', to: 'D', weight: 10 },
        { from: 'B', to: 'E', weight: 5 },
        { from: 'C', to: 'B', weight: 2 },
        { from: 'C', to: 'G', weight: 6 },
        { from: 'D', to: 'F', weight: 4 },
        { from: 'E', to: 'H', weight: 3 },
        { from: 'F', to: 'I', weight: 8 },
        { from: 'G', to: 'I', weight: 4 },
        { from: 'H', to: 'J', weight: 7 },
        { from: 'I', to: 'J', weight: 6 }
      ]
    };

    const result = DijkstraService.solve(requestData);

    // Verificaciones (Assertions)
    expect(result.totalDistance).toBe(21);
    expect(result.path).toEqual(['A', 'B', 'E', 'H', 'J']); // Antes ['A', 'C', 'G', 'I', 'J']
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('debe retornar camino vacío e Infinity cuando el nodo destino no es alcanzable', () => {
    const requestData: DijkstraRequest = {
      startNode: 'A',
      targetNode: 'Z',
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'Z' }],
      edges: [
        { from: 'A', to: 'B', weight: 5 }
        // No hay aristas que vayan hacia 'Z'
      ]
    };

    const result = DijkstraService.solve(requestData);

    expect(result.totalDistance).toBe(Infinity);
    expect(result.path).toEqual([]);
  });
});