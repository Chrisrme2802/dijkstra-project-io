import type { Request, Response } from 'express';
import { DijkstraService } from '../services/dijkstra-service.js';
import type { DijkstraRequest } from '../types/dijkstra-types.js';

export class DijkstraController {
  public static calculate(req: Request, res: Response): void {
    try {
      const body = req.body as Partial<DijkstraRequest>;

      const validationError = DijkstraController.validate(body);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      res.json(DijkstraService.solve(body as DijkstraRequest));
    } catch (error) {
      console.error('Error procesando Dijkstra:', error);
      res.status(500).json({ error: 'Error interno al procesar el algoritmo' });
    }
  }

  private static validate(body: Partial<DijkstraRequest> | undefined): string | null {
    if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges) || !body.startNode || !body.targetNode) {
      return 'Faltan parámetros requeridos: nodes, edges, startNode, targetNode';
    }

    const ids = new Set(body.nodes.map((n) => n.id));
    if (!ids.has(body.startNode)) return `El nodo de inicio "${body.startNode}" no existe en el grafo.`;
    if (!ids.has(body.targetNode)) return `El nodo meta "${body.targetNode}" no existe en el grafo.`;

    if (body.edges.some((e) => !(e.weight > 0))) {
      return 'Todas las aristas deben tener un peso numérico mayor a 0.';
    }
    return null;
  }
}
