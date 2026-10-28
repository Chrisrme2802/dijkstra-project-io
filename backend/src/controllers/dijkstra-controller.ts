import type { Request, Response } from 'express';
import { DijkstraService } from '../services/dijkstra-service.js';
import type { DijkstraRequest } from '../types/dijkstra-types.js';

export class DijkstraController {
  public static calculate(req: Request, res: Response): void {
    try {
      const body = req.body as DijkstraRequest;

      // validación básica del body
      if (!body.nodes || !body.edges || !body.startNode || !body.targetNode) {
        res.status(400).json({
          error: 'Faltan parámetros requeridos: nodes, edges, startNode, targetNode'
        });
        return;
      }

      // invocamos al servicio con los datos de la petición
      const result = DijkstraService.solve(body);

      // respondemos con el JSON del resultado (path, totalDistance, steps)
      res.json(result);
    } catch (error) {
      console.error('Error procesando Dijkstra:', error);
      res.status(500).json({ error: 'Error interno al procesar el algoritmo' });
    }
  }
}