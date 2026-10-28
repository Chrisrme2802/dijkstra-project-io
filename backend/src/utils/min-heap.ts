export interface HeapItem {
  node: string;
  priority: number;
}

export class MinHeap {
  private heap: HeapItem[] = [];

  public push(item: HeapItem): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public pop(): HeapItem | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0 && bottom !== undefined) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      
      const current = this.heap[index];
      const parent = this.heap[parentIndex];

      if (!current || !parent) break;

      if (current.priority >= parent.priority) break;

      // intercambio seguro
      this.heap[index] = parent;
      this.heap[parentIndex] = current;
      
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      const currentItem = this.heap[smallest];
      const leftItem = this.heap[left];
      const rightItem = this.heap[right];

      if (left < length && leftItem && currentItem && leftItem.priority < currentItem.priority) {
        smallest = left;
      }

      const targetItem = this.heap[smallest];
      if (right < length && rightItem && targetItem && rightItem.priority < targetItem.priority) {
        smallest = right;
      }

      if (smallest === index) break;

      const temp = this.heap[index];
      const smallestTemp = this.heap[smallest];

      if (temp && smallestTemp) {
        this.heap[index] = smallestTemp;
        this.heap[smallest] = temp;
      }

      index = smallest;
    }
  }
}