///////////////////////////////////////////////////////////////////////////////////
// Copied from https://github.com/makoConstruct/ValueMap/blob/master/ValueMap.ts //
///////////////////////////////////////////////////////////////////////////////////

function swapRemoveArrayItemAt(ar: any[], i: number) {
    //a constant time array removal operation that does not preserve order
    ar[i] = ar[ar.length - 1];
    ar.pop();
}

export default class HashMap<K, V> {
    m = new Map<number, { k: K; v: V }[]>();
    size: number = 0;
    constructor(private hash: (k: K) => number, private trueEqual: (a: K, b: K) => boolean) {}
    set(k: K, v: V): V | undefined {
        //returns the old v for that k
        var kh = this.hash(k);
        var bucket = this.m.get(kh);
        if (bucket) {
            var i = 0;
            do {
                //there are no empty buckets, so bucket[0] is guaranteed to be there
                var bi = bucket[i];
                if (this.trueEqual(k, bi.k)) {
                    var oldv = bi.v;
                    bi.v = v;
                    return oldv;
                }
                ++i;
            } while (i < bucket.length);
            bucket.push({ k, v });
            this.size += 1;
            return undefined;
        } else {
            this.m.set(kh, [{ k, v }]);
            this.size += 1;
            return undefined;
        }
    }
    get(k: K): V | undefined {
        var kh = this.hash(k);
        var bucket = this.m.get(kh);
        if (bucket) {
            var i = 0;
            do {
                //there are no empty buckets, so bucket[0] is guaranteed to be there
                var bi = bucket[i];
                if (this.trueEqual(k, bi.k)) {
                    return bi.v;
                }
                ++i;
            } while (i < bucket.length);
            return undefined;
        } else {
            return undefined;
        }
    }
    delete(k: K): V | undefined {
        //returns the V associated with the K if there was one
        var kh = this.hash(k);
        var bucket = this.m.get(kh);
        if (bucket) {
            var i = 0;
            do {
                //there are no empty buckets, so bucket[0] is guaranteed to be there
                var bi = bucket[i];
                if (this.trueEqual(k, bi.k)) {
                    swapRemoveArrayItemAt(bucket, i);
                    this.size -= 1;
                    return bi.v;
                }
                ++i;
            } while (i < bucket.length);
        }
        return undefined;
    }
    has(k: K): boolean {
        return this.get(k) !== undefined;
    }
    *all(): Iterable<V> {
        for (const bucket of this.m.values()) {
            yield* bucket.map(p => p.v);
        }
    }
}
