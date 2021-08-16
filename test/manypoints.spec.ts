import { TEST_ONLY_divideIntoRectangles } from '../src/ManyPointConverter';
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
});
