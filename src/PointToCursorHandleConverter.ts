import { assert, maxByAround, getDepth } from './utils';

export const LOCATION_ATTR_NAME = "data-loc";
export type Point = { x: number, y: number };
export type Distance = { dx: number, dy: number };
export type ManhattanDistance = { distanceToLeft: number, distanceToRight: number, distanceToTop: number, distanceToBottom: number };
export type SourceLocation = { start: number, end: number };

export function getCursorIndexByProximity(element: HTMLElement, offset: Distance): number | undefined {
    const point = toPoint(element, offset);
    type T = { distances: MinDistances, loc: SourceLocation, depth: number };

    function select(e: HTMLElement): T | undefined {
        const loc = selectLocation(e);
        if (loc === undefined)
            return undefined;
        const distances = getMinDistanceAndType(getDistance(e, point))

        return { distances, loc, depth: getDepth(e) };
    }

    const bests = maxByAround<T>(element, select, compareByMinHorizontalDistance); // compareByMinHorizontalDistanceWithMaxVerticalDistance(7));
    if (bests.length === 0)
        return undefined;

    const best = bests[0];
    const result = apply(best.value.distances, best.value.loc);
    return result;
}

function compareByMinHorizontalDistance(a: { distances: MinDistances }, b: { distances: MinDistances }) {
    return b.distances.minHorizontalDistance - a.distances.minHorizontalDistance;
}
// @ts-ignore
function compareByMinHorizontalDistanceWithMaxVerticalDistance(maxVerticalDistance: number) {
    return (a: { distances: MinDistances }, b: { distances: MinDistances }) => {
        const aIsCloseEnough = a.distances.minVerticalDistance < maxVerticalDistance;
        const bIsCloseEnough = b.distances.minVerticalDistance < maxVerticalDistance;
        if (aIsCloseEnough && bIsCloseEnough) {
            return compareByMinHorizontalDistance(a, b);
        }
        else if (aIsCloseEnough) {
            return -1;
        }
        else if (bIsCloseEnough) {
            return 1;
        }
        else {
            return 0;
        }
    }
}
function apply(d: MinDistances, loc: SourceLocation): number {
    if (loc.start === loc.end)
        return loc.start;

    switch (d.horizontalType) {
        case HorizontalClosestDistanceType.LeftIn:
        case HorizontalClosestDistanceType.LeftOut:
            return loc.start;
        case HorizontalClosestDistanceType.RightIn:
        case HorizontalClosestDistanceType.RightOut:
            return loc.end;
    }
}
function toPoint(element: Element, offset: Distance): Point {
    return {
        x: element.clientLeft + offset.dx,
        y: element.clientTop + offset.dy,
    }
}

function getDistance(element: HTMLElement, point: Point): ManhattanDistance {

    function distance1D(start: number, end: number, q: number): [number, number] {
        return [q - start, q - end];
    }
    const rect = element.getBoundingClientRect();

    const [distanceToLeft, distanceToRight] = distance1D(rect.left, rect.right, point.x);
    const [distanceToTop, distanceToBottom] = distance1D(rect.top, rect.bottom, point.y);

    return { distanceToLeft, distanceToRight, distanceToTop, distanceToBottom };
}
export function getDistance_FOR_TESTING_ONLY(element: HTMLElement, point: Point): ManhattanDistance {
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



export type MinDistances = {
    minDistance: number,
    minHorizontalDistance: number,
    minVerticalDistance: number,
    horizontalType: HorizontalClosestDistanceType,
    verticalType: VerticalClosestDistanceType,
};
export enum HorizontalClosestDistanceType {
    LeftOut,
    LeftIn,
    RightOut,
    RightIn,
}
export enum VerticalClosestDistanceType {
    TopOut,
    TopIn,
    BottomOut,
    BottomIn,
}
function getMinDistanceAndType(q: ManhattanDistance): MinDistances {
    const minDistance = Math.min(
        Math.abs(q.distanceToBottom),
        Math.abs(q.distanceToLeft),
        Math.abs(q.distanceToRight),
        Math.abs(q.distanceToTop)
    );
    const minHorizontalDistance = Math.min(Math.abs(q.distanceToLeft), Math.abs(q.distanceToRight));
    const minVerticalDistance = Math.min(Math.abs(q.distanceToTop), Math.abs(q.distanceToBottom));

    let horizontal: HorizontalClosestDistanceType;
    if (Math.abs(q.distanceToLeft) < Math.abs(q.distanceToRight)) {
        horizontal = q.distanceToLeft > 0 ? HorizontalClosestDistanceType.LeftOut : HorizontalClosestDistanceType.LeftIn;
    }
    else {
        horizontal = q.distanceToRight > 0 ? HorizontalClosestDistanceType.RightOut : HorizontalClosestDistanceType.RightIn;
    }

    let vertical: VerticalClosestDistanceType;
    if (Math.abs(q.distanceToTop) < Math.abs(q.distanceToBottom)) {
        vertical = q.distanceToTop > 0 ? VerticalClosestDistanceType.TopOut : VerticalClosestDistanceType.TopIn;
    }
    else {
        vertical = q.distanceToBottom > 0 ? VerticalClosestDistanceType.BottomOut : VerticalClosestDistanceType.BottomIn;
    }

    return { minDistance, horizontalType: horizontal, verticalType: vertical, minHorizontalDistance, minVerticalDistance };
}
