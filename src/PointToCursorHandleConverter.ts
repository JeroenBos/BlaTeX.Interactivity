import { assert, minByDirectedWalker, getDepth, mapComparer, Comparer, walkAround } from './utils';
import { ManhattenComparerToBoundary } from './ManhattanToBoundaryComparer';

export const LOCATION_ATTR_NAME = "data-loc";
export type Point = { x: number, y: number };
export type Distance = { dx: number, dy: number };


export type ManhattanOffset = { offsetFromLeft: number, offsetFromRight: number, offsetFromTop: number, offsetFromBottom: number };
// "offset" means w.r.t. the positve axis, e.g.:
// - a negative left offset means the point is to the left of the rect.left
// - a negative right offset means the point is to the left of rect.right
// It means that the offset can be regarded as one of the dimensions of the offset vector that, when added to a boundary coordinate, ends up at the the point (at least that location).

export type SourceLocation = { start: number, end: number };

export function getCursorIndexByProximity(element: HTMLElement, point: Point): number | undefined {
    type T = { distances: MinDistances, loc: SourceLocation, depth: number };

    function select(e: HTMLElement): T | undefined {
        const loc = selectLocation(e);
        if (loc === undefined)
            return undefined;
        const distances = MinDistances.fromManhattan(getDistance(e, point));

        return { distances, loc, depth: getDepth(e) };
    }

    const comparer: Comparer<MinDistances> = ManhattenComparerToBoundary; // compareByMinHorizontalDistanceWithMaxVerticalDistance(7));
    const bests = minByDirectedWalker<T>(element, select, mapComparerToDistances(comparer));

    // @ts-ignore
    const datalocsDebug = bests.map(b => b.element.attributes["data-loc"].value); // eslint-disable-line @typescript-eslint/no-unused-vars

    if (bests.length === 0)
        return undefined;
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
function compareByMinHorizontalDistanceWithMaxVerticalDistance(maxVerticalDistance: number) {
    return (a: MinDistances, b: MinDistances) => {
        const aIsCloseEnough = a.minVerticalDistance < maxVerticalDistance;
        const bIsCloseEnough = b.minVerticalDistance < maxVerticalDistance;
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

export function getDistance(element: HTMLElement, point: Point): ManhattanOffset {

    function distance1D(start: number, end: number, q: number): [number, number] {
        return [q - start, q - end];
    }
    const rect = element.getBoundingClientRect();

    const [distanceToLeft, distanceToRight] = distance1D(rect.left, rect.right, point.x);
    const [distanceToTop, distanceToBottom] = distance1D(rect.top, rect.bottom, point.y);

    return { offsetFromLeft: distanceToLeft, offsetFromRight: distanceToRight, offsetFromTop: distanceToTop, offsetFromBottom: distanceToBottom };
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

export type MinDistances = {
    minDistance: number,
    minHorizontalDistance: number,
    minVerticalDistance: number,
    horizontalType: HorizontalClosestDistanceType,
    verticalType: VerticalClosestDistanceType,
};
export namespace MinDistances {
    /** Gets whether the point is contained in the rectangle represented by the MinDistances. */
    export function contains(self: MinDistances) {
        return VerticalClosestDistanceType.IsIn(self.verticalType) && HorizontalClosestDistanceType.IsIn(self.horizontalType);
    }
    /** Gets the manhattan distance from the point to the boundary of the bounding rect represented by the MinDistances. */
    export function getManhattanDistance(self: MinDistances) {

        if (HorizontalClosestDistanceType.IsIn(self.horizontalType)) {
            if (VerticalClosestDistanceType.IsIn(self.verticalType)) {
                return Math.min(self.minHorizontalDistance, self.minVerticalDistance);
            }
            return self.minHorizontalDistance;
        }
        if (VerticalClosestDistanceType.IsIn(self.verticalType)) {
            return self.minVerticalDistance;
        }
        return self.minHorizontalDistance + self.minVerticalDistance;
    }
    export function fromManhattan(q: ManhattanOffset): MinDistances {
        const minDistance = Math.min(
            Math.abs(q.offsetFromBottom),
            Math.abs(q.offsetFromLeft),
            Math.abs(q.offsetFromRight),
            Math.abs(q.offsetFromTop)
        );
        const minHorizontalDistance = Math.min(Math.abs(q.offsetFromLeft), Math.abs(q.offsetFromRight));
        const minVerticalDistance = Math.min(Math.abs(q.offsetFromTop), Math.abs(q.offsetFromBottom));

        let horizontal: HorizontalClosestDistanceType;
        if (Math.abs(q.offsetFromLeft) < Math.abs(q.offsetFromRight)) {
            // according to the definition of Manhattan."offset", a negative offset means to the left of (both offsetToLeft and offsetToRight), and 0 is in.

            horizontal = q.offsetFromLeft >= 0 ? HorizontalClosestDistanceType.LeftIn : HorizontalClosestDistanceType.LeftOut;
        }
        else {
            horizontal = q.offsetFromRight > 0 ? HorizontalClosestDistanceType.RightOut : HorizontalClosestDistanceType.RightIn;
        }

        let vertical: VerticalClosestDistanceType;
        if (Math.abs(q.offsetFromTop) < Math.abs(q.offsetFromBottom)) {
            // according to the definition of Manhattan."offset", a negative offset means above (both offsetToTop and offsetToBottom), and 0 is in.
            vertical = q.offsetFromTop >= 0 ? VerticalClosestDistanceType.TopIn : VerticalClosestDistanceType.TopOut;
        }
        else {
            vertical = q.offsetFromBottom > 0 ? VerticalClosestDistanceType.BottomOut : VerticalClosestDistanceType.BottomIn;
        }

        return { minDistance, horizontalType: horizontal, verticalType: vertical, minHorizontalDistance, minVerticalDistance };
    }

}
export enum HorizontalClosestDistanceType {
    LeftOut,
    LeftIn,
    RightIn,
    RightOut,
}
export namespace HorizontalClosestDistanceType {
    export function IsIn(e: HorizontalClosestDistanceType) {
        switch (e) {
            case HorizontalClosestDistanceType.LeftIn:
            case HorizontalClosestDistanceType.RightIn:
                return true;
            case HorizontalClosestDistanceType.LeftOut:
            case HorizontalClosestDistanceType.RightOut:
                return false;
            default:
                throw new Error("Invalid HorizontalClosestDistanceType");
        }
    }
    export function IsOut(e: HorizontalClosestDistanceType) {
        return !IsIn(e);
    }

}
export enum VerticalClosestDistanceType {
    TopOut,
    TopIn,
    BottomIn,
    BottomOut,
}
export namespace VerticalClosestDistanceType {
    export function IsIn(e: VerticalClosestDistanceType) {
        switch (e) {
            case VerticalClosestDistanceType.TopIn:
            case VerticalClosestDistanceType.BottomIn:
                return true;
            case VerticalClosestDistanceType.TopOut:
            case VerticalClosestDistanceType.BottomOut:
                return false;
            default:
                throw new Error("Invalid VerticalClosestDistanceType");
        }
    }
    export function IsOut(e: VerticalClosestDistanceType) {
        return !IsIn(e);
    }
}
