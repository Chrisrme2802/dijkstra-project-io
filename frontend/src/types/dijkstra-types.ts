// mantener sincronizado con backend

export interface Node {
  id: string;
  label?: string;
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export interface DijkstraRequest {
  nodes: Node[];
  edges: Edge[];
  startNode: string;
  targetNode: string;
}

export interface ActiveEdge {
  from: string;
  to: string;
}

export interface Step {
  stepNumber: number;
  currentNode: string;
  distances: Record<string, number | null>;
  previous: Record<string, string | null>;
  visited: string[];
  description: string;
  activeEdge?: ActiveEdge;
}

export interface DijkstraResponse {
  path: string[];
  totalDistance: number | null;
  steps: Step[];
}

// frontend
export interface GraphNode extends Node {
  x: number;
  y: number;
  selected?: boolean;
}

export interface GraphEdge extends Edge {
  id: string;
}