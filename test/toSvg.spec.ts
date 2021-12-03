import { Polygon } from '../src/jbsnorro/polygons/RectanglesToPolygon';
import Rectangle from '../src/polyfills/ReadOnlyRectangle';
import { assert } from '../src/utils';

describe('PolygonToSVG', () => {
    it('Rectangle', async () => {
        const polygon = Polygon.fromRectangle(new Rectangle(0, 0, 1, 2));
        const svg = polygon.toSvgPathString();

        assert(svg === 'M0,0 0,2 1,2 1,0 0,0');
    });
    it('Rectangle with hole', async () => {
        // construct same polygon as in other tests:
        const r1 = new Rectangle(0, 0, 300, 100);
        const r2 = new Rectangle(0, 100, 100, 100);
        const r3 = new Rectangle(200, 100, 100, 100);
        const r4 = new Rectangle(0, 200, 300, 100);

        const g = Polygon.fromRectangle(r1);
        const p2 = Polygon.fromRectangle(r2);
        const p3 = Polygon.fromRectangle(r3);
        const p4 = Polygon.fromRectangle(r4);

        g.merge(p2);
        g.merge(p3);
        g.merge(p4);
        g.simplify();

        const svg = g.toSvgPathString();

        assert(svg === 'M300,0 0,0 0,300 300,300 300,0\n M100,200 100,100 200,100 200,200 100,200');
    });
});
