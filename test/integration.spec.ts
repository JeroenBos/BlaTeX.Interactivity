import { toHTMLElementWithBoundingRectangles } from './jsdom.understanding.spec';
import { allPointsByIndexToSVGByProximity } from '../src/paintAllPointsByIndex';
import { assertEqual } from '../src/utils';
import { overlay, overlayWithKatexCSS } from './utils/overlay';
import Point from '../src/polyfills/Point';
import fs from 'fs';
import { getTestableSvgPart } from './utils/utils';

export const debugGetBoundingRects = (someElementOrDocument: Element | Document, ...ids: string[]) => {
    const document =
        someElementOrDocument instanceof Element ? someElementOrDocument.ownerDocument : someElementOrDocument;

    const result = [];
    for (const id of ids) {
        result.push(document.getElementById(id).getBoundingClientRect());
    }
    return result;
};
const getStyle = (value: number): string => {
    const common = '; stroke: black; stroke-width: 1; ';
    if (value === -1) return 'fill:gray;fill-rule: evenodd';
    switch (value % 10) {
        case 0:
            return 'fill:black;fill-rule: evenodd' + common;
        case 1:
            return 'fill:red;fill-rule: evenodd' + common;
        case 2:
            return 'fill:blue;fill-rule: evenodd' + common;
        case 3:
            return 'fill:purple;fill-rule: evenodd' + common;
        case 4:
            return 'fill:light-blue;fill-rule: evenodd' + common;
        case 5:
            return 'fill:orange;fill-rule: evenodd' + common;
        case 6:
            return 'fill:cyan;fill-rule: evenodd' + common;
        case 7:
            return 'fill:light-green;fill-rule: evenodd' + common;
        case 8:
            return 'fill:light-gray;fill-rule: evenodd' + common;
        case 9:
            return 'fill:green;fill-rule: evenodd' + common;
        default:
            return 'fill:yellow;fill-rule: evenodd' + common;
    }
};

describe('Color HTML based on source locations', () => {
    it('<div>TEXT</div>', async () => {
        const html = '<div>TEXT</div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="784" height="18">
<path d="M792,0 0,0 0,26 792,26 792,0" />
</svg>`
        );
    });

    it('<div data-loc="0,1">TEXT</div>', async () => {
        const html = '<div data-loc="0,1">TEXT</div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="784" height="18">
<path d="M392,0 0,0 0,26 392,26 392,0" />
<path d="M792,26 792,0 400,0 400,0 392,0 392,26 792,26" />
</svg>`
        );
    });

    it('<div><div data-loc="0,1">TEXT</div><div data-loc="1,2">TEXT</div></div>', async () => {
        const html = '<div><div data-loc="0,1">TEXT</div><div data-loc="1,2">TEXT</div></div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="784" height="36">
<path d="M392,0 0,0 0,44 392,44 392,0" />
<path d="M792,44 792,0 400,0 400,0 392,0 392,44 792,44" />
</svg>`
        );
    });

    it('<div><span data-loc="0,1">TEXT</span><span data-loc="1,2">TEXT</span></div>', async () => {
        const html = '<div><span data-loc="0,1">TEXT</span><span data-loc="1,2">TEXT</span></div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="784" height="18">
<path d="M21,0 0,0 0,26 21,26 21,0" />
<path d="M62,0 21,0 21,26 62,26 62,0" />
<path d="M62,26 106,26 106,0 62,0 62,26
 M106,26 204,26 204,0 106,0 106,26
 M204,26 400,26 400,0 204,0 204,26
 M400,26 792,26 792,0 400,0 400,26" />
</svg>`
        );
    });

    it('f(x)', async () => {
        const html = fs.readFileSync('./test/AnnotatedData/f(x).html').toString();
        const element = await toHTMLElementWithBoundingRectangles(html, true);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        overlay(html, svg, new Point(8, 8)); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="25.703125" height="17">
<path d="M10,0 4,0 4,0 3,0 3,25 10,25 10,0" />
<path d="M10,25 17,25 17,0 11,0 11,0 10,0 10,25" />
<path d="M24,0 17,0 17,25 24,25 24,0" />
<path d="M3,0 0,0 0,25 3,25 3,0" />
<path d="M33.703125,25 33.703125,0 26,0 26,0 24,0 24,25 33.703125,25" />
</svg>`
        );
    });

    it('x to the 2', async () => {
        const htmlElement = fs.readFileSync('./test/AnnotatedData/x^2 with horizontal offset.html').toString();
        const element = (await toHTMLElementWithBoundingRectangles(htmlElement, true)) as HTMLDivElement;
        // const hint0 = middle(element.ownerDocument.getElementById("hint0").getBoundingClientRect());
        // const hints = [hint0];
        // const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createWithExtraSeeds(hints));
        const svg = allPointsByIndexToSVGByProximity(
            element,
            getStyle,
            undefined,
            'stroke:red; stroke-width: 0.1px'
            // 'fill:green; stroke-width: 0.1px',
        );

        overlayWithKatexCSS(htmlElement, svg, new Point(0, 0), 1); // debug purposes only
        const debugRects = debugGetBoundingRects(element, 'x', '2'); // eslint-disable-line @typescript-eslint/no-unused-vars

        const testableSvgPart = getTestableSvgPart(svg).replace(/\n<rect.*\/>/g, '');
        assertEqual(
            testableSvgPart,
            `<svg width="17.421875" height="21">
<path d="M5,0 0,0 0,30 5,30 5,0" />
<path d="M14,30 25.421875,30 25.421875,0 16,0 16,0 14,0 14,30
 M18,9 18,9 15,9 15,9 18,9" />
<path d="M14,0 6,0 6,0 5,0 5,30 14,30 14,0" />
</svg>`
        );
    });

    //     return;
    //     it('Annotated complicated expression', async () => {
    //         const htmlElement = fs.readFileSync('./test/AnnotatedData/AnnotatedExpression.html').toString();
    //         const element = (await toHTMLElementWithBoundingRectangles(htmlElement, true)) as HTMLDivElement;
    //         const hint0 = middle(element.ownerDocument.getElementById('hint0').getBoundingClientRect());
    //         const hints = [hint0];
    //         const svg = allPointsByIndexToSVGByProximity(element, getStyle, Configuration.createWithExtraSeeds(hints));

    //         overlayWithKatexCSS(htmlElement, svg, new Point(8, 8)); // debug purposes only

    //         assert(
    //             svg ===
    //                 `<svg width="784" height="46.15625">
    // <path d="M11,0 4,0 4,54.15625 11,54.15625 11,0" style="fill:blue;fill-rule: evenodd" />
    // <path d="M183,0 183,54.15625 204,54.15625 204,54.15625 400,54.15625 400,0 183,0
    //  M400,0 400,54.15625 792,54.15625 792,0 400,0" style="fill:red;fill-rule: evenodd" />
    // <path d="M4,0 0,0 0,54.15625 4,54.15625 4,0" style="fill:black;fill-rule: evenodd" />
    // <path d="M31,0 20,0 20,54.15625 31,54.15625 31,0" style="fill:red;fill-rule: evenodd" />
    // <path d="M42,0 31,0 31,54.15625 42,54.15625 42,0" style="fill:purple;fill-rule: evenodd" />
    // <path d="M51,0 42,0 42,54.15625 51,54.15625 51,0" style="fill:light-blue;fill-rule: evenodd" />
    // <path d="M92,54.15625 100,54.15625 100,0 92,0 92,54.15625" style="fill:purple;fill-rule: evenodd" />
    // <path d="M120,54.15625 120,0 110,0 110,54.15625 120,54.15625" style="fill:light-green;fill-rule: evenodd" />
    // <path d="M167,54.15625 174,54.15625 174,0 167,0 167,54.15625" style="fill:light-green;fill-rule: evenodd" />
    // <path d="M20,0 11,0 11,54.15625 20,54.15625 20,0" style="fill:black;fill-rule: evenodd" />
    // <path d="M56,54.15625 62,54.15625 62,0 56,0 56,54.15625" style="fill:black;fill-rule: evenodd" />
    // <path d="M62,54.15625 67,54.15625 67,0 62,0 62,54.15625" style="fill:blue;fill-rule: evenodd" />
    // <path d="M72,54.15625 76,54.15625 76,0 72,0 72,54.15625" style="fill:light-gray;fill-rule: evenodd" />
    // <path d="M84,54.15625 92,54.15625 92,0 84,0 84,54.15625" style="fill:green;fill-rule: evenodd" />
    // <path d="M100,54.15625 110,54.15625 110,0 100,0 100,54.15625" style="fill:cyan;fill-rule: evenodd" />
    // <path d="M132,0 127,0 127,54.15625 132,54.15625 132,0" style="fill:red;fill-rule: evenodd" />
    // <path d="M139,0 132,0 132,54.15625 139,54.15625 139,0" style="fill:blue;fill-rule: evenodd" />
    // <path d="M146,0 139,0 139,54.15625 146,54.15625 146,0" style="fill:light-green;fill-rule: evenodd" />
    // <path d="M151,54.15625 156,54.15625 156,0 151,0 151,54.15625" style="fill:red;fill-rule: evenodd" />
    // <path d="M167,0 161,0 161,54.15625 167,54.15625 167,0" style="fill:purple;fill-rule: evenodd" />
    // <path d="M174,54.15625 183,54.15625 183,0 174,0 174,54.15625" style="fill:light-gray;fill-rule: evenodd" />
    // <path d="M56,0 51,0 51,54.15625 56,54.15625 56,0" style="fill:orange;fill-rule: evenodd" />
    // <path d="M72,0 67,0 67,54.15625 72,54.15625 72,0" style="fill:black;fill-rule: evenodd" />
    // <path d="M76,54.15625 79,54.15625 79,0 76,0 76,54.15625" style="fill:cyan;fill-rule: evenodd" />
    // <path d="M84,0 79,0 79,54.15625 84,54.15625 84,0" style="fill:light-green;fill-rule: evenodd" />
    // <path d="M124,0 120,0 120,54.15625 124,54.15625 124,0" style="fill:black;fill-rule: evenodd" />
    // <path d="M127,54.15625 127,0 124,0 124,54.15625 127,54.15625" style="fill:light-gray;fill-rule: evenodd" />
    // <path d="M151,0 146,0 146,54.15625 151,54.15625 151,0" style="fill:light-gray;fill-rule: evenodd" />
    // <path d="M161,0 156,0 156,54.15625 161,54.15625 161,0" style="fill:blue;fill-rule: evenodd" />
    // </svg>`
    //         );
    //     });
});

// function middle(rect: DOMRect): Point {
// return new Point((rect.right - rect.left) / 2, (rect.bottom - rect.top) / 2);
// }
