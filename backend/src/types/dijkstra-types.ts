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
}

export interface DijkstraResponse {
  path: string[];
  totalDistance: number;
  steps: Step[];
}