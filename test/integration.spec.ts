import { toHTMLElementWithBoundingRectangles } from './jsdom.understanding.spec';
import { allPointsByIndexToSVGByProximity } from '../src/paintAllPointsByIndex';
import { assertEqual } from '../src/utils';
import { overlayBodyWithKatexCSS } from './utils/overlay';
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
    const common = '; opacity: 50%; stroke: black; stroke-width: 0.1; ';
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
            `<svg width="1920" height="18">
<path d="M0,0 0,18 1920,18 1920,0 0,0" />
</svg>`
        );
    });

    it('<div data-loc="0,1">TEYT</div>', async () => {
        const html = '<div data-loc="0,1">TEYT</div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="18">
<path d="M1920,0 960,0 960,18 1920,18 1920,0" />
<path d="M960,0 0,0 0,18 960,18 960,0" />
</svg>`
        );
    });

    it('<div><div data-loc="0,1">TAXT</div><div data-loc="1,2">TAXT</div></div>', async () => {
        const html = '<div><div data-loc="0,1">TAXT</div><div data-loc="1,2">TAXT</div></div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="36">
<path d="M1920,0 960,0 960,36 1920,36 1920,0" />
<path d="M960,36 960,0 0,0 0,36 960,36" />
</svg>`
        );
    });

    it('<div><span data-loc="0,1">TUXT</span><span data-loc="1,2">TUXT</span></div>', async () => {
        const html = '<div><span data-loc="0,1">TUXT</span><span data-loc="1,2">TUXT</span></div>';
        const element = await toHTMLElementWithBoundingRectangles(html);
        const svg = allPointsByIndexToSVGByProximity(element, getStyle);
        overlayBodyWithKatexCSS(html, svg, new Point(0, 0), 1); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            `<svg width="1920" height="18">
<path d="M0,18 22,18 22,0 0,0 0,18" />
<path d="M64,0 22,0 22,18 64,18 64,0" />
<path d="M960,0 960,0 480,0 480,0 240,0 240,0 64,0 64,18 120,18 120,18 240,18 240,18 480,18 480,18 960,18 960,18 1920,18 1920,0 960,0" />
</svg>`
        );
    });

    it('x to the 2 with horizontal offset', async () => {
        const zoom = false; // for debugging purposes // for this test it unfortunately matters

        // The unfortunate truth is that computing the boundingClientRect returns slightly different results in the headless vs headful chromedriver.
        // I have the following options to work around that:
        // - Switch to Firefox and hope it's not the same there
        // - Accept the slightly wrong values: they don't matter for testing anyway, only when I want to do a manual inspection can they be slightly off.
        // - Run the LayoutEngine headfully
        //
        // Actually you know what, I'm willing to go to the LayoutEngine to workaround it from there

        const htmlElement = fs.readFileSync('./test/AnnotatedData/x^2 with horizontal offset.html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlElement, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(
            element,
            getStyle,
            undefined,
            'stroke:red; stroke-width: 0.1px; fill: transparent',
            'fill:green; stroke-width: 0.1px; opacity: 30%'
        );

        overlayBodyWithKatexCSS(htmlElement, svg, new Point(0, 0), 1); // debug purposes only
        const debugRects = debugGetBoundingRects(element as HTMLDivElement, 'x', '2'); // eslint-disable-line @typescript-eslint/no-unused-vars

        const testableSvgPart = getTestableSvgPart(svg).replace(/\n<rect.*\/>/g, '');
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="17.425001" height="21.333334">
<path d="M105,0 100,0 100,23 105,23 105,0" />
<path d="M114,0 105,0 105,23 106,23 106,23 109,23 109,23 114,23 114,0" />
<path d="M115,23 115,23 118,23 118,0 114,0 114,23 115,23" />
</svg>`
                : `<svg width="17.421875" height="21">
<path d="M105,1 100,1 100,22 105,22 105,1" />
<path d="M106,1 105,1 105,22 106,22 106,22 109,22 109,1 106,1 106,1
 M109,22 114,22 114,1 109,1 109,22" />
<path d="M115,22 115,22 118,22 118,1 114,1 114,22 115,22" />
</svg>`
        );
    });

    it('f(x)', async () => {
        const zoom = false; // for debugging purposes // for this test it unfortunately matters

        const htmlBody = fs.readFileSync('./test/AnnotatedData/f(x).html').toString();
        const element = await toHTMLElementWithBoundingRectangles(htmlBody, true, zoom ? { zoom: 500 } : undefined);
        const svg = allPointsByIndexToSVGByProximity(element as HTMLElement, getStyle);

        overlayBodyWithKatexCSS(htmlBody, svg); // debug purposes only

        const testableSvgPart = getTestableSvgPart(svg);
        assertEqual(
            testableSvgPart,
            zoom
                ? `<svg width="25.708334" height="17.733334">
<path d="M10,0 3,0 3,19 10,19 10,0" />
<path d="M17,0 10,0 10,19 13,19 13,19 17,19 17,0" />
<path d="M24,19 24,0 19,0 19,0 17,0 17,19 19,19 19,19 24,19" />
<path d="M26,0 24,0 24,19 26,19 26,0" />
<path d="M3,0 0,0 0,19 3,19 3,0" />
</svg>`
                : `<svg width="25.703125" height="17">
<path d="M10,0 3,0 3,17 10,17 10,0" />
<path d="M13,0 13,0 10,0 10,17 13,17 13,17 17,17 17,0 13,0" />
<path d="M24,0 19,0 19,0 17,0 17,17 19,17 19,17 24,17 24,0" />
<path d="M26,0 24,0 24,17 26,17 26,0" />
<path d="M3,0 0,0 0,17 3,17 3,0" />
</svg>`
        );
    });
});
