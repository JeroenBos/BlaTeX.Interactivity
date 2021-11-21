import {
    toHTMLElementWithBoundingRectangles,
    toHTMLElementWithBoundingRectanglesWithKatex,
} from './jsdom.understanding.spec';
import { getCursorIndexByProximity, getDistance_FOR_TESTING_ONLY } from '../src/PointToCursorHandleConverter';
import fs from 'fs';
import { overlayBodyWithKatexCSS } from './utils/overlay';
import Point from '../src/polyfills/Point';
import { assert } from '../src/utils';
import { debug_it, getStyle } from './utils/utils';
import { allPointsByIndexToSVGByProximity } from '../src/paintAllPointsByIndex';

describe('Resolve location to parsetree location', () => {
    it('Simple <div> without annotations yields no location', async () => {
        const element = await toHTMLElementWithBoundingRectangles('<div></div>');
        const result = getCursorIndexByProximity(element, { x: 50, y: 50 });

        expect(result).toBe(undefined);
    });
    it('Simple <div> clicking near the left', async () => {
        const element = await toHTMLElementWithBoundingRectangles('<div data-loc="0,1"></div>');

        const clickToTheLeft = getCursorIndexByProximity(element, { x: 50, y: 50 });
        expect(clickToTheLeft).toBe(0);
    });
    it('Simple <div> clicking near the right', async () => {
        const element = await toHTMLElementWithBoundingRectangles('<div data-loc="0,1"></div>');

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
        </span>`);

        const result = getCursorIndexByProximity(element, { x: 50, y: 50 });

        expect(result).toBe(1);
    });
});

describe('Test getDistance internally.', () => {
    it('<katex>c</katex>', async () => {
        const element = await toHTMLElementWithBoundingRectanglesWithKatex(`
        <span class="katex">
            <span class="katex-html" aria-hidden="true">
                <span class="base">
                    <span class="strut" style="height:0.43056em;vertical-align:0em;"></span>
                    <span class="mord mathnormal" data-loc="0,1">c</span>
                </span>
            </span>
        </span>`);

        const distancesToOrigin = getDistance_FOR_TESTING_ONLY(element, { x: 0, y: 0 });

        // the element's bounding rect is {0, 1, width=13.4375, 21}
        expect(distancesToOrigin.offsetToLeft).toBe(0);
        expect(distancesToOrigin.offsetToRight).toBe(-13.4375);
        expect(distancesToOrigin.offsetToTop).toBe(-1);
        expect(distancesToOrigin.offsetToBottom).toBe(-22);
    });
});

describe('Test point to cursor handler for specific points.', () => {
    debug_it('on x_1^2', async (zoom: boolean) => {
        const htmlBody = fs.readFileSync('./test/AnnotatedData/x_1^2.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);

        overlayBodyWithKatexCSS(htmlBody, allPointsByIndexToSVGByProximity(element, getStyle)); // debug purposes only

        const points = [
            { p: new Point(4, 5), index: 0 },
            { p: new Point(6, 10), index: 1 },
            { p: new Point(13, 13), index: 4 },
        ];

        for (const { p, index } of points) {
            const result = getCursorIndexByProximity(element, p);

            // debugging purposes:
            const svg = `<svg><rect x="${p.x}" y="${p.y}" width="1" height="1" style="fill: red"/></svg>`;
            overlayBodyWithKatexCSS(htmlBody + `<div>${result}</div>`, svg, './test/x_1^2_after.html'); // debug purposes only

            assert(result === index);
            console.log(`Point (${p.x}, ${p.y}) successful`);
        }
    });
});
