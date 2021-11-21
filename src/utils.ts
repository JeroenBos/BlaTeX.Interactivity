import { TiedList } from './TiedList';

export const __DEV__: boolean = true; // Tsdx lied; it's not defined elsewhere; not reachable anyway
export type Comparer<T> = (a: T, b: T) => number;
export function mapComparer<TSource, TResult>(
    comparer: Comparer<TSource>,
    selector: (source: TResult) => TSource
): Comparer<TResult> {
    return (a, b) => comparer(selector(a), selector(b));
}

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
export function assertEqual(actual: any, expected: any, msg?: string) {
    if (actual !== expected) {
        debugger;

        if (isString(actual) && isString(expected)) {
            msg = msg ?? computeUnequalStringAssertionDescription(actual, expected);
        }
        throw new Error(msg ?? `AssertionError:\n${actual} != '${expected}'`);
    }
}

function computeUnequalStringAssertionDescription(actual: string, expected: string) {
    // const multiline = actual.indexOf("\n") !== -1;
    const diffIndex = firstNonMatchingIndex(actual, expected);
    const long = actual.length > 100;
    const { line, column } = getLineAndColOf(actual, diffIndex);
    if (long) {
        const preellipsis = computeStartIndex(actual) === 0 ? '' : '...';
        const postellipsis = computeEndIndex(actual) === actual.length ? '' : '...';
        const actualSegment = computeSegment(actual);
        const expectedSegment = computeSegment(expected);
        return `AssertionError:\nLine ${line}, column ${column} differ:\n'${preellipsis}${actualSegment}${postellipsis}' != '${expectedSegment}';`;
    } else {
        return `AssertionError:\n${actual}\n != \n'${expected}'`;
    }

    function computeSegment(s: string) {
        const startIndex = computeStartIndex(s);
        const endIndex = computeEndIndex(s);
        return s.substr(startIndex, endIndex - startIndex);
    }
    function computeStartIndex(s: string) {
        const start = Math.max(0, diffIndex - 10);
        for (let i = start; i < diffIndex; i++) {
            if (s[i] === '\n') {
                if (i + 1 !== s.length && s[i + 1] === '\r') return i + 1;
                else return i;
            }
        }
        return start;
    }
    function computeEndIndex(s: string) {
        const end = Math.min(diffIndex + 50, s.length);
        for (let i = diffIndex; i < end; i++) {
            if (s[i] === '\n') {
                return i;
            }
        }
        return end;
    }
}
export function isString(obj: any): obj is string {
    return typeof obj === 'string' || obj instanceof String;
}
export function assert(condition: boolean, msg?: string): asserts condition {
    if (!condition) {
        debugger;
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
export function firstNonMatchingIndex(a: string, b: string): number {
    let i;
    for (i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] !== b[i]) {
            return i;
        }
    }
    if (a.length === b.length) return i;
    return -1;
}

export function getLineAndColOf(s: string, index: number): { line: number; column: number } {
    let lineCount = 0;
    let lineStart = 0;
    for (let i = 0; i <= s.length; i++) {
        if (i === index || i === s.length) {
            return { line: lineCount, column: i - lineStart };
        } else if (s[i] === '\n') {
            lineCount++;
            lineStart = i;
        } else if (s[i] === '\r' && lineStart + 1 === i) {
            lineStart++;
        }
    }
    throw new Error('Index out of range');
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
