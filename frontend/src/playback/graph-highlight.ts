import type { GraphRenderer } from '../render/graph-renderer.js';
import { edgeKey } from '../state/graph-store.js';
import type { PlaybackController } from './playback-controller.js';

/** Traduce los eventos de reproducción en resaltado visual sobre el grafo. */
export class GraphHighlight {
  constructor(renderer: GraphRenderer, playback: PlaybackController) {
    playback.on('stepChanged', ({ step }) => {
      renderer.setHighlight({
        visited: step.visited,
        current: step.currentNode,
        activeEdge: step.activeEdge ?? null,
        pathEdges: new Set(),
      });
    });

    playback.on('finished', ({ path, steps }) => {
      const pathEdges = new Set<string>();
      for (let i = 0; i < path.length - 1; i++) pathEdges.add(edgeKey(path[i], path[i + 1]));

      renderer.setHighlight({
        visited: steps[steps.length - 1]?.visited ?? [],
        current: null,
        activeEdge: null,
        pathEdges,
      });
    });

    playback.on('cleared', () => renderer.clearHighlight());
  }
}
