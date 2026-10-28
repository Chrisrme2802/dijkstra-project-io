export interface GraphNode extends Node {
  x: number;
  y: number;
  selected?: boolean;
}

export interface GraphEdge extends Edge {
  id: string;
}

// Las mismas del backend
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

export interface Step {
  stepNumber: number;
  currentNode: string;
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  visited: string[];
  description: string;
  activeEdge?: { from: string; to: string };
}

export interface DijkstraResponse {
  path: string[];
  totalDistance: number;
  steps: Step[];
}