import { assert, sequenceIndexOf } from '../src/utils';
import Point from "../src/polyfills/Point";
import Rectangle from "../src/polyfills/ReadOnlyRectangle";
// import { Polygon, Contour } from '../src/polyfills/RectanglesToPolygon';
import { Polygon, Contour, Segment } from '../src/polyfills/RectanglesToPolygon';


function toPolygon(r: Rectangle) {
    const topLeft = new Point(r.topLeft.x, r.topLeft.y);
    const bottomLeft = new Point(r.bottomLeft.x, r.bottomLeft.y);
    const bottomRight = new Point(r.bottomRight.x, r.bottomRight.y);
    const topRight = new Point(r.topRight.x, r.topRight.y);
    return new Polygon([topLeft, bottomLeft, bottomRight, topRight]);
}

describe('polygon merging', () => {
    it('', () => {
        const r1 = new Rectangle(0, 0, 1, 1);
        const r2 = new Rectangle(1, 0, 1, 1);
        const g = toPolygon(r1);
        g.merge(toPolygon(r2));

        g.simplify();

        expect(g.contours.length).toBe(1);
        const corners = g.contours[0].pts;
        expect(corners.length).toBe(4);

        expect(corners.findIndex(corner => corner.equals(new Point(0, 0))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(2, 0))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(0, 1))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(2, 1))) !== -1);
    });

    it('', () => {
        const r1 = new Rectangle(0, 0, 1, 1);
        const r2 = new Rectangle(1, 0, 1, 1);
        const r3 = new Rectangle(0, 1, 1, 1);
        const g = toPolygon(r1);
        g.merge(toPolygon(r2));
        g.merge(toPolygon(r3));

        g.simplify();

        expect(g.contours.length).toBe(1);
        const corners = g.contours[0].pts;
        expect(corners.length).toBe(6);

        expect(corners.findIndex(corner => corner.equals(new Point(0, 0))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(2, 0))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(0, 2))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(2, 1))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(1, 2))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(1, 1))) !== -1);
    });

    it('with hole', () => {
        const r1 = new Rectangle(0, 0, 3, 1);
        const r2 = new Rectangle(0, 1, 1, 1);
        const r3 = new Rectangle(2, 1, 1, 1);
        const r4 = new Rectangle(0, 2, 3, 1);
        const g = toPolygon(r1);
        g.merge(toPolygon(r2));
        g.merge(toPolygon(r3));
        g.merge(toPolygon(r4));

        g.simplify();

        expect(g.contours.length).toBe(2);
        const corners = g.contours[0].pts;
        const hole = g.contours[1].pts;
        expect(corners.length).toBe(4);
        expect(hole.length).toBe(4);

        expect(corners.findIndex(corner => corner.equals(new Point(0, 0))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(3, 0))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(0, 3))) !== -1);
        expect(corners.findIndex(corner => corner.equals(new Point(3, 3))) !== -1);
        expect(hole.findIndex(corner => corner.equals(new Point(1, 1))) !== -1);
        expect(hole.findIndex(corner => corner.equals(new Point(1, 2))) !== -1);
        expect(hole.findIndex(corner => corner.equals(new Point(2, 1))) !== -1);
        expect(hole.findIndex(corner => corner.equals(new Point(2, 2))) !== -1);
    });
    
    it('with hole from original', () => {
        const top = new Segment(new Point(0, 0), new Point(3, 0));
        const T = new Segment(new Point(2, 1), new Point(2, 0));
        const intersection = top.intersection(T);

        assert(intersection.compare(new Point(2, 0)));
    });

    it('with hole from original in figure', () => {
        const top = new Segment(new Point(0, 1), new Point(3, 1));
        const T = new Segment(new Point(1, 2), new Point(1, 1));
        const intersection = top.intersection(T);

        assert(intersection.compare(new Point(1, 1)));
    });
    it('with hole from original', () => {
        const r1 = new Rectangle(0, 0, 3, 1);
        const r2 = new Rectangle(0, 1, 1, 1);
        const r3 = new Rectangle(2, 1, 1, 1);
        const r4 = new Rectangle(0, 2, 3, 1);

        const g = toPolygon(r1);
        const p2 = toPolygon(r2);
        g.merge(p2);
        const p3 = toPolygon(r3);
        g.merge(p3);
        const p4 = toPolygon(r4);
        g.merge(p4);

        g.simplify()
        expect(g.contours.length).toBe(2);
        const corners = g.contours[0].pts;
        const hole = g.contours[1].pts;
        expect(corners.length).toBe(4);
        expect(hole.length).toBe(4);

        expect(corners.findIndex(corner => corner.compare(new Point(0, 0))) !== -1);
        expect(corners.findIndex(corner => corner.compare(new Point(3, 0))) !== -1);
        expect(corners.findIndex(corner => corner.compare(new Point(0, 3))) !== -1);
        expect(corners.findIndex(corner => corner.compare(new Point(3, 3))) !== -1);
        expect(hole.findIndex(corner => corner.compare(new Point(1, 1))) !== -1);
        expect(hole.findIndex(corner => corner.compare(new Point(1, 2))) !== -1);
        expect(hole.findIndex(corner => corner.compare(new Point(2, 1))) !== -1);
        expect(hole.findIndex(corner => corner.compare(new Point(2, 2))) !== -1);
    });


});
