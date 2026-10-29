import { NODE_RADIUS } from '../config.js';
import type { Edge, GraphEdge, GraphNode } from '../types/dijkstra-types.js';

/** Clave única de una arista dirigida. También se usa para marcar la ruta final. */
export const edgeKey = (from: string, to: string): string => `${from}\u2192${to}`;

type Listener = () => void;

/**
 * ÚNICA fuente de verdad del grafo: nodos, aristas, selección, inicio y meta.
 * Nadie más debe mutar estos datos; todo cambio pasa por un método de aquí,
 * que avisa a los suscriptores (el renderer se redibuja solo).
 */
export class GraphStore {
  private nodes: GraphNode[] = [];
  private edges: GraphEdge[] = [];
  private startNodeId: string | null = null;
  private targetNodeId: string | null = null;
  private listeners = new Set<Listener>();

  // ---------- suscripción ----------

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  // ---------- lectura ----------

  public getNodes(): readonly GraphNode[] {
    return this.nodes;
  }

  public getEdges(): readonly GraphEdge[] {
    return this.edges;
  }

  public getSelectedNodes(): GraphNode[] {
    return this.nodes.filter((n) => n.selected);
  }

  public getStartNodeId(): string | null {
    return this.startNodeId;
  }

  public getTargetNodeId(): string | null {
    return this.targetNodeId;
  }

  public hasNode(id: string): boolean {
    return this.nodes.some((n) => n.id === id);
  }

  /** Nodo cuyo círculo (más `tolerance` px) contiene el punto, en coordenadas del grafo. */
  public findNodeAt(x: number, y: number, tolerance = 0): GraphNode | undefined {
    const radius = NODE_RADIUS + tolerance;
    return this.nodes.find((n) => Math.hypot(x - n.x, y - n.y) <= radius);
  }

  // ---------- escritura: grafo ----------

  /** Reemplaza todo el grafo. Las aristas con extremos inexistentes se descartan. */
  public load(nodes: readonly GraphNode[], edges: readonly Edge[]): void {
    this.nodes = nodes.map((n) => ({ ...n, selected: false }));
    this.edges = [];
    this.startNodeId = null;
    this.targetNodeId = null;

    const ids = new Set(this.nodes.map((n) => n.id));
    for (const e of edges) {
      if (ids.has(e.from) && ids.has(e.to)) this.upsertEdge(e.from, e.to, e.weight);
    }
    this.notify();
  }

  public addNode(id: string, x: number, y: number): void {
    this.nodes.push({ id, label: id, x, y, selected: false });
    this.notify();
  }

  /** Añade nodos y aristas ya con ids únicos (pegado). Los nuevos quedan seleccionados. */
  public addSubgraph(nodes: readonly GraphNode[], edges: readonly Edge[]): void {
    this.nodes.forEach((n) => (n.selected = false));
    nodes.forEach((n) => this.nodes.push({ ...n, selected: true }));
    edges.forEach((e) => this.upsertEdge(e.from, e.to, e.weight));
    this.notify();
  }

  public removeNodes(ids: readonly string[]): void {
    const doomed = new Set(ids);
    this.nodes = this.nodes.filter((n) => !doomed.has(n.id));
    this.edges = this.edges.filter((e) => !doomed.has(e.from) && !doomed.has(e.to));
    if (this.startNodeId && doomed.has(this.startNodeId)) this.startNodeId = null;
    if (this.targetNodeId && doomed.has(this.targetNodeId)) this.targetNodeId = null;
    this.notify();
  }

  /** Renombra un nodo y mantiene coherentes aristas, inicio y meta. */
  public renameNode(oldId: string, newId: string): boolean {
    if (oldId === newId || this.hasNode(newId)) return false;
    const node = this.nodes.find((n) => n.id === oldId);
    if (!node) return false;

    for (const e of this.edges) {
      if (e.from === oldId) e.from = newId;
      if (e.to === oldId) e.to = newId;
      e.id = edgeKey(e.from, e.to);
    }
    node.id = newId;
    node.label = newId;
    if (this.startNodeId === oldId) this.startNodeId = newId;
    if (this.targetNodeId === oldId) this.targetNodeId = newId;
    this.notify();
    return true;
  }

  /** Crea la arista o actualiza su peso si ya existía. */
  public setEdge(from: string, to: string, weight: number): void {
    this.upsertEdge(from, to, weight);
    this.notify();
  }

  public setStartNode(id: string | null): void {
    this.startNodeId = id;
    this.notify();
  }

  public setTargetNode(id: string | null): void {
    this.targetNodeId = id;
    this.notify();
  }

  // ---------- escritura: posición y selección ----------

  public moveSelected(dx: number, dy: number): void {
    for (const n of this.nodes) {
      if (n.selected) {
        n.x += dx;
        n.y += dy;
      }
    }
    this.notify();
  }

  public clearSelection(): void {
    this.nodes.forEach((n) => (n.selected = false));
    this.notify();
  }

  public setSelection(ids: Iterable<string>): void {
    const selected = new Set(ids);
    this.nodes.forEach((n) => (n.selected = selected.has(n.id)));
    this.notify();
  }

  public selectOnly(id: string): void {
    this.setSelection([id]);
  }

  public addToSelection(id: string): void {
    const node = this.nodes.find((n) => n.id === id);
    if (node) node.selected = true;
    this.notify();
  }

  // ---------- internos ----------

  private upsertEdge(from: string, to: string, weight: number): void {
    const id = edgeKey(from, to);
    const existing = this.edges.find((e) => e.id === id);
    if (existing) existing.weight = weight;
    else this.edges.push({ id, from, to, weight });
  }
}
