import { TiedList } from './TiedList';

export const __DEV__: boolean = true; // Tsdx lied; it's not defined elsewhere; not reachable anyway
export type Comparer<T> = (t: T, y: T) => number;

/** Results can be empty iff elements is empty. */
export function maxBy<T>(
    elements: Iterable<HTMLElement>,
    selector: (element: HTMLElement) => T | undefined,
    comparer: Comparer<T>
): { element: HTMLElement; value: T }[] {
    const bests = new TiedList<{ element: HTMLElement; value: T }>((a, b) => comparer(a.value, b.value));

    for (const element of elements) {
        const value = selector(element);
        if (value === undefined) continue;

        bests.add({ element, value });
    }

    const results = bests.getUnderlyingList();
    results.sort((a, b) => comparer(a.value, b.value));
    return results;
}

export function maxByAround<T>(
    node: HTMLElement,
    selector: (element: HTMLElement) => T | undefined,
    comparer: Comparer<T>,
    isViableToAscend: (element: HTMLElement) => boolean = _ => true,
    isViableToDescend: (element: HTMLElement) => boolean = _ => true
): { element: HTMLElement; value: T }[] {
    return maxBy<T>(walkAround(node, isViableToAscend, isViableToDescend), selector, comparer);
}
function* walkAround(
    node: HTMLElement,
    isViableToAscend: (element: HTMLElement) => boolean,
    isViableToDescend: (element: HTMLElement) => boolean
): Iterable<HTMLElement> {
    yield node;

    if (isViableToDescend(node)) {
        for (const child of node.children) {
            if (child instanceof HTMLElement) {
                yield* walkAround(child, _ => false, isViableToDescend);
            }
        }
    }

    if (isViableToAscend(node)) {
        for (const sibling of siblingOf(node)) {
            if (sibling instanceof HTMLElement) {
                yield* walkAround(sibling, _ => false, isViableToDescend);
            }
        }

        const parent = node.parentElement;
        if (parent != null) {
            yield* walkAround(parent, isViableToAscend, _ => false);
        }
    }
}

function* siblingOf(node: Element): Iterable<Element> {
    for (let sibling = node.nextElementSibling; sibling != null; sibling = sibling.nextElementSibling) {
        yield sibling;
    }
    for (let sibling = node.previousElementSibling; sibling != null; sibling = sibling.previousElementSibling) {
        yield sibling;
    }
}

export function assert(condition: boolean, msg?: string): asserts condition {
    if (!condition) {
        throw new Error(msg);
    }
}
export function getDepth(element: Element): number {
    let parentCount = 0;
    let parent: Element | null = element.parentElement;
    while (parent != null) {
        parentCount++;
        parent = parent.parentElement;
    }
    return parentCount;
}

// combines comparers as tie breakers
export function combine<T>(...comparers: Comparer<T>[]): Comparer<T> {
    if (comparers.length === 0) throw new Error('At least one comparer is required');

    return (a, b) => {
        for (const comparer of comparers) {
            const comparison = comparer(a, b);
            if (comparison !== 0) {
                return comparison;
            }
        }
        return 0;
    };
}

/** Creates random string from lowercase letters and digits. */
export function createRandomString(length: number): string {
    // see https://stackoverflow.com/a/1349426/308451
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
/** Gets the index in sequence at which second starts; or -1 if the second sequence doesn't exist anywhere in the first. */
export function sequenceIndexOf<T>(first: Iterable<T>, second: T[]): number {
    if (second.length === 0) throw new Error('second must at least have one element');

    let i = 0;
    let currentIndex = 0;
    for (const current of first) {
        if (current === second[i]) {
            i++;
            if (i === second.length) {
                return currentIndex - second.length + 1;
            }
        } else if (i !== 0) {
            if (current === second[0]) {
                i = 1;
            }
        } else {
            i = 0;
        }
        currentIndex++;
    }
    return -1;
}
