import { Clipboard } from './interactions/clipboard.js';
import { CanvasEvents } from './interactions/canvas-events.js';
import { EdgeCreation } from './interactions/edge-creation.js';
import { GraphActions } from './interactions/graph-actions.js';
import { MarkerDrag } from './interactions/marker-drag.js';
import { NodeDrag } from './interactions/node-drag.js';
import { NodeEvents } from './interactions/node-events.js';
import { PanZoom } from './interactions/pan-zoom.js';
import { SelectionBox } from './interactions/selection-box.js';
import { TrashZone } from './interactions/trash-zone.js';
import { GraphHighlight } from './playback/graph-highlight.js';
import { PlaybackController } from './playback/playback-controller.js';
import { GraphRenderer } from './render/graph-renderer.js';
import { SoundEffects } from './services/sound-effects.js';
import { GraphStore } from './state/graph-store.js';
import { DistanceTable } from './ui/distance-table.js';
import { ExecuteButton } from './ui/execute-button.js';
import { Modal } from './ui/modal.js';
import { PlaybackControls } from './ui/playback-controls.js';
import { PresetControls } from './ui/preset-controls.js';
import { StepPanel } from './ui/step-panel.js';
import { Toast } from './ui/toast.js';

/**
 * Ensambla la aplicación. Aquí SOLO se crean los módulos y se conectan entre sí;
 * la lógica vive en cada módulo. El orden de las secciones sigue el flujo de datos:
 *   estado → render → reproducción → interacciones → controles.
 */
export function createApp(): void {
  // 1. Servicios y UI global
  const sounds = new SoundEffects();
  const toast = new Toast();
  const modal = new Modal();

  // 2. Estado y dibujo
  const store = new GraphStore();
  const renderer = new GraphRenderer('graph-canvas', store);

  // 3. Reproducción del algoritmo y sus "vistas"
  const playback = new PlaybackController();
  new GraphHighlight(renderer, playback);
  new DistanceTable(store, playback);
  new StepPanel(playback);
  new PlaybackControls(playback);

  playback.on('stepChanged', ({ initial }) => {
    if (!initial) sounds.playStep();
  });
  playback.on('finished', ({ path }) => {
    if (path.length > 0) sounds.playSuccess();
  });

  // 4. Interacciones sobre el lienzo
  const actions = new GraphActions(store, modal, toast, sounds);
  const panZoom = new PanZoom(renderer);
  const trash = new TrashZone();
  const edgeCreation = new EdgeCreation(renderer, store, actions);
  const nodeDrag = new NodeDrag(renderer, store, actions, trash, edgeCreation, panZoom);
  const nodeEvents = new NodeEvents(store, actions, nodeDrag, panZoom);

  renderer.onNodeEnter((nodes) => nodeEvents.attach(nodes));
  new SelectionBox(renderer, store, panZoom);
  new CanvasEvents(renderer, actions, panZoom);
  new MarkerDrag(renderer, store);
  new Clipboard(store, toast, sounds);

  // 5. Controles de la interfaz
  new PresetControls(store, playback, toast, sounds);
  new ExecuteButton(store, playback, toast);
}
