/** Constantes de configuración del frontend. Un solo lugar para "números mágicos". */

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Radio visual de un nodo (px en coordenadas del grafo). */
export const NODE_RADIUS = 24;

/** Margen extra al soltar un marcador de Inicio/Meta sobre un nodo. */
export const MARKER_DROP_TOLERANCE = 15;

/** Desplazamiento (px) de los nodos al pegar. */
export const PASTE_OFFSET = 40; 

/** Zoom mínimo y máximo del lienzo. */
export const ZOOM_EXTENT: [number, number] = [0.3, 3];

export const TOAST_DURATION_MS = 3500;

/** El slider de velocidad vale 100..1500; el retraso real es SPEED_BASE_MS - valor. */
export const SPEED_BASE_MS = 1600;
export const DEFAULT_SPEED_MS = 500;
