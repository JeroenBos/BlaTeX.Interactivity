import { assert, minByDirectedWalker, getDepth, mapComparer, Comparer, walkAround } from './utils';
import { ManhattanDistanceComparer } from './jbsnorro/polygons/ManhattanDistanceComparer';
import { HorizontalClosestDistanceType, ManhattanOffset, MinDistances } from './jbsnorro/polygons/MinDistances';
import { SourceLocation, SourceLocationComposition } from './SourceLocationComposition';

export const LOCATION_ATTR_NAME = 'data-loc';
export type Point = { x: number; y: number };
export type Distance = { dx: number; dy: number };


/** 
 * Gets the index in the source that the point represents, where source mapping is communicated through `data-loc` attributes.
 * @param element The HTML element in which the source location is searched.
 * @param point The point on screen which is to be mapped the a source location.
 * @returns The source index to which the point points, or undefined is it points nowhere.
*/
export function getCursorIndexByProximity(element: HTMLElement, point: Point): number | undefined {
    type T = { distances: MinDistances; loc: SourceLocation; depth: number };

    function* select(e: HTMLElement): Iterable<T> | undefined {
        const locs = selectLocation(e);
        if (locs === undefined) return undefined;

        for (const { segmentRect, loc } of locs.getSegmentRectanglesAndSourceLocations(e.getBoundingClientRect())) {
            const distances = MinDistances.fromManhattan(getDistanceToRect(segmentRect, point));

            yield { distances, loc, depth: getDepth(e) };
        }
    }

    const comparer: Comparer<MinDistances> = ManhattanDistanceComparer;
    const bests = minByDirectedWalker<T>(element, select, mapComparerToDistances(comparer));

    // @ts-ignore
    const datalocsDebug = bests.map(b => b.element.attributes[LOCATION_ATTR_NAME].value); // eslint-disable-line @typescript-eslint/no-unused-vars

    if (bests.length === 0) return undefined;
    const best = bests[0];
    const result = apply(best.value.distances, best.value.loc);
    return result;
}

function mapComparerToDistances(comparer: Comparer<MinDistances>) {
    return mapComparer(comparer, (element: { distances: MinDistances }) => element.distances);
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

export function getDistance(element: HTMLElement, point: Point, getSegment: ((r: DOMRect) => DOMRect) = _ => _): ManhattanOffset {
    const rect = element.getBoundingClientRect();
    const segment = getSegment(rect);
    return getDistanceToRect(segment, point)
}
export function getDistanceToRect(segment: DOMRect, point: Point) {
    function distance1D(start: number, end: number, q: number): { toStart: number; toEnd: number } {
        return { toStart: q - start, toEnd: q - end };
    }
    const { toStart: distanceToLeft, toEnd: distanceToRight } = distance1D(segment.left, segment.right, point.x);
    const { toStart: distanceToTop, toEnd: distanceToBottom } = distance1D(segment.top, segment.bottom, point.y);

    return {
        offsetFromLeft: distanceToLeft,
        offsetFromRight: distanceToRight,
        offsetFromTop: distanceToTop,
        offsetFromBottom: distanceToBottom,
    };
}

/** @returns the source location of the element, if present. */
function selectLocation(element: HTMLElement): SourceLocationComposition | undefined {
    if (element.hasAttribute(LOCATION_ATTR_NAME)) {
        const s = element.getAttribute(LOCATION_ATTR_NAME);
        assert(s !== null, `value of '${LOCATION_ATTR_NAME}' missing`);

        const i = s.indexOf(',');
        assert(i > 0, `Invalid '${LOCATION_ATTR_NAME}', comma missing`);

        const j = s.indexOf(';');

        const start = parseInt(s.substring(0, i), undefined);
        const end = parseInt(s.substring(i + 1, j === -1 ? undefined : j), undefined);
        const segments = j === -1 ? 1 : parseInt(s.substring(j + 1));
        if (!isNaN(start) && !isNaN(end) && !isNaN(segments)) {
            return new SourceLocationComposition(start, end, segments);
        }
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
