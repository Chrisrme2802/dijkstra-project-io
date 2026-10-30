// constantes 

export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const NODE_RADIUS = 24;

export const MARKER_DROP_TOLERANCE = 15;

export const PASTE_OFFSET = 40; 

export const ZOOM_EXTENT: [number, number] = [0.3, 3];

export const TOAST_DURATION_MS = 3500;

export const SPEED_BASE_MS = 1600;
export const DEFAULT_SPEED_MS = 500;
