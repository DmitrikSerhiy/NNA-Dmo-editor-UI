export class Node<T> {
    public next: Node<T> | null = null;
    public prev: Node<T> | null = null;
    constructor(public data: T) {}
}

export interface ILinkedList<T> {
    insertStart(data: T): Node<T>;
    insertEnd(data: T): Node<T>;
    deleteNode(node: Node<T>): void;
    // convert(): T[];
    // size(): number;
    search(comparator: (data: T) => boolean): Node<T> | null;
}


export class DmoList<T> implements ILinkedList<T> {
    private head: Node<T> | null = null;

    constructor() {

    }

    public insertStart(data: T): Node<T> {
        const node = new Node(data);
        if (!this.head) {
            this.head = new Node(data);
        } else {
            this.head.prev = node;
            node.next = this.head;
            this.head = node;
        }
        return node;
    }

    public insertEnd(data: T): Node<T> {
        const node = new Node(data);
        if (!this.head) {
            this.head = node;
        } else {
            const getLast = (node: Node<T>): Node<T> => {
            return node.next ? getLast(node.next) : node;
            };

            const lastNode = getLast(this.head);
            node.prev = lastNode;
            lastNode.next = node;
        }
        return node;
    }

    public deleteNode(node: Node<T>): void {
        if (!node.prev) {
          this.head = node.next;
        } else {
          const prevNode = node.prev;
          prevNode.next = node.next;
        }
    }

    public search(comparator: (data: T) => boolean): Node<T> | null {
        const checkNext = (node: Node<T>): Node<T> | null => {
          if (comparator(node.data)) {
            return node;
          }
          return node.next ? checkNext(node.next) : null;
        };
    
        return this.head ? checkNext(this.head) : null;
      }
}

