import type { PlaybackController } from '../playback/playback-controller.js';
import { GraphLoaderService } from '../services/graph-loader.js';
import type { SoundEffects } from '../services/sound-effects.js';
import type { GraphStore } from '../state/graph-store.js';
import { byId } from '../utils/dom.js';
import type { Toast } from './toast.js';
import type { GraphData } from '../services/graph-loader.js';

/** Botones "Mapa Sinaloa" y "Custom..." (subir un JSON con el grafo). */
export class PresetControls {
  private store: GraphStore;
  private playback: PlaybackController;
  private toast: Toast;
  private sounds: SoundEffects;

  constructor(store: GraphStore, playback: PlaybackController, toast: Toast, sounds: SoundEffects) {
    this.store = store;
    this.playback = playback;
    this.toast = toast;
    this.sounds = sounds;

    const btnSinaloa = byId('btn-load-sinaloa');
    const btnUpload = byId('btn-upload-json');
    const fileInput = byId<HTMLInputElement>('file-input-json');

    btnSinaloa?.addEventListener('click', () => this.loadSinaloa());
    btnUpload?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', () => void this.loadFile(fileInput));
  }

  private apply(data: GraphData): void {
    this.playback.clear(); // la ejecución anterior ya no corresponde a este grafo
    this.store.load(data.nodes, data.edges);
  }

  private loadSinaloa(): void {
    try {
      this.apply(GraphLoaderService.getSinaloaPreset());
      this.sounds.playSuccess();
      this.toast.show('Mapa de Sinaloa cargado correctamente', 'success');
    } catch {
      this.toast.show('Error al cargar el mapa preset', 'error');
    }
  }

  private async loadFile(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;

    try {
      this.apply(await GraphLoaderService.parseJsonFile(file));
      this.toast.show(`Grafo '${file.name}' cargado con éxito`, 'success');
    } catch (error) {
      this.toast.show(error instanceof Error ? error.message : 'Error al procesar el archivo JSON', 'error');
    } finally {
      input.value = ''; // permite volver a elegir el mismo archivo
    }
  }
}
