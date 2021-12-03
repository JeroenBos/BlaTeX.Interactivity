import {
    TEST_ONLY_divideIntoRectangles,
    getDiscretePolygonsByValue_LatticeEndExclusive,
} from '../src/jbsnorro/polygons/ManyPointConverter';
import Point from '../src/polyfills/Point';
import Rectangle from '../src/polyfills/ReadOnlyRectangle';
import { assert } from '../src/utils';

describe('Test divideIntoRectangles', () => {
    it('Simple unit rectangle', async () => {
        const rects = Array.from(
            TEST_ONLY_divideIntoRectangles([new Point(0, 0), new Point(1, 0), new Point(0, 1), new Point(1, 1)])
        );

        assert(rects.length === 1);
        assert(new Rectangle(0, 0, 1, 1).equals(rects[0]));
    });
    it('Simple unit rectangle reconstructed from only 2 points', async () => {
        const rects = Array.from(TEST_ONLY_divideIntoRectangles([new Point(0, 0), new Point(1, 1)]));

        assert(rects.length === 1);
        assert(new Rectangle(0, 0, 1, 1).equals(rects[0]));
    });
    it('Simple unit rectangle reconstructed from 3 points', async () => {
        const rects = Array.from(TEST_ONLY_divideIntoRectangles([new Point(0, 0), new Point(0, 1), new Point(1, 0)]));

        assert(rects.length === 1);
        assert(new Rectangle(0, 0, 1, 1).equals(rects[0]));
    });
    it('Simple 2 unit rectangles next to each other', async () => {
        const rects = Array.from(TEST_ONLY_divideIntoRectangles([new Point(0, 0), new Point(1, 0), new Point(2, 1)]));

        assert(rects.length === 2);
        assert(new Rectangle(0, 0, 1, 1).equals(rects[0]));
        assert(new Rectangle(1, 0, 1, 1).equals(rects[1]));
    });

    it('Simple 4 unit rectangles next to each other', async () => {
        const rects = Array.from(TEST_ONLY_divideIntoRectangles([new Point(0, 0), new Point(1, 1), new Point(2, 2)]));

        assert(rects.length === 3);
        assert(new Rectangle(0, 0, 1, 1).equals(rects[0]));
        assert(new Rectangle(1, 0, 1, 1).equals(rects[1]));
        assert(new Rectangle(0, 1, 2, 1).equals(rects[2]));
    });
    it('Simple 4 unit rectangles next to each other', async () => {
        const rects = Array.from(TEST_ONLY_divideIntoRectangles([new Point(0, 0), new Point(1, 1), new Point(2, 3)]));

        assert(rects.length === 3);
        assert(new Rectangle(0, 0, 1, 1).equals(rects[0]));
        assert(new Rectangle(1, 0, 1, 1).equals(rects[1]));
        assert(new Rectangle(0, 1, 2, 2).equals(rects[2]));
    });
});

describe('Test getPolygonsByValue', () => {
    it('DISCRETE. Right and bottom boundaries of bounding box are permitted to deviate', () => {
        const seeds = [new Point(0, 0), new Point(1, 1), new Point(3, 4)];
        const values = [
            [0, 0, 0, 0],
            [0, 0, 1, 1],
            [2, 2, 1, 1],
            [2, 1, 1, 1],
            [2, 2, 1, 1],
        ];
        function getValues(p: Point) {
            assert(p.y < values.length);
            assert(p.x < values[0].length);
            return values[p.y][p.x];
        }
        const polygons = getDiscretePolygonsByValue_LatticeEndExclusive(seeds, getValues);
        assert(polygons.size === 3);

        for (const polygon of polygons.values()) {
            polygon.simplify();
        }

        assert(polygons.get(0).contours.length === 1);
        assert(polygons.get(0).contours[0].pts.length === 6);
        assert(polygons.get(1).contours.length === 1);
        assert(polygons.get(1).contours[0].pts.length === 6);
        assert(polygons.get(2).contours.length === 1);
        assert(polygons.get(2).contours[0].pts.length === 6);
    });
});
