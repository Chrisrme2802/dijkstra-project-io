import type { PlaybackController } from '../playback/playback-controller.js';
import type { GraphStore } from '../state/graph-store.js';
import type { Step } from '../types/dijkstra-types.js';
import { byId } from '../utils/dom.js';

export class DistanceTable {
  private store: GraphStore;
  private body = byId('node-distance-table-body');

  constructor(store: GraphStore, playback: PlaybackController) {
    this.store = store;
    playback.on('stepChanged', ({ step }) => this.render(step));
    playback.on('cleared', () => this.showMessage('Sin datos de ejecución.'));
  }

  private render(step: Step): void {
    if (!this.body) return;

    const nodes = this.store.getNodes();
    if (nodes.length === 0) {
      this.showMessage('No hay nodos en el lienzo.');
      return;
    }

    const rows = nodes.map((node) => {
      const distance = step.distances[node.id];
      const unreached = distance === null || distance === undefined || !Number.isFinite(distance);
      const isCurrent = step.currentNode === node.id;
      const isVisited = step.visited.includes(node.id);

      const row = document.createElement('tr');
      row.className =
        'table-row-base' +
        (isCurrent ? ' table-row-current' : isVisited ? ' table-row-visited' : '');

      const nodeCell = document.createElement('td');
      nodeCell.className = 'table-cell-node';
      const inner = document.createElement('div');
      inner.className = 'table-node-inner';
      const name = document.createElement('span');
      name.textContent = node.id;
      inner.appendChild(name);
      if (isCurrent) {
        const dot = document.createElement('span');
        dot.className = 'pulse-dot';
        inner.appendChild(dot);
      }
      nodeCell.appendChild(inner);

      // distancia
      const distCell = document.createElement('td');
      distCell.className = `table-cell-dist ${unreached ? 'table-dist-infinity' : 'table-dist-value'}`;
      distCell.textContent = unreached ? '∞' : String(distance);

      // previo
      const prevCell = document.createElement('td');
      prevCell.className = 'table-cell-prev';
      prevCell.textContent = step.previous[node.id] ?? '-';

      row.append(nodeCell, distCell, prevCell);
      return row;
    });

    this.body.replaceChildren(...rows);
  }

  private showMessage(message: string): void {
    if (!this.body) return;
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.className = 'table-empty-cell';
    cell.textContent = message;
    row.appendChild(cell);
    this.body.replaceChildren(row);
  }
}