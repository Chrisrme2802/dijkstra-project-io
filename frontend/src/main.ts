import { GraphRenderer } from './core/graph-renderer.js';
import { GraphInteractions } from './core/graph-interactions.js';
import { MarkerDrag } from './features/marker-drag.js';
import { AnimationController } from './core/animation-controller.js';
import { DijkstraApi } from './services/dijkstra-api.js';
import { SoundEffects } from './services/sound-effects.js';
import { UIFeedback } from './features/ui-feedback.js';
import { SelectionClipboard } from './core/selection-clipboard.js';
import { GraphLoaderService } from './services/graph-loader.js';

document.addEventListener('DOMContentLoaded', () => {
  // globales
  const sounds = new SoundEffects();
  const ui = new UIFeedback();

  // visual
  const renderer = new GraphRenderer('graph-canvas');
  const animController = new AnimationController(renderer, sounds);

  // interacciones
  const interactions = new GraphInteractions(renderer, ui, sounds);
  new SelectionClipboard(renderer, interactions, ui, sounds);
  new MarkerDrag(renderer);

  const btnExecute = document.getElementById('btn-execute') as HTMLButtonElement | null;

  // presets
  const btnLoadSinaloa = document.getElementById('btn-load-sinaloa') as HTMLButtonElement | null;
  const btnUploadJson = document.getElementById('btn-upload-json') as HTMLButtonElement | null;
  const fileInputJson = document.getElementById('file-input-json') as HTMLInputElement | null;

  btnLoadSinaloa?.addEventListener('click', () => {
    try {
      const data = GraphLoaderService.getSinaloaPreset();
      
      renderer.loadGraph(data.nodes, data.edges);
      
      interactions.rebindNodeEvents();

      sounds.playSuccess?.();
      ui.showToast('Mapa de Sinaloa cargado correctamente', 'success');
    } catch (error: any) {
      ui.showToast('Error al cargar el mapa preset', 'error');
    }
  });

  // upload
  btnUploadJson?.addEventListener('click', () => {
    fileInputJson?.click();
  });

  fileInputJson?.addEventListener('change', async (event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    try {
      const data = await GraphLoaderService.parseJsonFile(file);
      
      // renderizar datos con load
      renderer.loadGraph(data.nodes, data.edges);
      
      // recargar eventos
      interactions.rebindNodeEvents();

      ui.showToast(`Grafo '${file.name}' cargado con éxito`, 'success');
      input.value = '';
    } catch (error: any) {
      ui.showToast(error.message || 'Error al procesar el archivo JSON', 'error');
    }
  });

  btnExecute?.addEventListener('click', async () => {
    const startNode = renderer.getStartNodeId();
    const targetNode = renderer.getTargetNodeId();

    if (!startNode || !targetNode) {
      ui.showToast('Define los nodos de Inicio y Meta arrastrando las insignias del panel.', 'error');
      return;
    }

    const requestData = {
      nodes: renderer.getNodes().map((n) => ({ id: n.id, label: n.label })),
      edges: renderer.getEdges().map((e) => ({ from: e.from, to: e.to, weight: e.weight })),
      startNode,
      targetNode,
    };

    try {
      // bloquear botón para evitar spam de peticiones
      btnExecute.disabled = true;
      btnExecute.textContent = 'Calculando...';
      btnExecute.classList.add('opacity-50', 'cursor-not-allowed');

      const response = await DijkstraApi.solve(requestData);

      ui.showToast('Ruta calculada con éxito', 'success');
      animController.loadExecution(response);
      animController.play();

    } catch (error: any) {
      ui.showToast(error.message || 'Error al conectar con el servidor', 'error');
    } finally {
      btnExecute.disabled = false;
      btnExecute.textContent = 'Calcular Ruta';
      btnExecute.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  });
});