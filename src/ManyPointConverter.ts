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

function* divideIntoRectangles(seeds: Point[]): Iterable<Rectangle> {
    const all = new HashSet<Point, Point>(p => p.x + p.y, Point.equal);
    for (const seed of seeds) all.set(seed, seed);
    if (all.size <= 1) throw new Error('Insufficient points');
    const absoluteLeft = Math.min(...seeds.map(p => p.x));
    const absoluteTop = Math.min(...seeds.map(p => p.y));
    const absoluteRight = Math.max(...seeds.map(p => p.x));
    const absoluteBottom = Math.max(...seeds.map(p => p.y));
    const absoluteRect = Rectangle.fromSides(absoluteLeft, absoluteTop, absoluteRight, absoluteBottom);
    all.set(absoluteRect.bottomLeft, absoluteRect.bottomLeft);
    all.set(absoluteRect.bottomRight, absoluteRect.bottomRight);
    all.set(absoluteRect.topLeft, absoluteRect.topLeft);
    all.set(absoluteRect.topRight, absoluteRect.topRight);
    if (all.size < 4) throw new Error('Points are on a horizontal or vertical line');

    const pts = Array.from(all.all());
    pts.sort(byTopLeftComparer);

    function pop(index: number): Point {
        const result = pts[index];
        pts.splice(index, 1);
        // const deleted = all.delete(result);
        // assert(deleted !== undefined);
        return result;
    }
    function unpop(index: number, value: Point): void {
        pts.splice(index, 0, value);
        // all.set(value, value);
    }
    function popTop() {
        const topLeft = pop(0);

        function popTopRight(topLeft: Point) {
            const p = pop(0);
            return new Point(p.x, topLeft.y);
        }
        const topRight = popTopRight(topLeft);

        if (topLeft.x > topRight.x) return [topRight, topLeft];
        return [topLeft, topRight];
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
        return [bottomLeft, new Point(topRight.x, bottomLeft.y)];
    }

    function deleteAllIn(rect: Rectangle) {
        while (true) {
            const removeAt = pts.findIndex(p => rect.contains(p, false));
            if (removeAt === -1) break;

            if (!pts[removeAt].equals(rect.bottomRight)) {
                console.log(`Warning: Ignoring ${pts[removeAt]}`);
            }
            pop(removeAt);
        }
    }

    const [topLeft, topRight] = popTop();
    const [, bottomRight] = popBottom(topLeft, topRight);
    const rect = Rectangle.fromCorners(topLeft, bottomRight);
    deleteAllIn(rect);

    yield rect;
    if (pts.length === 0) return;

    // quadrants, where 1 is the current rectangle
    // 1|2
    // 3|4

    const next = pop(0);
    if (next.x > rect.right) {
        const indexIn2ndQuadrant = pts.findIndex(p => p.x >= rect.right && p.y <= rect.bottom);
        if (next.y === rect.top && indexIn2ndQuadrant !== -1) {
            const bottomRight = pop(indexIn2ndQuadrant);
            const nextRect = Rectangle.fromCorners(rect.topRight, bottomRight);
            yield nextRect;
            deleteAllIn(nextRect);

            // TODO: we should do the fillRect recursively too
            if (pts.length !== 0) {
                const fillRect = Rectangle.fromSides(rect.x, nextRect.bottom, nextRect.right, rect.bottom);
                yield fillRect;
                deleteAllIn(fillRect);
            }
        } else if (next.y <= rect.bottom) {
            const nextRect = Rectangle.fromSides(rect.right, rect.top, next.x, next.y);
            yield nextRect;
            deleteAllIn(nextRect);
        } else {
            // else in 4th quadrant
            // we didn't use `next`. so push it back on:
            unpop(0, next);
        }
    } else {
        const indexIn3rdQuadrant = pts.findIndex(p => p.x <= rect.right && p.y > rect.bottom);
        if (indexIn3rdQuadrant !== -1) {
            const i = pts.findIndex(p => p.x <= rect.right);
            if (i !== -1) {
                throw new Error(
                    "Impossible. We started with a rectangle didn't we, and the remaining wasn't the 2nd quadrant"
                );
            }
            const bottomRight = pop(i);
            const nextRect = Rectangle.fromCorners(rect.bottomLeft, bottomRight);
            yield nextRect;
            deleteAllIn(nextRect);

            if (bottomRight.x !== rect.right) {
                // TODO: we should do the fillRect recursively too
                const fillRect = Rectangle.fromSides(nextRect.right, nextRect.top, rect.right, nextRect.bottom);
                yield fillRect;
                deleteAllIn(fillRect);
            }
        } else {
            assert(absoluteBottom > rect.bottom);
            const secondQ = Rectangle.fromSides(rect.left, rect.bottom, rect.right, absoluteBottom);
            yield secondQ;

            assert(absoluteRight > rect.right);
            const thirdQ = Rectangle.fromSides(rect.right, rect.top, absoluteRight, rect.bottom);
            yield thirdQ;
            // in 4th quadrant. we have no choice but to handle it. cut off 2nd and 4rd quadrants entirely and recurse, because only a single rectangle remains.

            yield* divideIntoRectangles(pts);
        }
    }
}

function byTopLeftComparer(a: Point, b: Point): number {
    return (a.x === b.x ? 0 : a.x < b.x ? -1 : 1) + 2 * (a.y === b.y ? 0 : a.y < b.y ? -1 : 1);
}

export const TEST_ONLY_divideIntoRectangles = divideIntoRectangles;
