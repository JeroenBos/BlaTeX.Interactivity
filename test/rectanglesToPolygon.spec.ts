import { assert } from '../src/utils';
import Point from '../src/polyfills/Point';
import Rectangle from '../src/polyfills/ReadOnlyRectangle';
import { Polygon, Segment } from '../src/polyfills/RectanglesToPolygon';

describe('polygon merging', () => {
    it('', () => {
        const r1 = new Rectangle(0, 0, 1, 1);
        const r2 = new Rectangle(1, 0, 1, 1);
        const g = Polygon.fromRectangle(r1);
        g.merge(Polygon.fromRectangle(r2));

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
        const g = Polygon.fromRectangle(r1);
        g.merge(Polygon.fromRectangle(r2));
        g.merge(Polygon.fromRectangle(r3));

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
        const g = Polygon.fromRectangle(r1);
        g.merge(Polygon.fromRectangle(r2));
        g.merge(Polygon.fromRectangle(r3));
        g.merge(Polygon.fromRectangle(r4));

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

        const g = Polygon.fromRectangle(r1);
        const p2 = Polygon.fromRectangle(r2);
        const p3 = Polygon.fromRectangle(r3);
        const p4 = Polygon.fromRectangle(r4);

        g.merge(p2);
        g.merge(p3);
        g.merge(p4);
        g.simplify();

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
