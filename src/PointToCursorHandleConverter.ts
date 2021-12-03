import { assert, minByDirectedWalker, getDepth, mapComparer, Comparer, walkAround } from './utils';
import { ManhattenComparerToBoundary } from './jbsnorro/polygons/ManhattanToBoundaryComparer';
import { HorizontalClosestDistanceType, ManhattanOffset, MinDistances } from './jbsnorro/polygons/MinDistances';

export const LOCATION_ATTR_NAME = 'data-loc';
export type Point = { x: number; y: number };
export type Distance = { dx: number; dy: number };

export type SourceLocation = { start: number; end: number };

export function getCursorIndexByProximity(element: HTMLElement, point: Point): number | undefined {
    type T = { distances: MinDistances; loc: SourceLocation; depth: number };

    function select(e: HTMLElement): T | undefined {
        const loc = selectLocation(e);
        if (loc === undefined) return undefined;
        const distances = MinDistances.fromManhattan(getDistance(e, point));

        return { distances, loc, depth: getDepth(e) };
    }

    const comparer: Comparer<MinDistances> = ManhattenComparerToBoundary; // compareByMinHorizontalDistanceWithMaxVerticalDistance(7));
    const bests = minByDirectedWalker<T>(element, select, mapComparerToDistances(comparer));

    // @ts-ignore
    const datalocsDebug = bests.map(b => b.element.attributes['data-loc'].value); // eslint-disable-line @typescript-eslint/no-unused-vars

    if (bests.length === 0) return undefined;
    const best = bests[0];
    const result = apply(best.value.distances, best.value.loc);
    return result;
}
export function getCursorIndexByProximity_FOR_TESTING_ONLY(elements: HTMLElement[], point: Point): MinDistances[] {
    const distances: MinDistances[] = [];
    for (const element of elements) {
        distances.push(MinDistances.fromManhattan(getDistance(element, point)));
    }
    return distances;
}
function mapComparerToDistances(comparer: Comparer<MinDistances>) {
    return mapComparer(comparer, (element: { distances: MinDistances }) => element.distances);
}
function compareByMinHorizontalDistance(a: MinDistances, b: MinDistances) {
    return b.minHorizontalDistance - a.minHorizontalDistance;
}
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compareByMinHorizontalDistanceWithMaxVerticalDistance(maxVerticalDistance: number) {
    return (a: MinDistances, b: MinDistances) => {
        const aIsCloseEnough = a.minVerticalDistance < maxVerticalDistance;
        const bIsCloseEnough = b.minVerticalDistance < maxVerticalDistance;
        if (aIsCloseEnough && bIsCloseEnough) {
            return compareByMinHorizontalDistance(a, b);
        } else if (aIsCloseEnough) {
            return -1;
        } else if (bIsCloseEnough) {
            return 1;
        } else {
            return 0;
        }
    };
}
function apply(d: MinDistances, loc: SourceLocation): number {
    if (loc.start === loc.end) return loc.start;

    switch (d.horizontalType) {
        case HorizontalClosestDistanceType.LeftIn:
        case HorizontalClosestDistanceType.LeftOut:
            return loc.start;
        case HorizontalClosestDistanceType.RightIn:
        case HorizontalClosestDistanceType.RightOut:
            return loc.end;
    }
}

export function getDistance(element: HTMLElement, point: Point): ManhattanOffset {
    function distance1D(start: number, end: number, q: number): { toStart: number; toEnd: number } {
        return { toStart: q - start, toEnd: q - end };
    }
    const rect = element.getBoundingClientRect();

    const { toStart: distanceToLeft, toEnd: distanceToRight } = distance1D(rect.left, rect.right, point.x);
    const { toStart: distanceToTop, toEnd: distanceToBottom } = distance1D(rect.top, rect.bottom, point.y);

    return {
        offsetFromLeft: distanceToLeft,
        offsetFromRight: distanceToRight,
        offsetFromTop: distanceToTop,
        offsetFromBottom: distanceToBottom,
    };
}
export function getDistance_FOR_TESTING_ONLY(element: HTMLElement, point: Point): ManhattanOffset {
    return getDistance(element, point);
}

export function getElementsWithSourceLocation(element: HTMLElement, point: Point): ManhattanOffset {
    return getDistance(element, point);
}

/** Returns the source location of the element, if present. */
function selectLocation(element: HTMLElement): SourceLocation | undefined {
    if (element.hasAttribute(LOCATION_ATTR_NAME)) {
        const s = element.getAttribute(LOCATION_ATTR_NAME);
        assert(s !== null, `value of '${LOCATION_ATTR_NAME}' missing`);

        const i = s.indexOf(',');
        assert(i > 0, `Invalid '${LOCATION_ATTR_NAME}', comma missing`);

        const start = parseInt(s.substring(0, i), undefined);
        const end = parseInt(s.substring(i + 1), undefined);
        if (!isNaN(start) && !isNaN(end))
            return { start, end };
    }
    return undefined;
}

export function getHtmlElementsWithDataloc(
    node: HTMLElement,
    isViableToAscend: (element: HTMLElement) => boolean = _ => true,
    isViableToDescend: (element: HTMLElement) => boolean = _ => true
): HTMLElement[] {
    const result = [];
    for (const element of walkAround(node, isViableToAscend, isViableToDescend)) {
        if (selectLocation(element) !== undefined) {
            result.push(element);
        }
    }
    return result;
}
