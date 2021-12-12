import {
    toHTMLElementWithBoundingRectangles,
    toHTMLElementWithBoundingRectanglesWithTag,
    toHTMLElementWithBoundingRectanglesWithKatex,
} from './utils/computeLayout';
import {
    getCursorIndexByProximity,
    getCursorIndexByProximity_FOR_TESTING_ONLY,
    getDistance,
    getDistance_FOR_TESTING_ONLY,
    getHtmlElementsWithDataloc,
} from '../src/PointToCursorHandleConverter';
import fs from 'fs';
import { dumpOverlayBodyWithKatexCSS } from './utils/overlay';
import Point from '../src/polyfills/Point';
import { assert, assertEqual, getDataLoc } from '../src/utils';
import { debug_it, getStyle } from './utils/utils';
import { allPointsByIndexToSVGByProximity } from '../src/paintAllPointsByIndex';
import { ManhattanDistanceComparer } from '../src/jbsnorro/polygons/ManhattanDistanceComparer';
import { HorizontalClosestDistanceType, MinDistances, VerticalClosestDistanceType } from '../src/jbsnorro/polygons/MinDistances';
import { initGlobalTypesFromJSDOM } from '.';

describe('Resolve location to parsetree location', () => {
    beforeEach(initGlobalTypesFromJSDOM);
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithTag('<div></div>', "simple <div>");
        const result = getCursorIndexByProximity(element, { x: 50, y: 50 });

        expect(result).toBe(undefined);
    });
    it('Simple <div> clicking near the left', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithTag('<div data-loc="0,1"></div>', "<div> left");

        const clickToTheLeft = getCursorIndexByProximity(element, { x: 50, y: 50 });
        expect(clickToTheLeft).toBe(0);
    });
    it('Simple <div> clicking near the right', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithTag('<div data-loc="0,1"></div>', "<div> right");

        const clickToTheRight = getCursorIndexByProximity(element, { x: 1900, y: 50 });
        expect(clickToTheRight).toBe(1);
    });
});

describe('Resolve KaTeX Source Location', () => {
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithKatex(`
        <span class="katex">
            <span class="katex-html" aria-hidden="true">
                <span class="base">
                    <span class="strut" style="height:0.43056em;vertical-align:0em;"></span>
                    <span class="mord mathnormal" data-loc="0,1">c</span>
                </span>
            </span>
        </span>`,
            "simple div katex");

        const result = getCursorIndexByProximity(element, { x: 50, y: 50 });

        assertEqual(result, 1);
    });
});

describe('Test getDistance internally.', () => {
    beforeEach(initGlobalTypesFromJSDOM);

    it('<katex>c</katex>', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithKatex(`
        <span class="katex">
            <span class="katex-html" aria-hidden="true">
                <span class="base">
                    <span class="strut" style="height:0.43056em;vertical-align:0em;"></span>
                    <span class="mord mathnormal" data-loc="0,1">c</span>
                </span>
            </span>
        </span>`,
            "getDistance");

        const distancesToOrigin = getDistance_FOR_TESTING_ONLY(element, { x: 0, y: 0 });

        // the element's bounding rect is {0, 1, width=13.4375, 21}
        expect(distancesToOrigin.offsetFromLeft).toBe(0);
        expect(distancesToOrigin.offsetFromRight).toBe(-1920);
        expect(distancesToOrigin.offsetFromTop).toBe(0);
        expect(distancesToOrigin.offsetFromBottom).toBe(-23.21875);
    });
});

describe('Test point to cursor handler for specific points.', () => {
    debug_it('on x_1^2', async (zoom: boolean) => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/x_1^2.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined, "x_1^2");

        dumpOverlayBodyWithKatexCSS(
            htmlBody,
            allPointsByIndexToSVGByProximity(
                element,
                getStyle,
                undefined,
                undefined,
                'stroke: red; stroke-width: 0.3; fill: transparent;',
                true
            )
        ); // debug purposes only

        const point = new Point(13, 15);
        const datalocElements = getHtmlElementsWithDataloc(element);

        const elementx = getDataLoc('0,1', datalocElements);
        const distancex = MinDistances.fromManhattan(getDistance(elementx, point));
        assert(distancex.horizontalType === HorizontalClosestDistanceType.RightOut);
        assert(distancex.verticalType === VerticalClosestDistanceType.BottomIn);

        const element1 = getDataLoc('2,3', datalocElements);
        const distance1 = MinDistances.fromManhattan(getDistance(element1, point));
        assert(distance1.horizontalType === HorizontalClosestDistanceType.LeftIn);
        assert(distance1.verticalType === VerticalClosestDistanceType.TopIn);

        const element2 = getDataLoc('4,5', datalocElements);
        const distance2 = MinDistances.fromManhattan(getDistance(element2, point));
        assert(distance2.horizontalType === HorizontalClosestDistanceType.LeftIn);
        assert(distance2.verticalType === VerticalClosestDistanceType.BottomOut);

        const comparer = ManhattanDistanceComparer;

        assert(comparer(distance1, distancex) === -1);
        assert(comparer(distance1, distance2) === -1);

        const elements = [elementx, element1, element2];

        const distances = getCursorIndexByProximity_FOR_TESTING_ONLY(elements, point);
        assert(comparer(distances[1], distances[0]) === -1);

        const points = [
            { p: new Point(4, 5), index: 0 },
            { p: new Point(6, 10), index: 1 },
            { p: new Point(13, 15), index: 2 },
        ];

        for (const { p, index } of points) {
            const result = getCursorIndexByProximity(element, p);

            // debugging purposes:
            const svg = `<svg><rect x="${p.x}" y="${p.y}" width="1" height="1" style="fill: red"/></svg>`;
            dumpOverlayBodyWithKatexCSS(htmlBody + `<div>${result}</div>`, svg); // debug purposes only

            assert(result === index);
        }
    });
});
