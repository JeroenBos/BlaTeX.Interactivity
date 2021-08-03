// Represents a list that contains all ties according to a certain comparer.
export class TiedList<T> {
    private readonly comparer: (a: T, b: T) => number;
    private readonly data: T[] = [];

    public constructor(comparer: (a: T, b: T) => number) {
        this.comparer = comparer;
    }

    getUnderlyingList() {
        return this.data;
    }
    add(element: T): void {
        if (this.data.length == 0) {
            this.data.push(element);
        }
        else {
            const comparison = this.comparer(element, this.data[0]);
            if (comparison == 0) {
                this.data.push(element);
            }
            else if (comparison > 0) {
                this.data.length = 0; // empties the list   
                this.data.push(element);
            }
        }
    }
}
