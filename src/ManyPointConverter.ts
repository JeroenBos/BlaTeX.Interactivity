import { assert } from './utils';
import Point from './polyfills/Point';
import Rectangle from './polyfills/Rectangle';
import HashSet from './polyfills/HashSet{T}';
import { Polygon as PolygonImplementation } from './polyfills/RectanglesToPolygon';

export function getCursorIndexByProximity(element: HTMLElement): number | undefined {
    const boundingRect = element.getBoundingClientRect();
    if (boundingRect.width === 0 && boundingRect.height === 0) throw new Error('Element has not measure');

    throw new Error('not implemented');
}

export type Polygon = {
    readonly contours: ReadonlyArray<{ readonly pts: ReadonlyArray<Point> }>
    simplify(): void;
};

/** In this setup, as opposed to getPolygonsByValue where the lattice ends are inclusive,
 * the lattice ends (that is the right and bottom of the bounding box) are excluded.
 * You can think of this are the lattice being represented by the building blocks of many 
 * unit rectangles, each unit rectangle having 4 corners. (That's ends inclusive).
 * The coordinates can be continuous. 
 * Lattice exclusive is more that each rectangle is a single node with a single value.
 * It's also necessarily a discrete lattice. The node has the value of the topleft of its unit.
 * 
 * The discrete lattice can be mapped to the problem of continuous lattices, by
 * - reducing the size of the bounding box by 1 on the right and bottom
 * 
 * The problem is that points can have different values now, depending on from which direction you approach the corner 🤔
 */
export function getDiscretePolygonsByValue_LatticeEndExclusive(
    seeds: Point[],
    getValue: (p: Point) => number): Map<number, Polygon> {

    // @ts-ignore
    const [rectanglesByValue, valuesByPts] = getRectanglesByValue(
        seeds,
        p => getValue(p.floor()),
        1,
        r => getValue(r.topLeft.floor()),
        Math.floor
    );

    // increase the widths and heights by one to make rectangles "touching" for the next algorithm
    // for (const [, rectangles] of rectanglesByValue) {
    //     for (let i = 0; i < rectangles.length; i++) {
    //         const r = rectangles[i];
    //         rectangles[i] = new Rectangle(r.x, r.y, r.width + 1, r.height + 1);
    //     }
    // }
    // for (const _ of valuesByPts.keys()) {
    //     // TODO detect if points from the grid are missing and add unit rectangles there
    // }

    const polygons = aggregateRectangles(rectanglesByValue);
    // TODO: decrease the polygons width and height again by one
    // The naive implementation would check for the direction of a segment (given the clockwise guarantees of the algorithm)
    // but then that could lead more deformities that would have to be resolved
    // for now I'll accept being one pixes off on the bottom and right
    return polygons;
}
export function getPolygonsByValue(
    seeds: Point[],
    getValue: (p: Point) => number,
    minDistance: number = 1,
): Map<number, Polygon> {
    const [rectanglesByValue,] = getRectanglesByValue(seeds, getValue, minDistance);

    return aggregateRectangles(rectanglesByValue);
}
function aggregateRectangles(rectanglesByValue: Map<number, Rectangle[]>): Map<number, Polygon> {
    const result = new Map<number, Polygon>();
    for (const [value, rectangles] of rectanglesByValue) {
        const p = PolygonImplementation.fromRectangle(rectangles[0]);
        for (const rectangle of rectangles.slice(1)) {
            p.merge(PolygonImplementation.fromRectangle(rectangle));
        }
        result.set(value, p);
    }
    return result;
}
function getRectanglesByValue(
    seeds: Point[],
    getValue: (p: Point) => number,
    minDistance: number = 1,
    getValueUnderMinDistance: (r: Rectangle) => number | undefined = r => getValue(r.topLeft),
    floorDistances: (q: number) => number = q => q
): [Map<number, Rectangle[]>, HashSet<Point, number>] {
    assert(minDistance > 0, "minDistance must be positive");

    const rects = Array.from(divideIntoRectangles(seeds));

    const valueOnEachCorner = createPointHashmap<number>();
    const result = new Map<number, Rectangle[]>();
    function setResult(value: number, rectangle: Rectangle) {
        const list = result.get(value);
        if (list === undefined)
            result.set(value, [rectangle]);
        else
            list.push(rectangle);
    }

    let newRects = rects;
    while (newRects.length != 0) {
        const thisRoundRects = newRects;
        for (const corner of getAllCorners(newRects)) {
            if (!valueOnEachCorner.has(corner)) {
                valueOnEachCorner.set(corner, getValue(corner));
            }
        }
        newRects = [];
        for (const rect of thisRoundRects) {
            const valuesOnCorners = new Set<number>(
                [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight].map(p => {
                    const result = valueOnEachCorner.get(p);
                    assert(result !== undefined);
                    return result;
                })
            );
            if (valuesOnCorners.size === 1) {
                const value = valueOnEachCorner.get(rect.topLeft);
                assert(value !== undefined);
                setResult(value, rect);

            } else {
                const f = floorDistances;
                if (rect.width >= minDistance * 2) {
                    if (rect.height >= minDistance * 2) {
                        // 0|1
                        // 2|3
                        const middle = new Point(rect.left + f(rect.width / 2), rect.top + f(rect.height / 2));
                        newRects.push(Rectangle.fromCorners(rect.topLeft, middle));
                        newRects.push(Rectangle.fromSides(middle.x, rect.top, rect.right, middle.y));
                        newRects.push(Rectangle.fromSides(rect.left, middle.y, middle.x, rect.bottom));
                        newRects.push(Rectangle.fromCorners(middle, rect.bottomRight));
                    }
                    else {
                        newRects.push(Rectangle.fromSides(rect.left, rect.top, rect.left + f(rect.width / 2), rect.bottom));
                        newRects.push(Rectangle.fromCorners(newRects[newRects.length - 1].topRight, rect.bottomRight));
                    }

                } else if (rect.height >= minDistance * 2) {
                    newRects.push(Rectangle.fromSides(rect.left, rect.top, rect.right, rect.top + f(rect.height / 2)));
                    newRects.push(Rectangle.fromCorners(newRects[newRects.length - 1].bottomLeft, rect.bottomRight));
                }
                else {
                    // rectangle too small
                    const value = getValueUnderMinDistance(rect);
                    if (value !== undefined) {
                        setResult(value, rect);
                    } else {
                        // too small rectangle doesn't have a value. discard it
                    }
                }
            }
        }
    }
    // sort by topLeft point:
    for (const [, rectangles] of result) {
        rectangles.sort((a, b) => byTopLeftSquarelikeComparer(a.topLeft, b.topLeft));
    }
    return [result, valueOnEachCorner];
}


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
    const all = createPointHashmap<Point>();
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
}
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

export const TEST_ONLY_divideIntoRectangles = divideIntoRectangles;
export const TEST_ONLY_getRectanglesByValue = getRectanglesByValue;

function getAllCorners(rects: Rectangle[]): Point[] {
    const all = createPointHashmap<Point>();

    for (const rect of rects) {
        all.set(rect.topLeft, rect.topLeft);
        all.set(rect.topRight, rect.topRight);
        all.set(rect.bottomLeft, rect.bottomLeft);
        all.set(rect.bottomRight, rect.bottomRight);
    }
    return Array.from(all.all());
}

function createPointHashmap<V>() {
    return new HashSet<Point, V>(p => p.x + p.y, Point.equal);
}
