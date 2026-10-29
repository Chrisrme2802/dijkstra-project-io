/** Emisor de eventos tipado y mínimo. `Events` mapea nombre de evento → payload. */
export class Emitter<Events extends object> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<keyof Events, Set<(payload: any) => void>>();

  public on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    const registered = set;
    registered.add(handler);
    return () => {
      registered.delete(handler);
    };
  }

  protected emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}
