import type { DijkstraRequest, DijkstraResponse } from '../types/dijkstra-types.js';

const API_BASE_URL = 'http://localhost:3000/api';

export class DijkstraApi {
  public static async solve(data: DijkstraRequest): Promise<DijkstraResponse> {
    const response = await fetch(`${API_BASE_URL}/dijkstra`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al conectar con el servidor de Dijkstra');
    }

    return response.json();
  }
}