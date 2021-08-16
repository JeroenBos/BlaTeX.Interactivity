import { assert } from './utils';
import Point from './polyfills/Point';
import Rectangle from './polyfills/Rectangle';
import HashSet from './polyfills/HashSet{T}';

export function getCursorIndexByProximity(element: HTMLElement): number | undefined {
    const boundingRect = element.getBoundingClientRect();
    if (boundingRect.width === 0 && boundingRect.height === 0) throw new Error('Element has not measure');

    throw new Error('not implemented');
}

// export type Polygon = { y: number };
// function* getPolygonsWithSameValue(seeds: Point[], minDistance: number, getValue: (p: Point) => number): Iterable<Rectangle> {
//     const rects = divideIntoRectangles(seeds);
// }
function divideIntoRectangles(seeds: Point[]): Iterable<Rectangle> {
    assert(seeds.length > 1, 'Insufficient points');

    const pts = includeBoundingRectangle(seeds).pts;
    assert(pts.length >= 4, 'Points are on a horizontal or vertical line');

    return _divideIntoRectangles(...pts);
}
/** may returns the empty sequence. */
function* _divideIntoRectangles(...seeds: Point[]): Iterable<Rectangle> {
    const { pts, container } = includeBoundingRectangle(seeds);

    if (container.width === 0 || container.height === 0)
        return;

    pts.sort(getByTopLeftSquarelikeComparer(container.topLeft));

    function pop(index: number): Point {
        const result = pts[index];
        pts.splice(index, 1);
        return result;
    }
    function popTop(): [Point, Point, number | undefined] {
        const topLeft = pop(0);
        const rightIndex = pts.findIndex(p => p.x > topLeft.x);
        assert(rightIndex !== -1, "All points on a vertical line? :S");
        const p = pop(rightIndex);
        const topRight = new Point(p.x, topLeft.y);
        const bottom = topLeft.y == p.y ? undefined : Math.max(topLeft.y, p.y);
        if (topLeft.x > topRight.x)
            return [topRight, topLeft, bottom];
        return [topLeft, topRight, bottom];
    }

    function popBottom(topLeft: Point, topRight: Point) {
        let i = pts.findIndex(p => p.x <= topRight.x);
        if (i === -1) {
            i = pts.findIndex(p => p.y > topLeft.y);
        }
        if (i === -1) {
            throw new Error('All seeds are on a horizontal line');
        }
        const p = pop(i);

        const bottomLeft = new Point(topLeft.x, p.y);
        return bottomLeft.y;
    }

    function deleteAllIn(rect: Rectangle): Point[] {
        const deleted: Point[] = [];
        while (true) {
            const removeAt = pts.findIndex(p => rect.contains(p, false));
            if (removeAt === -1)
                break;
            deleted.push(pop(removeAt));
        }
        return deleted;
    }
    function recurse(rectangle: Rectangle) {
        return _divideIntoRectangles(rectangle.topLeft, rectangle.bottomRight, ...deleteAllIn(rectangle));
    }
    const [topLeft, topRight, _bottomRight] = popTop();
    const bottomRight = _bottomRight !== undefined ? _bottomRight : popBottom(topLeft, topRight);
    const rect = Rectangle.fromCorners(topLeft, new Point(topRight.x, bottomRight));
    yield rect;
    deleteAllIn(rect);

    if (pts.length === 0)
        return;

    // quadrants, where 1 is the current rectangle
    // 1|2
    // 3|4

    const next = pop(0);
    if (next.x > rect.right) {
        // next is in q2 or q4
        if (next.y <= rect.bottom) {
            // next is in q2
            const r1 = Rectangle.fromCorners(rect.topRight, next); // 0-height if next.y == rect.top
            const r2 = Rectangle.fromCorners(r1.bottomLeft, new Point(next.x, rect.bottom));
            const nextq2 = Rectangle.fromCorners(r1.topRight, new Point(container.right, rect.bottom));

            yield* recurse(r1);
            yield* recurse(r2);
            yield* recurse(nextq2);

            if (next.y === rect.bottom) {
                const q3 = Rectangle.fromSides(container.left, rect.bottom, next.x, container.bottom);
                const q4 = Rectangle.fromCorners(q3.topRight, container.bottomRight);

                yield* recurse(q3);
                yield* recurse(q4);
            }
            else {
                const q34 = Rectangle.fromSides(container.left, rect.bottom, container.right, container.bottom);
                yield* recurse(q34);
            }
        }
        else {
            // next is in q4
            const r1 = Rectangle.fromCorners(rect.topRight, new Point(next.x, rect.bottom));
            const nextq2 = Rectangle.fromCorners(r1.topRight, new Point(container.right, rect.bottom));
            yield* recurse(r1);
            yield* recurse(nextq2);
        }

    }
    else {
        // next is in q3
        const r1 = Rectangle.fromCorners(rect.bottomLeft, next);
        const r2 = Rectangle.fromSides(next.x, rect.bottom, rect.right, next.y);
        const nextq3 = Rectangle.fromSides(rect.left, next.y, rect.right, container.bottom);

        yield* recurse(r1);
        yield* recurse(r2);
        yield* recurse(nextq3);

        if (next.x === rect.right) {
            const q2 = Rectangle.fromSides(rect.right, container.top, container.right, next.y);
            const q4 = Rectangle.fromCorners(q2.bottomLeft, container.bottomRight);

            yield* recurse(q2);
            yield* recurse(q4);
        }
        else {
            const q24 = Rectangle.fromSides(rect.right, container.top, container.right, container.bottom);
            yield* recurse(q24);
        }
    }
}

function includeBoundingRectangle(seeds: Point[]): { pts: Point[], container: Rectangle } {
    const all = new HashSet<Point, Point>(p => p.x + p.y, Point.equal);
    for (const seed of seeds)
        all.set(seed, seed);

    const absoluteLeft = Math.min(...seeds.map(p => p.x));
    const absoluteTop = Math.min(...seeds.map(p => p.y));
    const absoluteRight = Math.max(...seeds.map(p => p.x));
    const absoluteBottom = Math.max(...seeds.map(p => p.y));
    const absoluteRect = Rectangle.fromSides(absoluteLeft, absoluteTop, absoluteRight, absoluteBottom);
    all.set(absoluteRect.bottomLeft, absoluteRect.bottomLeft);
    all.set(absoluteRect.bottomRight, absoluteRect.bottomRight);
    all.set(absoluteRect.topLeft, absoluteRect.topLeft);
    all.set(absoluteRect.topRight, absoluteRect.topRight);

    const pts = Array.from(all.all());

    return { pts, container: absoluteRect };
}

function getByTopLeftSquarelikeComparer(origin: Point): (a: Point, b: Point) => number {
    return (a, b) => byTopLeftSquarelikeComparer(new Point(a.x - origin.x, a.y - origin.y), new Point(b.x - origin.x, b.y - origin.y));

    function byTopLeftSquarelikeComparer(a: Point, b: Point): number {
        const aManhattanDistanceToTopLeft = a.x + a.y;
        const bManhattanDistanceToTopLeft = b.x + b.y;
        if (aManhattanDistanceToTopLeft < bManhattanDistanceToTopLeft)
            return -1;
        else if (aManhattanDistanceToTopLeft > bManhattanDistanceToTopLeft)
            return 1;
        // prefer the most square-like rectangle:
        const squareLike = b.x * b.y - a.x * a.y;
        if (squareLike !== 0) {
            return squareLike;
        }
        // prefer with higher x
        return a.x > b.x ? -1 : a.x < b.x ? 1 : 0;
    }

    // function byTopLeftComparer(a: Point, b: Point): number {
    //     return (a.x === b.x ? 0 : a.x < b.x ? -1 : 1) + 2 * (a.y === b.y ? 0 : a.y < b.y ? -1 : 1);
    // }
}

export const TEST_ONLY_divideIntoRectangles = divideIntoRectangles;
